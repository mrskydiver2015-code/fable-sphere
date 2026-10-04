import type { LibraryEntry } from "../core/types";
import { ui, lineage, entryById } from "../core/state";
import { $, $$ } from "./dom";
import { icon, escapeHTML, readableSize, dateLabel } from "./format";
import { cover, itemType, folderCount } from "./pieces";
import { openDialog } from "./dialog";
function detailsMarkup(e: LibraryEntry) {
  const parent =
    lineage(e.parentId)
      .map((p) => p.name)
      .join(" / ") || "Library";
  return `<div class="detail-top"><span>Closer look</span><button class="icon-btn" data-close-details aria-label="Close details">${icon("close")}</button></div><img class="cover" src="${cover(e)}" alt=""><h2>${escapeHTML(e.name)}</h2><span style="font-size:10px;color:var(--accent)">${escapeHTML(itemType(e))}</span><p class="desc">${escapeHTML(e.desc || "A little piece of your world.")}</p><dl><dt>Location</dt><dd>${escapeHTML(parent)}</dd><dt>Updated</dt><dd>${dateLabel(e.updated)}</dd><dt>${e.kind === "folder" ? "Contains" : "Size"}</dt><dd>${e.kind === "folder" ? folderCount(e) : e.bytes ? readableSize(e.bytes) : e.legacy ? "Metadata only" : "Demo piece"}</dd><dt>Space</dt><dd>${ui.space === "demo" ? "Demo" : "Personal"}</dd></dl>${e.legacy ? '<p class="desc">The earlier app did not retain original files. Import the original to keep a complete copy.</p>' : ""}<div class="inspector-actions"><button class="btn primary" data-open="${escapeHTML(e.id)}">${e.kind === "folder" ? "Explore collection" : "Open preview"}</button><button class="btn" data-edit="${escapeHTML(e.id)}">Edit / move</button><button class="btn danger" data-delete="${escapeHTML(e.id)}">Delete</button></div>`;
}
export function renderInspector() {
  const e = entryById(ui.selected);
  $("#inspector").hidden = !e;
  $("#inspector").innerHTML = e ? detailsMarkup(e) : "";
}
export function showDetails(id: string) {
  const e = entryById(id);
  if (!e) return;
  ui.selected = id;
  if (matchMedia("(max-width:850px)").matches) {
    openDialog(
      "Piece details",
      `<div class="inspector">${detailsMarkup(e)}</div>`,
    );
  } else {
    renderInspector();
    $$("[data-card]").forEach((c) =>
      c.classList.toggle("selected", c.dataset.card === id),
    );
  }
}
