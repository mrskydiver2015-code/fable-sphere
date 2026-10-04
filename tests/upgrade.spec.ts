import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("existing v2 database survives the modular build without reseeding", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#demoToggle")).toBeEnabled();
  // Seed the exact schema used by the previous release, including a user-edited demo.
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("fable-sphere-library", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(["entries", "files", "meta"], "readwrite");
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        for (const name of ["entries", "files", "meta"])
          tx.objectStore(name).clear();
        const common = {
          seed: 1,
          art: "paper",
          created: 1750000000000,
          updated: 1750000000000,
          desc: "Preserved before the toolchain migration",
        };
        tx.objectStore("entries").put({
          ...common,
          key: "personal:kept-folder",
          space: "personal",
          id: "kept-folder",
          parentId: null,
          kind: "folder",
          name: "My existing library",
        });
        tx.objectStore("entries").put({
          ...common,
          key: "personal:kept-asset",
          space: "personal",
          id: "kept-asset",
          parentId: "kept-folder",
          kind: "asset",
          name: "kept.txt",
          type: "Text",
          mime: "text/plain",
          fileKey: "personal:kept-asset",
          bytes: 27,
        });
        tx.objectStore("entries").put({
          ...common,
          key: "demo:custom-demo",
          space: "demo",
          id: "custom-demo",
          parentId: null,
          kind: "folder",
          name: "My edited Demo Space",
        });
        tx.objectStore("files").put({
          key: "personal:kept-asset",
          blob: new Blob(["An original from version 2.\n"], {
            type: "text/plain",
          }),
        });
        tx.objectStore("meta").put({ key: "initialized-v2", value: true });
      });
    } finally {
      db.close();
    }
  });
  await page.goto("/#space=personal&folder=kept-folder");
  await page.reload();
  await expect(page.locator("h1")).toHaveText("My existing library");
  await page
    .getByRole("button", { name: "Open kept.txt", exact: true })
    .click();
  await expect(page.locator("#previewBody pre")).toHaveText(
    "An original from version 2.",
  );
  const saved = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download", exact: true }).click();
  const download = await saved;
  expect(await readFile((await download.path())!, "utf8")).toBe(
    "An original from version 2.\n",
  );
  await page.keyboard.press("Escape");
  await page.getByRole("switch", { name: "Dummy Data" }).click();
  await expect(
    page.getByRole("button", {
      name: "Open My edited Demo Space",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator("[data-card]")).toHaveCount(1);
});
