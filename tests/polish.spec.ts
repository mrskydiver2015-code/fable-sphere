import { test, expect } from "@playwright/test";

test("96 unique items form six curated shelves and 24 navigable columns", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");
  await expect(page.locator(".card")).toHaveCount(96);
  const counts = await page.locator(".card-category").allTextContents();
  const shelves = new Map<string, number>();
  for (const label of counts) shelves.set(label, (shelves.get(label) || 0) + 1);
  expect(shelves.size).toBe(6);
  expect([...shelves.values()]).toEqual([16, 16, 16, 16, 16, 16]);
  expect(
    new Set(await page.locator(".card-title").allTextContents()).size,
  ).toBe(96);
  await page.locator("#qaToggle").click();
  await expect(page.locator("#qaMetrics")).toContainText(
    "4 rows × 24 columns · 6 in view",
  );
  await expect(page.locator("#qaMetrics")).toContainText(
    "178 × 128 px · gap 8 px · R 658 px · perspective 1100 px",
  );
  await page.locator("#qaToggle").click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (let column = 0; column < 12; column++)
    await page.locator("#nextBtn").click();
  await expect(page.locator("#nextBtn")).toBeEnabled();
  await page.locator('.card[aria-hidden="false"] .card-open').first().focus();
  await page.keyboard.press("End");
  await expect(page.locator("#nextBtn")).toBeDisabled();
  await page.keyboard.press("Home");
  await expect(page.locator("#prevBtn")).toBeDisabled();
});

for (const name of ["Pac-Man Reimagined", "Electric Maze"]) {
  test(`${name} project sheet shows the live demo link, cover and summary`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto("/");
    await expect(page.locator("#datasetPreset")).toBeEnabled();
    await page.locator("#searchInput").fill(name);
    await expect(page.locator(".card")).toHaveCount(1);
    const card = page.getByRole("button", {
      name: `Open ${name}`,
      exact: true,
    });
    await card.click();
    await expect(page.locator("#dialogTitle")).toHaveText(name);
    await expect(page.locator(".project-badge")).toHaveText(
      "Games/Interactive",
    );
    await expect(page.locator(".project-summary")).toContainText("maze study");
    await expect(page.locator("#previewBody img")).toBeVisible();
    const launch = page.getByRole("link", {
      name: "Open App / Demo",
      exact: true,
    });
    await expect(launch).toHaveAttribute(
      "href",
      "https://pacman-reimagined.vercel.app/",
    );
    await expect(launch).toHaveAttribute("target", "_blank");
    await expect(launch).toHaveAttribute("rel", "noopener noreferrer");
    const bounds = await page.locator("#dialog").boundingBox();
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(390);
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(page.locator("#dialog")).not.toBeVisible();
    await expect(card).toBeFocused();
  });
}

test("Classic cards open the same cover sheet and its action still opens collections", async ({
  page,
}) => {
  await page.goto("/#space=demo");
  await page
    .getByRole("button", { name: "Open Chronicles", exact: true })
    .click();
  await expect(page.locator("#dialogTitle")).toHaveText("Chronicles");
  await expect(page.locator(".project-badge")).toHaveText("Collection");
  await expect(page.locator("#previewBody img")).toBeVisible();
  await page
    .getByRole("button", { name: "Open App / Demo", exact: true })
    .click();
  await expect(page.locator("h1")).toHaveText("Chronicles");
  await expect(page.locator("#dialog")).not.toBeVisible();
});

test("all three empty-state ghost slots launch the native file chooser", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#space=personal");
  await expect(page.locator(".ghost-slot")).toHaveCount(3);
  await page.screenshot({ path: testInfo.outputPath("empty-ghost-slots.png") });
  for (let i = 0; i < 3; i++) {
    const chosen = page.waitForEvent("filechooser");
    await page.locator(".ghost-slot").nth(i).click();
    const chooser = await chosen;
    await chooser.setFiles(
      i === 2
        ? {
            name: "slot.txt",
            mimeType: "text/plain",
            buffer: Buffer.from("From a ghost slot"),
          }
        : [],
    );
  }
  await expect(page.locator(".card")).toHaveCount(1);
  await expect(page.locator(".ghost-slot")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Open slot.txt", exact: true })
    .click();
  await expect(page.locator("#previewBody pre")).toHaveText(
    "From a ghost slot",
  );
});

test("file drag highlights a ghost target, clears on leave and imports once on drop", async ({
  page,
}) => {
  await page.goto("/#space=personal");
  const slot = page.locator(".ghost-slot").nth(1);
  await expect(slot).toBeVisible();
  const transfer = await page.evaluateHandle(() => {
    const data = new DataTransfer();
    data.items.add(
      new File(["Dropped original"], "dropped.txt", { type: "text/plain" }),
    );
    return data;
  });
  await slot.dispatchEvent("dragenter", { dataTransfer: transfer });
  await slot.dispatchEvent("dragover", { dataTransfer: transfer });
  await expect(slot).toHaveClass(/drag-over/);
  await expect(page.locator("#dropOverlay")).toBeHidden();
  await slot.dispatchEvent("dragleave", { dataTransfer: transfer });
  await expect(slot).not.toHaveClass(/drag-over/);
  await slot.dispatchEvent("dragenter", { dataTransfer: transfer });
  await slot.dispatchEvent("dragover", { dataTransfer: transfer });
  await slot.dispatchEvent("drop", { dataTransfer: transfer });
  await expect(page.locator(".card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Open dropped.txt", exact: true })
    .click();
  await expect(page.locator("#previewBody pre")).toHaveText("Dropped original");
  await transfer.dispose();
});

test("Showcase expansion adds 56 entries without resurrecting deleted v1 items", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".card")).toHaveCount(96);
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const r = indexedDB.open("fable-sphere-library", 1);
      r.onsuccess = () => resolve(r.result);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(["entries", "meta"], "readwrite");
      tx.objectStore("entries").openCursor().onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>)
          .result;
        if (!cursor) return;
        const entry = cursor.value;
        if (
          entry.space === "showcase" &&
          (entry.seed >= 40 || entry.seed === 1)
        )
          cursor.delete();
        else if (entry.id === "showcase-0")
          cursor.update({
            ...entry,
            name: "My edited maze",
            desc: "My own summary",
          });
        cursor.continue();
      };
      tx.objectStore("meta").delete("showcase-v2");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  });
  await page.reload();
  await expect(page.locator(".card")).toHaveCount(95);
  await expect(page.locator('[data-card="showcase-1"]')).toHaveCount(0);
  await page
    .getByRole("button", { name: "Open My edited maze", exact: true })
    .click();
  await expect(page.locator(".project-summary")).toHaveText("My own summary");
  await page.reload();
  await expect(page.locator(".card")).toHaveCount(95);
});
