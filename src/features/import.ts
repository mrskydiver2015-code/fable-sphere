import type { LibraryEntry, StoredFile } from "../core/types";
import {
  ui,
  entries,
  busy,
  ready,
  setBusy,
  keyFor,
  loadEntries,
  notify,
} from "../core/state";
import { storage } from "../core/storage";
import { $ } from "../components/dom";
import { uid } from "../components/format";
import { toast, showError, updateStorageInfo } from "../components/status";
import { classify, thumbnail } from "./files";
export async function importFiles(files: File[]) {
  if (!ready || busy || !files.length) return;
  const space = ui.space,
    parentId = ui.folder;
  setBusy(true);
  toast(
    `Keeping ${files.length} ${files.length === 1 ? "piece" : "pieces"} in your ${space === "demo" ? "demo" : "personal"} library…`,
  );
  try {
    const put: LibraryEntry[] = [],
      originals: StoredFile[] = [];
    for (const file of files) {
      const id = uid(),
        key = keyFor(id, space),
        type = classify(file);
      put.push({
        key,
        id,
        space,
        parentId,
        kind: "asset",
        name: file.name,
        type,
        mime:
          file.type ||
          (type === "PDF"
            ? "application/pdf"
            : type === "Text"
              ? "text/plain"
              : "application/octet-stream"),
        bytes: file.size,
        fileKey: key,
        thumbnail: await thumbnail(file),
        seed: entries.length + put.length,
        art:
          type === "Text"
            ? "paper"
            : type === "Image"
              ? "abstract"
              : "architecture",
        desc: "Imported from your device. The original file is stored in this browser.",
        created: Date.now(),
        updated: file.lastModified || Date.now(),
      });
      originals.push({ key, blob: file });
    }
    await storage.commit({ put, files: originals });
    ui.query = "";
    ui.filter = "all";
    $<HTMLInputElement>("#searchInput").value = "";
    await loadEntries();
    notify();
    toast(
      `${files.length} ${files.length === 1 ? "original saved" : "originals saved"} in ${space === "demo" ? "Demo Space" : "Personal Workspace"}.`,
    );
    navigator.storage
      ?.persist?.()
      .then(() => updateStorageInfo())
      .catch(() => {});
  } catch (error) {
    showError(error);
  } finally {
    setBusy(false);
    updateStorageInfo();
  }
}
