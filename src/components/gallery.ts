import type { LibraryEntry } from "../core/types";
import { ui, children, lineage, currentEntries } from "../core/state";
import { $ } from "./dom";
import { icon, escapeHTML, readableSize, dateLabel } from "./format";
import { cover, itemType, folderCount } from "./pieces";
import { spatial } from "../spatial/instance";
function cardMarkup(e: LibraryEntry) {
  return `<article class="card ${ui.selected === e.id ? "selected" : ""}" data-card="${escapeHTML(e.id)}"><button class="card-open" data-open="${escapeHTML(e.id)}" aria-label="Open ${escapeHTML(e.name)}"><div class="card-art"><img src="${cover(e)}" alt="" draggable="false"><span class="art-label">${e.kind === "folder" ? "Curated collection" : escapeHTML(itemType(e))}</span>${e.kind === "folder" ? `<span class="folder-stack">${icon("folder")}${children(e.id).length}</span>` : ""}</div><div class="card-caption"><span class="card-title">${escapeHTML(e.name)}</span><span class="card-meta">${
    ui.query
      ? escapeHTML(
          lineage(e.parentId)
            .map((p) => p.name)
            .join(" / ") || "Library",
        )
      : e.kind === "folder"
        ? folderCount(e)
        : e.bytes
          ? `${escapeHTML(itemType(e))} · ${readableSize(e.bytes)}`
          : e.legacy
            ? "From your previous library"
            : e.demoArt
              ? "Visual study · Demo"
              : escapeHTML(itemType(e))
  }</span></div></button><button class="card-info" data-info="${escapeHTML(e.id)}" aria-label="Details for ${escapeHTML(e.name)}">${icon("info")}</button></article>`;
}
export function renderContent() {
  spatial.destroy();
  const content = $("#content"),
    list = currentEntries();
  $("#stage").classList.toggle(
    "spatial-stage",
    ui.view === "swipe" && list.length > 0,
  );
  content.className =
    "content" + (ui.view === "swipe" && list.length ? " spatial" : "");
  $("#spatialControls").hidden = ui.view !== "swipe" || !list.length;
  $("#footerHint").textContent =
    ui.view === "swipe"
      ? "Drag to explore · Arrow keys to wander"
      : "A little order. A lot of possibility.";
  $("#footerInfo").innerHTML =
    `<span class="accent">${String(list.length).padStart(2, "0")}</span><span>${ui.query ? "results" : ui.folder ? "pieces in this collection" : "pieces in your library"}</span><span style="opacity:.4">/</span><span>${ui.space === "demo" ? "Demo Space" : "Personal"}</span>`;
  if (!list.length) {
    content.innerHTML = `<div class="empty"><div class="empty-orbit">${icon(ui.query ? "search" : "spark")}</div><h2>${ui.query ? "A little further afield." : ui.filter !== "all" ? "Nothing of this kind." : "Room for something wonderful."}</h2><p>${ui.query ? "No matches this time. Try another word or return to your library." : ui.filter !== "all" ? "Try Everything to see the rest of this collection." : "Start a collection, bring in a favourite image, or save the first page of a story."}</p><div class="actions">${ui.query || ui.filter !== "all" ? '<button class="btn" data-clear>Clear filters</button>' : '<button class="btn" data-new-folder>New collection</button><button class="btn primary" data-import>Import files</button>'}</div></div>`;
    return;
  }
  if (ui.view === "list") {
    content.innerHTML = `<table class="library-list"><thead><tr><th scope="col">Name</th><th scope="col">Kind</th><th scope="col">Updated</th><th scope="col"><span class="sr-label">Details</span></th></tr></thead><tbody>${list.map((e) => `<tr><td><button class="list-name" data-open="${escapeHTML(e.id)}"><img src="${cover(e)}" alt=""><span>${escapeHTML(e.name)}<small>${e.kind === "folder" ? folderCount(e) : e.bytes ? readableSize(e.bytes) : "In your library"}</small></span></button></td><td style="color:var(--muted)">${escapeHTML(itemType(e))}</td><td style="color:var(--muted)">${dateLabel(e.updated)}</td><td><button class="icon-btn" data-info="${escapeHTML(e.id)}" aria-label="Details for ${escapeHTML(e.name)}">${icon("info")}</button></td></tr>`).join("")}</tbody></table>`;
  } else {
    content.innerHTML = `<div class="${ui.view === "swipe" ? "wall" : "gallery-grid"}">${list.map(cardMarkup).join("")}</div>`;
    if (ui.view === "swipe") spatial.mount(list);
  }
}
