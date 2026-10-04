import type { LibraryEntry } from "../core/types";
import { artwork } from "../data/artwork";
import { children } from "../core/state";
export const cover = (e: LibraryEntry) => e.thumbnail || artwork(e.seed, e.art);
export const itemType = (e: LibraryEntry) =>
  e.kind === "folder" ? "Collection" : e.type || "File";
export function folderCount(e: LibraryEntry) {
  const list = children(e.id);
  return `${list.length} ${list.length === 1 ? "piece" : "pieces"}`;
}
