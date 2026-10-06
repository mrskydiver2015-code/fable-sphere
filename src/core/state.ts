import type { LibraryEntry, UiState } from "./types";
import { storage, keyFor as storageKey } from "./storage";
export let entries: LibraryEntry[] = [];
export let busy = false;
export let ready = false;
export const ui: UiState = {
  space: "showcase",
  folder: null,
  view: "swipe",
  query: "",
  filter: "all",
  sort: "curated",
  selected: null,
  expanded: new Set(),
  index: 0,
};
type Change = "render" | "busy";
const subscribers = new Set<(change: Change) => void>();
export function subscribe(listener: (change: Change) => void) {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
}
export function notify(change: Change = "render") {
  for (const listener of subscribers) listener(change);
}
export function setBusy(value: boolean) {
  busy = value;
  notify("busy");
}
export function setReady(value: boolean) {
  ready = value;
  notify("busy");
}
export const keyFor = (id: string, space = ui.space) => storageKey(id, space);
export const entryById = (id: string | null) =>
  entries.find((e) => e.id === id);
export const children = (id: string | null) =>
  entries
    .filter((e) => e.parentId === id)
    .sort((a, b) => b.created - a.created);
export function lineage(id: string | null) {
  const chain: LibraryEntry[] = [],
    seen = new Set();
  while (id) {
    const e = entryById(id);
    if (!e || seen.has(id)) break;
    seen.add(id);
    chain.unshift(e);
    id = e.parentId;
  }
  return chain;
}
export function descendants(id: string) {
  const ids = new Set([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const e of entries)
      if (e.parentId !== null && ids.has(e.parentId) && !ids.has(e.id)) {
        ids.add(e.id);
        changed = true;
      }
  }
  return ids;
}
export async function loadEntries() {
  entries = (await storage.read("entries")).filter((e) => e.space === ui.space);
  if (
    ui.folder &&
    !entries.some((e) => e.id === ui.folder && e.kind === "folder")
  )
    ui.folder = null;
  if (ui.selected && !entryById(ui.selected)) ui.selected = null;
}
export function currentEntries() {
  let list = ui.query ? entries.slice() : children(ui.folder);
  const q = ui.query.trim().toLowerCase();
  if (q)
    list = list.filter((e) =>
      `${e.name} ${e.desc || ""} ${lineage(e.parentId)
        .map((p) => p.name)
        .join(" ")}`
        .toLowerCase()
        .includes(q),
    );
  if (ui.filter === "folders") list = list.filter((e) => e.kind === "folder");
  if (ui.filter === "images") list = list.filter((e) => e.type === "Image");
  if (ui.filter === "documents")
    list = list.filter((e) => e.kind === "asset" && e.type !== "Image");
  return list.sort((a, b) =>
    ui.sort === "name"
      ? a.name.localeCompare(b.name)
      : ui.sort === "recent"
        ? b.updated - a.updated
        : a.kind === b.kind
          ? b.created - a.created
          : a.kind === "folder"
            ? -1
            : 1,
  );
}
