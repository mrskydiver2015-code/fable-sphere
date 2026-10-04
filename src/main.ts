import "./styles/index.css";
import { bindEvents } from "./events";
import { $, $$ } from "./components/dom";
import { render } from "./components/shell";
import { toast } from "./components/status";
import { storage } from "./core/storage";
import { initializeData } from "./core/migration";
import {
  ui,
  busy,
  ready,
  setBusy,
  setReady,
  subscribe,
  loadEntries,
  lineage,
} from "./core/state";
import { readRoute, writeRoute } from "./core/navigation";
import { isView } from "./core/types";
import { spatial } from "./spatial/instance";

function banner(message: string) {
  $("#banner").hidden = false;
  $("#banner").textContent = message;
}
function renderBusy() {
  for (const selector of ["#demoToggle", "#newFolderBtn", "#importBtn"])
    $<HTMLButtonElement>(selector).disabled = busy || !ready;
  $$<HTMLButtonElement>("#dialog button[type=submit]").forEach(
    (button) => (button.disabled = busy),
  );
}
const unsubscribe = subscribe((change) => {
  if (change === "busy") renderBusy();
  else render();
});
bindEvents();
async function boot() {
  setBusy(true);
  try {
    await storage.open(
      () =>
        banner("Close other Fable Sphere tabs to finish opening this library."),
      () => {
        setReady(false);
        banner(
          "The library was updated in another tab. Reload this page to continue.",
        );
      },
    );
    const result = await initializeData();
    if (result.warning) banner(result.warning);
    if (result.migrated)
      toast(
        `Preserved ${result.migrated} previous items in Personal Workspace.`,
      );
    const route = readRoute();
    ui.space = route.space;
    ui.folder = route.folder;
    try {
      const view = localStorage.getItem("fable-sphere-view");
      if (isView(view)) ui.view = view;
    } catch {}
    await loadEntries();
    lineage(ui.folder).forEach((e) => ui.expanded.add(e.id));
    setReady(true);
    writeRoute(true);
    render();
  } catch (error) {
    console.error(error);
    $("#content").innerHTML =
      '<div class="empty"><h2>Your library needs local storage.</h2><p>Storage could not be opened. Allow site storage in your browser, then reload. Existing data has not been changed.</p><button class="btn" id="retryStorage">Try again</button></div>';
    $("#retryStorage").onclick = () => location.reload();
    $("#storageInfo").textContent = "Storage unavailable";
  } finally {
    setBusy(false);
  }
}
void boot();
// Recreate the small shell safely on HMR; persistence remains in IndexedDB.
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    unsubscribe();
    spatial.dispose();
    storage.close();
  });
