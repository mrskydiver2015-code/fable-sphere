import { test, expect } from "@playwright/test";

test("Showcase is the default with 40 decoded original covers and working previews", async ({
  page,
}) => {
  await page.goto("/");
  const preset = page.getByRole("combobox", { name: "Dataset preset" });
  await expect(preset).toBeEnabled();
  await expect(preset).toHaveValue("showcase");
  await expect(page.locator(".card")).toHaveCount(40);
  const covers = await page
    .locator(".card-art img")
    .evaluateAll(async (images) => {
      const pictures = images as HTMLImageElement[];
      await Promise.all(pictures.map((image) => image.decode()));
      return pictures.map((image) => ({
        url: image.src,
        width: image.naturalWidth,
        height: image.naturalHeight,
      }));
    });
  expect(new Set(covers.map((cover) => cover.url)).size).toBe(40);
  expect(
    covers.every((cover) => cover.width === 1280 && cover.height === 800),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Open Pac-Man Reimagined", exact: true })
    .click();
  await expect(page.locator("#previewBody img")).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download", exact: true }).click();
  expect((await downloadPromise).suggestedFilename()).toBe(
    "Pac-Man Reimagined.svg",
  );
});

test("presets persist independently, Empty onboards and uploaded files survive switching", async ({
  page,
}) => {
  await page.goto("/");
  const preset = page.getByRole("combobox", { name: "Dataset preset" });
  await expect(preset).toBeEnabled();
  await preset.selectOption("classic");
  await expect(page.locator(".card")).toHaveCount(159);
  await page.goto("/");
  await expect(preset).toHaveValue("classic");
  await expect(page.locator(".card")).toHaveCount(159);
  await preset.selectOption("empty");
  await expect(page.locator(".card")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Room for something wonderful." }),
  ).toBeVisible();
  await expect(page.locator(".empty [data-import]")).toBeVisible();
  await page.locator("#fileInput").setInputFiles({
    name: "my-note.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Keep this original."),
  });
  await expect(
    page.getByRole("button", { name: "Open my-note.txt", exact: true }),
  ).toBeVisible();
  await preset.selectOption("showcase");
  await expect(page.locator(".card")).toHaveCount(40);
  await preset.selectOption("empty");
  await page.reload();
  await expect(preset).toHaveValue("empty");
  await expect(page.locator(".card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Open my-note.txt", exact: true })
    .click();
  await expect(page.locator("#previewBody pre")).toHaveText(
    "Keep this original.",
  );
});

for (const viewport of [
  { width: 844, height: 390 },
  { width: 1024, height: 500 },
  { width: 1366, height: 520 },
]) {
  test(`landscape uses one toolbar and uniformly scales the full camera at ${viewport.width}×${viewport.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.locator("#datasetPreset")).toBeEnabled();
    await expect(page.locator(".sidebar")).toBeHidden();
    await expect(page.locator("#menuBtn")).toBeVisible();
    const geometry = await page.evaluate(() => {
      const camera = document.querySelector<HTMLElement>(".cylinder-camera")!;
      const card = document.querySelector<HTMLElement>(".card")!;
      const stage = document.querySelector("#stage")!.getBoundingClientRect();
      const matrix = new DOMMatrix(getComputedStyle(camera).transform);
      return {
        toolbar: document.querySelector(".topbar")!.getBoundingClientRect()
          .height,
        width: stage.width,
        left: stage.left,
        scaleX: matrix.a,
        scaleY: matrix.d,
        cardWidth: parseFloat(card.style.width),
        cardHeight: parseFloat(card.style.height),
        documentHeight: document.documentElement.scrollHeight,
      };
    });
    expect(geometry.toolbar).toBeLessThanOrEqual(42);
    expect(geometry.width).toBe(viewport.width);
    expect(geometry.left).toBe(0);
    expect(geometry.scaleX).toBeGreaterThan(0.5);
    expect(geometry.scaleX).toBeLessThan(1);
    expect(geometry.scaleX).toBe(geometry.scaleY);
    expect(geometry.cardWidth).toBe(178);
    expect(geometry.cardWidth / geometry.cardHeight).toBe(1.6);
    expect(geometry.documentHeight).toBe(viewport.height);
    await page.screenshot({
      path: testInfo.outputPath("showcase-landscape.png"),
    });
    await page.locator("#menuBtn").click();
    await expect(page.locator(".mobile-nav")).toBeVisible();
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", {
        name: "Details for Pac-Man Reimagined",
        exact: true,
      })
      .click();
    await expect(page.locator("#dialog")).toBeVisible();
  });
}
