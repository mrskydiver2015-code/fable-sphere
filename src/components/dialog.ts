import { $ } from "./dom";
import { icon, escapeHTML } from "./format";
import { busy } from "../core/state";
let focusReturn: HTMLElement | null = null;
export const scope: { serial: number; url: string | null } = {
  serial: 0,
  url: null,
};
export function closeDialog() {
  scope.serial++;
  const d = $<HTMLDialogElement>("#dialog");
  d.close();
  d.innerHTML = "";
  d.className = "";
  if (scope.url) {
    URL.revokeObjectURL(scope.url);
    scope.url = null;
  }
  if (focusReturn?.isConnected) focusReturn.focus();
  else $<HTMLButtonElement>("#newFolderBtn").focus();
}
export function openDialog(
  title: string,
  body: string,
  { preview = false } = {},
) {
  const d = $<HTMLDialogElement>("#dialog");
  if (d.open) closeDialog();
  focusReturn =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  d.className = preview ? "preview-dialog" : "";
  d.innerHTML = preview
    ? body
    : `<div class="dialog-head"><h2 id="dialogTitle">${escapeHTML(title)}</h2><button class="icon-btn" data-close-dialog aria-label="Close dialog">${icon("close")}</button></div><div class="dialog-body">${body}</div>`;
  d.showModal();
}
// Keep keyboard focus inside the active sheet, including around native media controls.
$<HTMLDialogElement>("#dialog").addEventListener("keydown", (event) => {
  if (event.key !== "Tab") return;
  const dialog = $<HTMLDialogElement>("#dialog");
  const focusable = [
    ...dialog.querySelectorAll<HTMLElement>(
      'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), audio[controls], video[controls], iframe, [tabindex="0"]',
    ),
  ].filter((node) => node.getClientRects().length);
  const first = focusable[0],
    last = focusable[focusable.length - 1];
  if (!first) {
    event.preventDefault();
    return;
  }
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});
$<HTMLDialogElement>("#dialog").addEventListener("cancel", (e) => {
  e.preventDefault();
  if (!busy) closeDialog();
});
$<HTMLDialogElement>("#dialog").addEventListener("click", (e) => {
  if (e.target === $<HTMLDialogElement>("#dialog") && !busy) {
    const r = $<HTMLDialogElement>("#dialog").getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      closeDialog();
  }
});
