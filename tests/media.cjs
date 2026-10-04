// Local media, gestures and accessibility integration checks. See README.md.
const assert = require("node:assert/strict");
const { waitForSettled } = require("./support.cjs");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs");
const path = require("node:path");
const origin = process.env.FABLE_URL || "http://127.0.0.1:4173";
const out = process.env.FABLE_SCREENSHOTS || "/tmp/fable-check";
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    args: ["--no-sandbox"],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1100, height: 780 },
    });
    const p = await context.newPage(),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(origin);
    await p.waitForFunction(
      () => !document.querySelector("#demoToggle").disabled,
    );
    // Mouse drag moves wall and does not accidentally enter a folder.
    const box = await p
      .locator("[data-card]:not([aria-hidden=true])")
      .first()
      .boundingBox();
    await p.mouse.move(box.x + box.width * 0.8, box.y + 100);
    await p.mouse.down();
    await p.mouse.move(box.x + 20, box.y + 100, { steps: 12 });
    await p.mouse.up();
    await waitForSettled(p);
    assert.equal(await p.locator("h1").innerText(), "A world of your own.");
    assert.ok(await p.locator("#prevBtn").isEnabled());
    await p
      .locator("[data-card]:not([aria-hidden=true]) .card-info")
      .first()
      .click();
    assert.equal(await p.locator("#inspector").isVisible(), true);
    await p.screenshot({ path: out + "/inspector.png" });
    await p.locator("#inspector [data-close-details]").click();
    // PDF original, native viewer, audio element, and offline stored reads.
    await p.locator("#demoToggle").click();
    await p.waitForFunction(
      () => !document.querySelector("#demoToggle").disabled,
    );
    const bytes = fs.readFileSync(path.join(__dirname, "fixtures/story.pdf"));
    const wav = Buffer.alloc(48);
    wav.write("RIFF", 0);
    wav.writeUInt32LE(40, 4);
    wav.write("WAVEfmt ", 8);
    wav.writeUInt32LE(16, 16);
    wav.writeUInt16LE(1, 20);
    wav.writeUInt16LE(1, 22);
    wav.writeUInt32LE(8000, 24);
    wav.writeUInt32LE(16000, 28);
    wav.writeUInt16LE(2, 32);
    wav.writeUInt16LE(16, 34);
    wav.write("data", 36);
    wav.writeUInt32LE(4, 40);
    await p.locator("#fileInput").setInputFiles([
      {
        name: "story.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from(bytes),
      },
      { name: "sound.wav", mimeType: "audio/wav", buffer: wav },
    ]);
    await p.waitForFunction(
      () =>
        !document.querySelector("#demoToggle").disabled &&
        document.querySelectorAll("[data-card]").length === 2,
    );
    await context.setOffline(true);
    await p
      .getByRole("button", { name: "Open story.pdf", exact: true })
      .click();
    await p.waitForSelector("#previewBody iframe");
    assert.ok(
      (await p.locator("#previewBody iframe").getAttribute("src")).startsWith(
        "blob:",
      ),
    );
    await p.screenshot({ path: out + "/pdf.png" });
    await p.keyboard.press("Escape");
    await p
      .getByRole("button", { name: "Open sound.wav", exact: true })
      .click();
    await p.waitForSelector("#previewBody audio");
    assert.equal(
      await p.locator("#previewBody audio").getAttribute("controls"),
      "",
    );
    // Tab focus remains within native modal.
    for (let i = 0; i < 8; i++) await p.keyboard.press("Tab");
    assert.ok(
      await p.evaluate(() => !!document.activeElement.closest("#dialog")),
    );
    await p.keyboard.press("Escape");
    assert.ok(
      await p.evaluate(() => document.activeElement.matches("[data-open]")),
    );
    await context.setOffline(false);
    await p.setViewportSize({ width: 320, height: 568 });
    await p.locator("#demoToggle").click();
    await p.waitForFunction(
      () => !document.querySelector("#demoToggle").disabled,
    );
    await p.screenshot({ path: out + "/small.png" });
    assert.ok(await p.evaluate(() => document.body.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
    // Touch uses the same spatial controller; horizontal touch drag must remain in place.
    const touch = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const t = await touch.newPage();
    await t.goto(origin);
    await t.waitForFunction(
      () => !document.querySelector("#demoToggle").disabled,
    );
    const client = await touch.newCDPSession(t);
    const r = await t.locator("[data-card]").first().boundingBox();
    const y = r.y + 100;
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 320, y }],
    });
    for (let x = 300; x >= 50; x -= 25)
      await client.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y }],
      });
    await client.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await waitForSettled(t);
    assert.ok(await t.locator("#prevBtn").isEnabled());
    assert.equal(await t.locator("h1").innerText(), "A world of your own.");
    await touch.close();
    // Storage rejection is surfaced and does not generate a pretend demo library.
    const blocked = await browser.newContext();
    await blocked.addInitScript(() => {
      indexedDB.open = () => {
        throw new DOMException("Storage blocked", "SecurityError");
      };
    });
    const b = await blocked.newPage();
    await b.goto(origin);
    await b
      .getByRole("heading", { name: "Your library needs local storage." })
      .waitFor();
    assert.equal(await b.locator("#importBtn").isDisabled(), true);
    await blocked.close();
    console.log(
      "PASS: real pointer and touch drags, desktop inspector, PDF blob viewer, WAV player, offline previews, focus trap/restore, 320px layout, and blocked-storage recovery.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
