/* Run with Playwright installed: node tests/library.cjs.
   Start a static server separately. FABLE_URL defaults to localhost:4173. */
const assert = require("node:assert/strict");
const {
  readStore,
  waitForSettled,
  assertInstantMotion,
} = require("./support.cjs");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const origin = process.env.FABLE_URL || "http://127.0.0.1:4173";
const out = process.env.FABLE_SCREENSHOTS || "/tmp/fable-check";
const fs = require("node:fs");
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    args: ["--no-sandbox"],
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    acceptDownloads: true,
  });
  const page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  const waitReady = () =>
    page.waitForFunction(
      () => document.querySelector("#demoToggle").disabled === false,
    );
  const home = () => page.locator('#breadcrumbs [data-nav=""]').click();
  const close = () =>
    page.locator("#dialog [data-close-dialog]").first().click();
  async function folder(name) {
    await page.locator("#newFolderBtn").click();
    await page.getByLabel("Name", { exact: true }).fill(name);
    await page
      .getByRole("button", { name: "Create collection", exact: true })
      .click();
    await page.waitForFunction(() => !document.querySelector("#dialog").open);
    await waitReady();
  }
  try {
    await page.goto(origin);
    await waitReady();
    assert.equal(await page.locator("[data-card]").count(), 6);
    await page.screenshot({ path: out + "/desktop.png" });
    await page
      .getByRole("button", { name: "Open Chronicles", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Open Deep Forest", exact: true })
      .click();
    assert.match(
      await page.locator("#breadcrumbs").innerText(),
      /Chronicles[\s\S]*Deep Forest/,
    );
    await page
      .getByRole("button", { name: "Open The forest remembers", exact: true })
      .click();
    await page.waitForSelector("#previewBody pre");
    assert.match(
      await page.locator("#previewBody").innerText(),
      /Every path began as a question/,
    );
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("dialog[open]").count(), 0);
    await page.goBack();
    assert.equal(await page.locator("h1").innerText(), "Chronicles");
    await home();
    await page.locator("#demoToggle").click();
    await waitReady();
    assert.match(
      await page.locator("#content").innerText(),
      /Room for something wonderful/,
    );
    await folder("My stories");
    await page
      .getByRole("button", { name: "Open My stories", exact: true })
      .click();
    await folder("Deep forest");
    await page
      .getByRole("button", { name: "Open Deep forest", exact: true })
      .click();
    const text =
      "A real original\n\n<script>window.bad=true</script>\nÆ Ø ä 森";
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"><rect width="900" height="600" fill="#9b7652"/><circle cx="450" cy="300" r="120" fill="#e7af78"/></svg>';
    await page.locator("#fileInput").setInputFiles([
      {
        name: "chapter.txt",
        mimeType: "text/plain",
        buffer: Buffer.from(text),
      },
      {
        name: "cover.svg",
        mimeType: "image/svg+xml",
        buffer: Buffer.from(svg),
      },
      {
        name: "archive.bin",
        mimeType: "application/octet-stream",
        buffer: Buffer.from([0, 255, 128, 1, 2, 3]),
      },
    ]);
    await page.waitForFunction(
      () =>
        document.querySelectorAll("[data-card]").length === 3 &&
        !document.querySelector("#demoToggle").disabled,
    );
    await page.reload();
    await waitReady();
    assert.equal(await page.locator("[data-card]").count(), 3);
    assert.match(
      await page.locator("#breadcrumbs").innerText(),
      /My stories[\s\S]*Deep forest/,
    );
    await page
      .getByRole("button", { name: "Open chapter.txt", exact: true })
      .click();
    await page.waitForSelector("#previewBody pre");
    assert.equal(await page.locator("#previewBody pre").textContent(), text);
    assert.equal(await page.evaluate(() => window.bad), undefined);
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: "Download", exact: true }).click();
    const download = await downloadPromise;
    assert.equal(fs.readFileSync(await download.path(), "utf8"), text);
    await close();
    await page
      .getByRole("button", { name: "Open cover.svg", exact: true })
      .click();
    await page.waitForSelector("#previewBody img");
    await page
      .getByRole("button", { name: "Actual size", exact: true })
      .click();
    assert.equal(await page.locator("#previewBody img.zoomed").count(), 1);
    await close();
    await page
      .getByRole("button", { name: "Open archive.bin", exact: true })
      .click();
    await page.waitForSelector(".preview-unsupported");
    const binaryDownload = page.waitForEvent("download");
    await page.getByRole("link", { name: "Download", exact: true }).click();
    assert.deepEqual(
      fs.readFileSync(await (await binaryDownload).path()),
      Buffer.from([0, 255, 128, 1, 2, 3]),
    );
    await close();
    // Mobile details and navigation stay accessible at narrow widths.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Grid view", exact: true }).click();
    await page
      .getByRole("button", { name: "Details for chapter.txt", exact: true })
      .click();
    assert.equal(await page.locator("dialog[open] .inspector").count(), 1);
    await page
      .getByRole("button", { name: "Edit / move", exact: true })
      .click();
    await page
      .getByLabel("Location", { exact: true })
      .selectOption({ label: "My stories" });
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await page.waitForFunction(() => !document.querySelector("#dialog").open);
    assert.equal(await page.locator("#content [data-open]").count(), 2);
    await page
      .getByRole("button", { name: "Open library navigation", exact: true })
      .click();
    await page.locator('.mobile-nav [data-nav=""]').click();
    await page
      .getByRole("button", { name: "Open My stories", exact: true })
      .click();
    assert.equal(
      await page
        .getByRole("button", { name: "Open chapter.txt", exact: true })
        .count(),
      1,
    );
    await page.locator("#demoToggle").click();
    await waitReady();
    assert.equal(await page.locator("[data-card]").count(), 6);
    await page.getByRole("button", { name: "SWIPE view", exact: true }).click();
    await page.screenshot({ path: out + "/mobile.png" });
    assert.equal(
      await page.evaluate(() => document.body.scrollWidth <= innerWidth),
      true,
    );
    // Offscreen cards cannot receive focus; Home/End expose their keyboard target.
    await page
      .locator('[data-card]:not([aria-hidden="true"]) .card-open')
      .first()
      .focus();
    await page.keyboard.press("End");
    assert.equal(
      await page.evaluate(() =>
        document.activeElement
          .closest("[data-card]")
          ?.getAttribute("aria-hidden"),
      ),
      "false",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator("#prevBtn").click();
    await assertInstantMotion(page, assert);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.locator("#prevBtn").click();
    await waitForSettled(page);
    assert.ok(await page.locator("#prevBtn").isEnabled());
    await page.locator("#searchInput").fill("Saturn");
    await page.waitForFunction(
      () => document.querySelectorAll("[data-card]").length === 1,
    );
    await page
      .getByRole("button", { name: "Open Saturn, imagined", exact: true })
      .click();
    await page.waitForSelector("#previewBody img");
    await close();
    await page.locator("#demoToggle").click();
    await waitReady();
    assert.equal(
      await page
        .getByRole("button", { name: "Open My stories", exact: true })
        .count(),
      1,
    );
    // Recursive deletion removes blobs, without touching Demo.
    await page
      .getByRole("button", { name: "Details for My stories", exact: true })
      .click();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page.locator("#confirmDelete").click();
    await page.waitForFunction(() => !document.querySelector("#dialog").open);
    assert.match(
      await page.locator("#content").innerText(),
      /Room for something wonderful/,
    );
    const records = await readStore(page, "entries");
    const remaining = {
      entries: records.filter((e) => e.space === "personal").length,
      files: (await readStore(page, "files")).length,
      demo: records.filter((e) => e.space === "demo").length,
    };
    assert.equal(remaining.entries, 0);
    assert.equal(remaining.files, 0);
    assert.equal(remaining.demo, 24);
    // Atomic failure: failed save creates no phantom folder, keeps dialog editable.
    await page.evaluate(() => {
      window.originalPut = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function () {
        throw new DOMException("Full", "QuotaExceededError");
      };
    });
    await page.locator("#newFolderBtn").click();
    await page.getByLabel("Name", { exact: true }).fill("Not saved");
    await page
      .getByRole("button", { name: "Create collection", exact: true })
      .click();
    await page.waitForFunction(() =>
      document
        .querySelector("#toast")
        .textContent.includes("Nothing was saved"),
    );
    assert.equal(await page.locator("dialog[open]").count(), 1);
    assert.equal(await page.locator("[data-card]").count(), 0);
    await page.evaluate(() => {
      IDBObjectStore.prototype.put = window.originalPut;
    });
    await close();
    await page.evaluate(() => {
      window.originalPut = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function (...args) {
        if (this.name === "files")
          throw new DOMException("Full", "QuotaExceededError");
        return window.originalPut.apply(this, args);
      };
    });
    await page.locator("#fileInput").setInputFiles({
      name: "rollback.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Must not leave metadata behind"),
    });
    await page.waitForFunction(
      () => !document.querySelector("#demoToggle").disabled,
    );
    assert.equal(
      (await readStore(page, "entries")).filter((e) => e.space === "personal")
        .length,
      0,
    );
    assert.equal((await readStore(page, "files")).length, 0);
    await page.evaluate(() => {
      IDBObjectStore.prototype.put = window.originalPut;
    });
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.locator("#demoToggle").click();
    await waitReady();
    await page.getByRole("button", { name: "Grid view", exact: true }).click();
    await page.screenshot({ path: out + "/grid.png" });
    assert.deepEqual(
      errors.filter(
        (e) => !e.includes("QuotaExceededError") && !e.includes("Full"),
      ),
      [],
    );
    // Legacy migration happens once, preserving the untouched source pool.
    const legacyContext = await browser.newContext();
    await legacyContext.addInitScript(() => {
      localStorage.setItem(
        "fable-sphere-pass1",
        JSON.stringify({
          cols: [{ id: "old", name: "Old work", desc: "Keep me" }],
          items: [
            {
              id: "a",
              col: "old",
              name: "Legacy item",
              type: "Note",
              modMin: 10,
            },
          ],
        }),
      );
    });
    const legacy = await legacyContext.newPage();
    await legacy.goto(origin + "/#space=personal");
    await legacy.waitForFunction(
      () => !document.querySelector("#demoToggle").disabled,
    );
    assert.equal(
      await legacy
        .getByRole("button", { name: "Open Previous library", exact: true })
        .count(),
      1,
    );
    await legacy
      .getByRole("button", { name: "Open Previous library", exact: true })
      .click();
    await legacy
      .getByRole("button", { name: "Open Old work", exact: true })
      .click();
    await legacy
      .getByRole("button", { name: "Open Legacy item", exact: true })
      .click();
    await legacy.waitForSelector(".preview-unsupported");
    assert.match(
      await legacy.locator("#previewBody").innerText(),
      /original file was not saved/,
    );
    await legacy.reload();
    await legacy.waitForFunction(
      () => !document.querySelector("#demoToggle").disabled,
    );
    assert.equal(
      (await readStore(legacy, "entries")).filter((e) => e.space === "personal")
        .length,
      3,
    );
    assert.ok(
      await legacy.evaluate(() => localStorage.getItem("fable-sphere-pass1")),
    );
    await legacyContext.close();
    console.log(
      "PASS: navigation/history, nested collections, isolated spaces, import/reload, exact original downloads, safe text, image zoom, mobile drawers, move, keyboard, reduced motion, spring settling, search, recursive blob deletion, atomic failure, and legacy migration.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
