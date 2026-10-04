import type { Space } from "./types";
import {
  busy,
  ready,
  ui,
  entries,
  setBusy,
  loadEntries,
  lineage,
  notify,
} from "./state";
import { showError } from "../components/status";
import { $ } from "../components/dom";
const viewMemory = new Map<string, number>();
export function readRoute(): { space: Space; folder: string | null } {
  const p = new URLSearchParams(location.hash.slice(1));
  return {
    space: p.get("space") === "personal" ? "personal" : "demo",
    folder: p.get("folder") || null,
  };
}
export function writeRoute(replace = false) {
  const p = new URLSearchParams({ space: ui.space });
  if (ui.folder) p.set("folder", ui.folder);
  history[replace ? "replaceState" : "pushState"]({}, "", `#${p}`);
}
export async function navigate(
  folder: string | null = null,
  space = ui.space,
  { historyWrite = true } = {},
) {
  if (busy || !ready) return;
  viewMemory.set(`${ui.space}:${ui.folder}`, ui.index);
  if (space !== ui.space) {
    setBusy(true);
    const previous = ui.space;
    try {
      ui.space = space;
      ui.selected = null;
      await loadEntries();
    } catch (error) {
      ui.space = previous;
      showError(error);
      return;
    } finally {
      setBusy(false);
    }
  }
  ui.folder =
    folder && entries.some((e) => e.id === folder && e.kind === "folder")
      ? folder
      : null;
  ui.query = "";
  ui.filter = "all";
  ui.selected = null;
  $<HTMLInputElement>("#searchInput").value = "";
  ui.index = viewMemory.get(`${ui.space}:${ui.folder}`) || 0;
  lineage(ui.folder).forEach((e) => ui.expanded.add(e.id));
  if (historyWrite) writeRoute();
  notify();
}
