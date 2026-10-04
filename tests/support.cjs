// Browser-facing assertions. No application globals or production test hooks.
async function readStore(page, store) {
  return page.evaluate(async (storeName) => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open("fable-sphere-library", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise((resolve, reject) => {
        const request = database
          .transaction(storeName, "readonly")
          .objectStore(storeName)
          .getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } finally {
      database.close();
    }
  }, store);
}
async function waitForSettled(page) {
  await page.evaluate(() => {
    window.__testMotion = undefined;
  });
  await page.waitForFunction(
    () => {
      const signature = [...document.querySelectorAll(".wall .card")]
        .map((e) => e.style.transform)
        .join("|");
      const previous = window.__testMotion;
      window.__testMotion = {
        signature,
        stable: previous?.signature === signature ? previous.stable + 1 : 0,
      };
      return window.__testMotion.stable >= 8;
    },
    undefined,
    { timeout: 8000, polling: "raf" },
  );
}
async function assertInstantMotion(page, assert) {
  const samples = await page.evaluate(async () => {
    const read = () =>
      [...document.querySelectorAll(".wall .card")]
        .map((e) => e.style.transform)
        .join("|");
    const first = read();
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    return [first, read()];
  });
  assert.equal(samples[0], samples[1]);
}
module.exports = { readStore, waitForSettled, assertInstantMotion };
