import { test, expect } from "@playwright/test";
import {
  CYLINDER,
  projectCylinder,
  projectedColumn,
  springStep,
} from "../src/spatial/cylinder";

test("reference radius, concavity and momentum are preserved", () => {
  const center = projectCylinder(0, 756),
    left = projectCylinder(-315, 756),
    right = projectCylinder(315, 756);
  expect(center.radius).toBeCloseTo(449, 0);
  expect(center.rotation).toBeCloseTo(0, 8);
  expect(left.rotation).toBeGreaterThan(30);
  expect(right.rotation).toBeLessThan(-30);
  expect(left.z).toBeCloseTo(right.z, 8);
  expect(center.z).toBeLessThan(left.z - 100);
  expect(left.x).toBeCloseTo(-right.x, 8);
  expect(Math.abs(left.x)).toBeLessThan(315);
  expect(CYLINDER.springK).toBe(0.0002);
  expect(CYLINDER.rubber).toBe(0.3);
  expect(CYLINDER.dragSensitivity).toBe(1);
  expect(projectedColumn(127.3, 1, 127.3)).toBe(3);
  expect(projectedColumn(0, 1000, 127.3)).toBe(projectedColumn(0, 6, 127.3));
});

test("spring settlement is independent of display refresh rate", () => {
  const advance = (dt: number) => {
    let position = 0,
      velocity = 1;
    for (let t = 0; t < 1600; t += dt) {
      const step = springStep(position, velocity, 500, Math.min(dt, 1600 - t));
      position = step.position;
      velocity = step.velocity;
    }
    return { position, velocity };
  };
  const slow = advance(1000 / 60),
    fast = advance(1000 / 120);
  expect(slow.position).toBeCloseTo(fast.position, 8);
  expect(slow.position).toBeCloseTo(500, 3);
  expect(Math.abs(fast.velocity)).toBeLessThan(0.02);
});

test("rendered SWIPE bends inward, stays clickable and leaves controls flat", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");
  await expect(page.locator("#demoToggle")).toBeEnabled();
  const geometry = await page.locator(".wall .card").evaluateAll((cards) =>
    cards.map((card) => {
      const m = new DOMMatrix(getComputedStyle(card).transform);
      return {
        x: m.m41,
        z: m.m43,
        rotation: (Math.atan2(m.m13, m.m11) * 180) / Math.PI,
      };
    }),
  );
  // Column-major layout: two rows per column at this viewport height.
  const left = geometry[0],
    center = geometry[2],
    right = geometry[4];
  expect(left.z).toBeGreaterThan(center.z + 50);
  expect(right.z).toBeGreaterThan(center.z + 50);
  expect(Math.abs(left.rotation)).toBeGreaterThan(25);
  expect(Math.abs(right.rotation)).toBeGreaterThan(25);
  expect(left.rotation * right.rotation).toBeLessThan(0);
  for (const selector of [".topbar", ".toolbar", ".sidebar"])
    await expect(page.locator(selector)).toHaveCSS("transform", "none");
  await page.screenshot({ path: testInfo.outputPath("cylinder-desktop.png") });
  await page
    .getByRole("button", { name: "Open Chronicles", exact: true })
    .click();
  await expect(page.locator("h1")).toHaveText("Chronicles");
  await page
    .getByRole("button", { name: "Open Deep Forest", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Details for A place between trees",
      exact: true,
    })
    .click();
  await expect(page.locator("#inspector")).toBeVisible();
  await expect(page.locator("#inspector")).toHaveCSS("transform", "none");
  await page.locator("#inspector [data-close-details]").click();
  await page
    .getByRole("button", { name: "Open A place between trees", exact: true })
    .click();
  await expect(page.locator("#previewBody img")).toBeVisible();
});

test("drag rotates cards along the arc and responsive resizing keeps them reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1100, height: 780 });
  await page.goto("/");
  await expect(page.locator("#demoToggle")).toBeEnabled();
  const card = page.locator(".wall .card").first();
  const box = (await card.boundingBox())!;
  const before = await card.evaluate((node) => {
    const m = new DOMMatrix(getComputedStyle(node).transform);
    return { z: m.m43, rotation: m.m13 };
  });
  await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.4);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width * 0.65 - 100,
    box.y + box.height * 0.4,
    { steps: 10 },
  );
  const during = await card.evaluate((node) => {
    const m = new DOMMatrix(getComputedStyle(node).transform);
    return { z: m.m43, rotation: m.m13 };
  });
  expect(Math.abs(during.rotation - before.rotation)).toBeGreaterThan(0.05);
  expect(Math.abs(during.z - before.z)).toBeGreaterThan(20);
  await page.mouse.up();
  await expect(page.locator("h1")).toHaveText("A world of your own.");
  // Reduced motion must finish in place and resizing must not leave hidden focus targets.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  const visible = page.locator('.wall .card[aria-hidden="false"] .card-open');
  await expect(visible.first()).toBeVisible();
  await visible.first().focus();
  await page.keyboard.press("End");
  const focused = page.locator(".card-open:focus");
  await expect(focused).toBeVisible();
  await expect(focused.locator("..")).toHaveAttribute("aria-hidden", "false");
  await page.keyboard.press("Enter");
  await expect(page.locator("h1")).not.toHaveText("A world of your own.");
});
