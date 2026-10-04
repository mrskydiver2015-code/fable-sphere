import type { LibraryEntry } from "../core/types";
import {
  ui,
  entries,
  busy,
  ready,
  entryById,
  descendants,
  lineage,
  keyFor,
} from "../core/state";
import { $, find } from "../components/dom";
import { escapeHTML, uid } from "../components/format";
import { openDialog, closeDialog } from "../components/dialog";
import { mutate } from "./commands";
import { writeRoute } from "../core/navigation";
function collectionOptions(exclude: string | null = null) {
  const blocked = exclude ? descendants(exclude) : new Set();
  return (
    `<option value="">Library (top level)</option>` +
    entries
      .filter((e) => e.kind === "folder" && !blocked.has(e.id))
      .map(
        (e) =>
          `<option value="${escapeHTML(e.id)}">${escapeHTML(
            lineage(e.id)
              .map((p) => p.name)
              .join(" / "),
          )}</option>`,
      )
      .join("")
  );
}
export function editDialog(id: string | null = null) {
  if (busy || !ready) return;
  const e = id ? entryById(id) : null;
  openDialog(
    e ? "Make it yours" : "Start a collection",
    `<form id="entryForm"><div class="field"><label for="entryName">Name</label><input id="entryName" required maxlength="160" placeholder="A place for your next idea" value="${escapeHTML(e?.name || "")}" autofocus></div><div class="field"><label for="entryDescription">A few words about it</label><textarea id="entryDescription" maxlength="2000" placeholder="What belongs here?">${escapeHTML(e?.desc || "")}</textarea></div><div class="field"><label for="entryParent">Location</label><select id="entryParent">${collectionOptions(e?.kind === "folder" ? e.id : null)}</select></div>${!e || e.kind === "folder" ? `<div class="field"><label for="entryArt">Cover atmosphere</label><select id="entryArt"><option value="landscape">Into the wild</option><option value="abstract">Forms & colour</option><option value="architecture">Quiet architecture</option><option value="cosmos">Faraway worlds</option><option value="paper">Pages & possibilities</option></select></div>` : ""}<div class="dialog-actions"><button type="button" class="btn" data-close-dialog>Cancel</button><button type="submit" class="btn primary">${e ? "Save changes" : "Create collection"}</button></div></form>`,
  );
  $<HTMLSelectElement>("#entryParent").value =
    (e ? e.parentId : ui.folder) || "";
  const artSelect = find<HTMLSelectElement>("#entryArt");
  if (artSelect) artSelect.value = e?.art || "landscape";
  $<HTMLFormElement>("#entryForm").onsubmit = async (event) => {
    event.preventDefault();
    const name = $<HTMLInputElement>("#entryName").value.trim();
    if (!name) {
      $<HTMLInputElement>("#entryName").setCustomValidity(
        "Give this collection a name.",
      );
      $<HTMLInputElement>("#entryName").reportValidity();
      return;
    }
    const parentId = $<HTMLSelectElement>("#entryParent").value || null;
    const now = Date.now(),
      record: LibraryEntry = {
        key: "",
        ...(e || {
          id: uid(),
          space: ui.space,
          kind: "folder",
          seed: entries.length,
          created: now,
        }),
        name,
        desc: $<HTMLTextAreaElement>("#entryDescription").value.trim(),
        parentId,
        updated: now,
        art:
          find<HTMLSelectElement>("#entryArt")?.value || e?.art || "landscape",
      };
    record.key = keyFor(record.id);
    if (
      await mutate(
        { put: [record] },
        e ? "Changes saved." : "A new collection, ready for your ideas.",
      )
    )
      closeDialog();
  };
  $<HTMLInputElement>("#entryName").addEventListener("input", () =>
    $<HTMLInputElement>("#entryName").setCustomValidity(""),
  );
}
export function deleteDialog(id: string) {
  if (busy) return;
  const e = entryById(id);
  if (!e) return;
  const ids = e.kind === "folder" ? descendants(id) : new Set([id]);
  openDialog(
    "Let this one go?",
    `<p class="dialog-copy">Delete <strong>${escapeHTML(e.name)}</strong>${ids.size > 1 ? ` and the ${ids.size - 1} pieces inside it` : ""} from ${ui.space === "demo" ? "Demo Space" : "Personal Workspace"}? This permanently removes its stored files from this browser.</p><div class="dialog-actions"><button class="btn" data-close-dialog>Keep it</button><button class="btn danger" id="confirmDelete">Delete ${ids.size > 1 ? "collection" : "piece"}</button></div>`,
  );
  $<HTMLButtonElement>("#confirmDelete").onclick = async () => {
    if (
      await mutate(
        {
          remove: [...ids].map((id) => keyFor(id)),
          removeFiles: [...ids].map((id) => keyFor(id)),
        },
        "Removed from this space.",
      )
    ) {
      writeRoute(true);
      closeDialog();
    }
  };
}
