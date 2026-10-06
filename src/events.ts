import { isView, isFilter, isSort, isPreset, presetSpaces } from "./core/types";
import { $, $$, find } from "./components/dom";
import { ui, busy, ready, entryById, currentEntries } from "./core/state";
import { navigate, readRoute, writeRoute } from "./core/navigation";
import { CYLINDER, projectCylinder } from "./spatial/cylinder";
import { spatial } from "./spatial/instance";
import { render } from "./components/shell";
import { renderContent } from "./components/gallery";
import { renderInspector, showDetails } from "./components/inspector";
import { navMarkup } from "./components/navigation";
import { openDialog, closeDialog } from "./components/dialog";
import { editDialog, deleteDialog } from "./features/editor";
import { openEntry } from "./features/preview";
import { importFiles } from "./features/import";
import { icon } from "./components/format";
export function bindEvents() {
  const qaPanel = $("#qaPanel"),
    qaToggle = $("#qaToggle");
  const updateQA = () => {
    if (qaPanel.hidden) return;
    const radius = projectCylinder(0, spatial.width, spatial.curve).radius;
    $("#qaMetrics").textContent =
      `${spatial.rows} rows × ${Math.ceil(spatial.cards.length / spatial.rows)} columns · ${spatial.cols} in view · ${Math.round(spatial.cw)} × ${Math.round(spatial.ch)} px · gap ${spatial.gap} px · R ${Math.round(radius)} px · perspective ${CYLINDER.perspective} px · momentum ${CYLINDER.projectionMs} ms · spring ${CYLINDER.springK}`;
  };
  qaToggle.onclick = () => {
    qaPanel.hidden = !qaPanel.hidden;
    qaToggle.setAttribute("aria-expanded", String(!qaPanel.hidden));
    updateQA();
  };
  $("#content").addEventListener("spatialchange", updateQA);
  const setCurve = (curve: number) => {
    $<HTMLInputElement>("#qaCurve").value = String(curve);
    $("#qaCurveValue").textContent = `${curve}°`;
    spatial.setCurve(curve);
  };
  $<HTMLInputElement>("#qaCurve").oninput = (event) =>
    setCurve(Number((event.target as HTMLInputElement).value));
  $("#qaReset").onclick = () => setCurve(CYLINDER.curve);

  /* Event delegation: controls are native buttons, keyboard and touch share actions. */
  document.addEventListener("click", (e) => {
    const b = e.target instanceof Element ? e.target.closest("button") : null;
    if (!b) return;
    if (b.hasAttribute("data-close-dialog")) {
      if (!busy) closeDialog();
      return;
    }
    if (!ready || busy) return;
    if (performance.now() < spatial.suppressUntil && b.closest(".wall")) {
      e.preventDefault();
      return;
    }
    if (b.hasAttribute("data-nav")) {
      if ($<HTMLDialogElement>("#dialog").open) closeDialog();
      navigate(b.dataset.nav || null);
    } else if (b.hasAttribute("data-up"))
      navigate(entryById(ui.folder)?.parentId || null);
    else if (b.hasAttribute("data-expand")) {
      const id = b.dataset.expand;
      if (!id) return;
      ui.expanded.has(id) ? ui.expanded.delete(id) : ui.expanded.add(id);
      $("#navigation").innerHTML = navMarkup();
      const mobileNav = find(".mobile-nav");
      if (mobileNav) mobileNav.innerHTML = navMarkup();
    } else if (b.hasAttribute("data-new-folder")) editDialog();
    else if (b.hasAttribute("data-import"))
      $<HTMLInputElement>("#fileInput").click();
    else if (b.dataset.open) openEntry(b.dataset.open);
    else if (b.dataset.info) showDetails(b.dataset.info);
    else if (b.dataset.edit) editDialog(b.dataset.edit);
    else if (b.dataset.delete) deleteDialog(b.dataset.delete);
    else if (b.hasAttribute("data-close-details")) {
      ui.selected = null;
      if ($<HTMLDialogElement>("#dialog").open) closeDialog();
      renderInspector();
      $$(".card.selected").forEach((c) => c.classList.remove("selected"));
    } else if (isView(b.dataset.view)) {
      ui.view = b.dataset.view;
      ui.index = 0;
      render();
      try {
        localStorage.setItem("fable-sphere-view", ui.view);
      } catch {}
    } else if (isFilter(b.dataset.filter)) {
      ui.filter = b.dataset.filter;
      ui.index = 0;
      render();
    } else if (b.hasAttribute("data-clear")) {
      ui.query = "";
      ui.filter = "all";
      $<HTMLInputElement>("#searchInput").value = "";
      render();
    }
  });
  $<HTMLSelectElement>("#datasetPreset").onchange = (event) => {
    const value = (event.target as HTMLSelectElement).value;
    if (isPreset(value)) void navigate(null, presetSpaces[value]);
  };
  $<HTMLButtonElement>("#newFolderBtn").onclick = () => editDialog();
  $<HTMLButtonElement>("#importBtn").onclick = () => {
    if (!busy && ready) $<HTMLInputElement>("#fileInput").click();
  };
  $<HTMLInputElement>("#fileInput").onchange = () => {
    const input = $<HTMLInputElement>("#fileInput");
    const files = [...(input.files || [])];
    input.value = "";
    importFiles(files);
  };
  $<HTMLButtonElement>("#menuBtn").onclick = () =>
    openDialog(
      "Your library",
      '<nav class="mobile-nav" aria-label="Library navigation">' +
        navMarkup() +
        "</nav>",
    );
  $<HTMLButtonElement>("#prevBtn").onclick = () => {
    spatial.velocity = 0;
    spatial.snap(ui.index - 1);
  };
  $<HTMLButtonElement>("#nextBtn").onclick = () => {
    spatial.velocity = 0;
    spatial.snap(ui.index + 1);
  };
  $<HTMLSelectElement>("#sortSelect").onchange = () => {
    const value = $<HTMLSelectElement>("#sortSelect").value;
    if (!isSort(value)) return;
    ui.sort = value;
    ui.index = 0;
    renderContent();
  };
  let searchTimer: ReturnType<typeof setTimeout>;
  $<HTMLInputElement>("#searchInput").oninput = () => {
    clearTimeout(searchTimer);
    const query = $<HTMLInputElement>("#searchInput").value;
    searchTimer = setTimeout(() => {
      if (!ready || busy) return;
      ui.query = query;
      ui.index = 0;
      render();
    }, 120);
  };
  window.addEventListener("popstate", async () => {
    const route = readRoute();
    if (busy) {
      writeRoute(true);
      return;
    }
    await navigate(route.folder, route.space, { historyWrite: false });
  });
  document.addEventListener("keydown", (e) => {
    if ($<HTMLDialogElement>("#dialog").open || !ready || busy) return;
    if (!(e.target instanceof Element)) return;
    const inField = e.target.matches("input,textarea,select");
    if (e.key === "/" && !inField) {
      e.preventDefault();
      $<HTMLInputElement>("#searchInput").focus();
      return;
    }
    if (e.key === "Escape") {
      if (ui.query) {
        ui.query = "";
        $<HTMLInputElement>("#searchInput").value = "";
        render();
      } else if (ui.selected) {
        ui.selected = null;
        renderInspector();
      }
      return;
    }
    if (inField) return;
    if (e.altKey && e.key === "ArrowUp") {
      e.preventDefault();
      navigate(entryById(ui.folder)?.parentId || null);
      return;
    }
    const card = e.target.closest<HTMLElement>("[data-card]");
    if (
      card &&
      [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
      ].includes(e.key)
    ) {
      e.preventDefault();
      const list = currentEntries(),
        index = list.findIndex((x) => x.id === card.dataset.card);
      const gridCols =
        ui.view === "swipe"
          ? spatial.rows
          : Math.max(
              1,
              getComputedStyle($(".gallery-grid")).gridTemplateColumns.split(
                " ",
              ).length,
            );
      let step =
        ui.view === "swipe"
          ? {
              ArrowLeft: -gridCols,
              ArrowRight: gridCols,
              ArrowUp: -1,
              ArrowDown: 1,
            }[e.key]
          : {
              ArrowLeft: -1,
              ArrowRight: 1,
              ArrowUp: -gridCols,
              ArrowDown: gridCols,
            }[e.key];
      const next =
        e.key === "Home"
          ? 0
          : e.key === "End"
            ? list.length - 1
            : Math.max(0, Math.min(list.length - 1, index + (step ?? 0)));
      if (ui.view === "swipe") spatial.reveal(next);
      const target =
        $$("[data-card]")[next]?.querySelector<HTMLElement>(".card-open");
      target?.focus({ preventScroll: ui.view === "swipe" });
      if (ui.view !== "swipe") target?.scrollIntoView({ block: "nearest" });
    }
  });
  let dragDepth = 0;
  document.addEventListener("dragenter", (e) => {
    if (e.dataTransfer?.types.includes("Files")) {
      e.preventDefault();
      if (!busy && !$<HTMLDialogElement>("#dialog").open) {
        dragDepth++;
        $("#dropOverlay").hidden = false;
      }
    }
  });
  document.addEventListener("dragover", (e) => {
    if (e.dataTransfer?.types.includes("Files")) e.preventDefault();
  });
  document.addEventListener("dragleave", () => {
    if (--dragDepth <= 0) {
      dragDepth = 0;
      $("#dropOverlay").hidden = true;
    }
  });
  document.addEventListener("drop", (e) => {
    e.preventDefault();
    dragDepth = 0;
    $("#dropOverlay").hidden = true;
    if (!$<HTMLDialogElement>("#dialog").open)
      importFiles([...(e.dataTransfer?.files || [])]);
  });
  $("#searchIcon").innerHTML = icon("search");
  $<HTMLButtonElement>("#menuBtn").innerHTML = icon("menu");
  $<HTMLButtonElement>("#newFolderBtn").innerHTML =
    icon("plus") + '<span class="action-label">New collection</span>';
  $<HTMLButtonElement>("#importBtn").innerHTML =
    icon("upload") + '<span class="action-label">Import files</span>';
  $<HTMLButtonElement>("#prevBtn").innerHTML = icon("left");
  $<HTMLButtonElement>("#nextBtn").innerHTML = icon("right");
  $("[data-view=swipe]").insertAdjacentHTML("afterbegin", icon("sphere"));
  $("[data-view=grid]").innerHTML = icon("grid");
  $("[data-view=list]").innerHTML = icon("list");
}
