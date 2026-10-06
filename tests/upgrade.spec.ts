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

test("shipped demo gains QA items once without overwriting edits or reseeding deletions", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#demoToggle")).toBeEnabled();
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const request = indexedDB.open("fable-sphere-library", 1);
      request.onsuccess = () => resolve(request.result);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(["entries", "meta"], "readwrite");
      const store = tx.objectStore("entries");
      store.openCursor().onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>)
          .result;
        if (!cursor) return;
        if (cursor.value.id.startsWith("matrix-")) cursor.delete();
        if (cursor.value.id === "chronicles")
          cursor.update({ ...cursor.value, name: "My edited chronicles" });
        cursor.continue();
      };
      tx.objectStore("meta").delete("matrix-demo-v1");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  });
  await page.reload();
  await expect(page.locator(".wall .card")).toHaveCount(159);
  await expect(
    page.getByRole("button", {
      name: "Open My edited chronicles",
      exact: true,
    }),
  ).toBeVisible();
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const request = indexedDB.open("fable-sphere-library", 1);
      request.onsuccess = () => resolve(request.result);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("entries", "readwrite");
      tx.objectStore("entries").delete("demo:matrix-ai-0");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  });
  await page.reload();
  await expect(page.locator(".wall .card")).toHaveCount(158);
  await expect(page.locator('[data-card="matrix-ai-0"]')).toHaveCount(0);
});
