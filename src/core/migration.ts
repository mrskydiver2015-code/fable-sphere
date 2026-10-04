import { storage, keyFor } from "./storage";
import { makeDemo } from "../data/demo";
import type { LibraryEntry } from "./types";
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
/** Validate the entire legacy pool before creating any migration records. */
export function migrateLegacy(raw: string, now = Date.now()): LibraryEntry[] {
  const value: unknown = JSON.parse(raw);
  if (
    !record(value) ||
    !Array.isArray(value.cols) ||
    !Array.isArray(value.items) ||
    !value.cols.every(record) ||
    !value.items.every(record)
  )
    throw new Error("Unrecognized previous library format.");
  const root = "legacy-library";
  const result: LibraryEntry[] = [
    {
      key: keyFor(root, "personal"),
      space: "personal",
      id: root,
      kind: "folder",
      name: "Previous library",
      parentId: null,
      seed: 1,
      art: "paper",
      desc: "Preserved from the earlier Fable Sphere. Original files were not stored by that version.",
      created: now,
      updated: now,
    },
  ];
  const mapping = new Map<unknown, string>();
  value.cols.forEach((c, i) => {
    const id = `legacy-folder-${i}`;
    mapping.set(c.id, id);
    result.push({
      key: keyFor(id, "personal"),
      space: "personal",
      id,
      kind: "folder",
      name: String(c.name || "Untitled"),
      parentId: root,
      seed: i,
      art: "landscape",
      desc: String(c.desc || ""),
      created: now,
      updated: now,
    });
  });
  value.items.forEach((e, i) => {
    const id = `legacy-item-${i}`;
    result.push({
      key: keyFor(id, "personal"),
      space: "personal",
      id,
      kind: "asset",
      name: String(e.name || "Untitled"),
      parentId: mapping.get(e.col) || root,
      seed: i,
      art: "paper",
      type: String(e.type || "File"),
      desc: String(e.desc || ""),
      legacy: true,
      thumbnail:
        typeof e.preview === "string" &&
        /^data:image\/(png|jpeg|webp|gif);base64,/i.test(e.preview)
          ? e.preview
          : null,
      created: now,
      updated: now - Math.max(0, Number(e.modMin) || 0) * 60000,
    });
  });
  return result;
}
export async function initializeData(): Promise<{
  migrated: number;
  warning?: string;
}> {
  if (await storage.read("meta", "initialized-v2")) return { migrated: 0 };
  const put = makeDemo();
  let migrated = 0,
    warning: string | undefined;
  try {
    const raw = localStorage.getItem("fable-sphere-pass1");
    if (raw) {
      const legacy = migrateLegacy(raw);
      put.push(...legacy);
      migrated = legacy.filter((e) => e.kind === "asset").length;
    }
  } catch {
    warning =
      "The previous library could not be migrated. Its original localStorage data has been left untouched.";
  }
  await storage.commit({ put, meta: [{ key: "initialized-v2", value: true }] });
  return { migrated, warning };
}
