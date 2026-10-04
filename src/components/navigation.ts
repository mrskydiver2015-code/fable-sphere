import { ui, entries, children } from "../core/state";
import { icon, escapeHTML } from "./format";
const palette = [
  "#96aa8b",
  "#c6a16f",
  "#9b9ac0",
  "#7d9fae",
  "#b8887d",
  "#b9ab80",
];
export function navMarkup() {
  let out = `<button class="nav-btn ${!ui.folder && !ui.query ? "active" : ""}" data-nav="" ${!ui.folder ? 'aria-current="page"' : ""}>${icon("home")}<span class="label">My library</span><small>${entries.filter((e) => e.kind === "asset").length}</small></button><div class="nav-section">Your collections</div>`;
  function branch(parent: string | null, level: number, seen: Set<string>) {
    for (const e of children(parent).filter((e) => e.kind === "folder")) {
      if (seen.has(e.id)) continue;
      const next = new Set(seen).add(e.id);
      const subs = children(e.id).some((c) => c.kind === "folder"),
        expanded = ui.expanded.has(e.id);
      out += `<div class="tree-row" style="--level:${Math.min(level, 7)}">${subs ? `<button class="expand" data-expand="${escapeHTML(e.id)}" aria-label="${expanded ? "Collapse" : "Expand"} ${escapeHTML(e.name)}" aria-expanded="${expanded}">${icon(expanded ? "down" : "right")}</button>` : '<span style="width:22px;flex:none"></span>'}<button class="nav-btn ${ui.folder === e.id ? "active" : ""}" data-nav="${escapeHTML(e.id)}" ${ui.folder === e.id ? 'aria-current="page"' : ""}><i class="folder-dot" style="--folder:${palette[Math.abs(e.seed || 0) % 6]}"></i><span class="label">${escapeHTML(e.name)}</span><small>${children(e.id).length}</small></button></div>`;
      if (expanded) branch(e.id, level + 1, next);
    }
  }
  branch(null, 0, new Set());
  if (!entries.some((e) => e.kind === "folder"))
    out +=
      '<p style="padding:8px 12px;font-size:11px;color:var(--muted)">Your next chapter starts with a collection.</p>';
  out += `<button class="nav-btn" data-new-folder style="margin-top:12px;font-size:11px">${icon("plus")}<span>New collection</span></button>`;
  return out;
}
