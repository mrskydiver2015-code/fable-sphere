import { test, expect } from "@playwright/test";

for (const viewport of [
  { width: 1440, height: 960 },
  { width: 1366, height: 768 },
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 844, height: 390 },
  { width: 667, height: 375 },
]) {
  test(`compact shell and proportional cards at ${viewport.width}×${viewport.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.locator("#demoToggle")).toBeEnabled();
    const layout = await page.evaluate(() => {
      const stage = document.querySelector("#stage")!.getBoundingClientRect();
      const cards = [
        ...document.querySelectorAll<HTMLElement>(
          '.wall .card[aria-hidden="false"]',
        ),
      ];
      const first = cards[0];
      return {
        fraction: stage.height / innerHeight,
        pageHeight: document.documentElement.scrollHeight,
        pageWidth: document.documentElement.scrollWidth,
        ratio: parseFloat(first.style.width) / parseFloat(first.style.height),
        rows: new Set(cards.map((card) => card.style.top)).size,
        columns: new Set(cards.map((card) => card.style.transform)).size,
        searchFont: getComputedStyle(document.querySelector("#searchInput")!)
          .fontSize,
        touchAction: getComputedStyle(document.querySelector(".spatial")!)
          .touchAction,
      };
    });
    expect(layout.fraction).toBeGreaterThanOrEqual(0.74);
    expect(layout.pageHeight).toBe(viewport.height);
    expect(layout.pageWidth).toBe(viewport.width);
    expect(layout.ratio).toBeCloseTo(178 / 128, 4);
    expect(layout.rows).toBe(4);
    expect(layout.columns).toBeGreaterThanOrEqual(
      viewport.width >= 420 ? 4 : 3,
    );
    expect(layout.searchFont).toBe("16px");
    expect(layout.touchAction).toBe("pan-x pan-y");
    await page.screenshot({ path: testInfo.outputPath("swipe.png") });
    await page.getByRole("button", { name: "Grid view", exact: true }).click();
    const grid = await page.locator(".gallery-grid").evaluate((node) => ({
      columns: getComputedStyle(node).gridTemplateColumns.split(" ").length,
      cardHeight: node.firstElementChild!.getBoundingClientRect().height,
      stageHeight: document.querySelector("#stage")!.clientHeight,
      scrollHeight: document.querySelector("#content")!.scrollHeight,
    }));
    expect(grid.columns).toBeGreaterThanOrEqual(
      viewport.width <= 540 ? (viewport.width >= 420 ? 4 : 3) : 4,
    );
    expect(grid.cardHeight).toBeLessThan(160);
    expect(grid.stageHeight / grid.cardHeight).toBeGreaterThan(2);
    await page.screenshot({ path: testInfo.outputPath("grid.png") });
    // Dense cards keep their accessible full names and their previews/details usable.
    await page
      .getByRole("button", { name: "Details for Chronicles", exact: true })
      .click();
    await expect(
      page.locator(viewport.width > 850 ? "#inspector" : "#dialog"),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollHeight),
    ).toBe(viewport.height);
  });
}

test("orientation change preserves aspect, position and horizontal touch intent", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("#demoToggle")).toBeEnabled();
  const client = await context.newCDPSession(page);
  const surface = (await page.locator(".spatial").boundingBox())!;
  const x = 300,
    y = surface.y + surface.height / 2;
  const signature = () =>
    page.locator(".wall .card").first().getAttribute("style");
  const before = await signature();
  // Vertical intent must not rotate the cylinder or hijack browser panning.
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x, y: y - 80 }],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  expect(await signature()).toBe(before);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  for (let next = x - 20; next >= 60; next -= 20) {
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: next, y }],
    });
  }
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(page.locator("#prevBtn")).toBeEnabled();
  await expect(page.locator("h1")).toHaveText("A world of your own.");
  await expect(page.locator("#dialog")).not.toBeVisible();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect
    .poll(() =>
      page
        .locator(".wall .card")
        .first()
        .evaluate(
          (node) =>
            parseFloat((node as HTMLElement).style.width) /
            parseFloat((node as HTMLElement).style.height),
        ),
    )
    .toBeCloseTo(178 / 128, 4);
  await expect(page.locator("#prevBtn")).toBeEnabled();
  await context.close();
});
