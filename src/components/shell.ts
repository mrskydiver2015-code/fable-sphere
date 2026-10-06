import { spaceLabels, spacePresets } from "../core/types";
import { ui, ready, entryById, lineage, currentEntries } from "../core/state";
import { $, $$ } from "./dom";
import { icon, escapeHTML } from "./format";
import { navMarkup } from "./navigation";
import { renderInspector } from "./inspector";
import { renderContent } from "./gallery";
import { updateStorageInfo } from "./status";
export function render() {
  if (!ready) return;
  $("#navigation").innerHTML = navMarkup();
  $<HTMLSelectElement>("#datasetPreset").value = spacePresets[ui.space];
  $("#workspaceLabel").textContent = spaceLabels[ui.space];
  const folder = entryById(ui.folder);
  $("#breadcrumbs").innerHTML =
    `${ui.folder ? `<button class="icon-btn" data-up aria-label="Go to parent collection">${icon("left")}</button>` : ""}<button data-nav="" ${!ui.folder ? 'aria-current="page"' : ""}>Library</button>${lineage(
      ui.folder,
    )
      .map(
        (e, i, a) =>
          `<span aria-hidden="true">/</span><button data-nav="${escapeHTML(e.id)}" ${i === a.length - 1 ? 'aria-current="page"' : ""}>${escapeHTML(e.name)}</button>`,
      )
      .join("")}`;
  $("#eyebrow").textContent = ui.query
    ? "Across your entire space"
    : ui.space === "demo"
      ? "The demo space · Make yourself at home"
      : "Personal workspace · Yours to imagine";
  $("#pageTitle").textContent = ui.query
    ? `Results for “${ui.query}”`
    : folder
      ? folder.name
      : "A world of your own.";
  $("#pageDescription").textContent = ui.query
    ? `${currentEntries().length} discoveries in your ${spaceLabels[ui.space]} library.`
    : folder
      ? folder.desc || "A collection of things worth keeping."
      : "Places for your stories, discoveries, and things worth keeping.";
  $("#filters").innerHTML = [
    ["all", "Everything"],
    ["folders", "Collections"],
    ["images", "Images"],
    ["documents", "Documents"],
  ]
    .map(
      ([id, name]) =>
        `<button class="filter ${ui.filter === id ? "active" : ""}" data-filter="${id}" aria-pressed="${ui.filter === id}">${name}</button>`,
    )
    .join("");
  $$("[data-view]").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.view === ui.view)),
  );
  renderInspector();
  renderContent();
  updateStorageInfo();
}
