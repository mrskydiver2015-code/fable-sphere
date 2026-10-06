import { spaceLabels } from "../core/types";
import type { LibraryEntry } from "../core/types";
import { ui, entryById } from "../core/state";
import { storage } from "../core/storage";
import { $ } from "../components/dom";
import { icon, escapeHTML } from "../components/format";
import { itemType, cover } from "../components/pieces";
import { openDialog, closeDialog, scope } from "../components/dialog";
import { navigate } from "../core/navigation";
export async function openEntry(id: string) {
  const e = entryById(id);
  if (!e) return;
  if (e.kind === "folder") {
    if ($<HTMLDialogElement>("#dialog").open) closeDialog();
    navigate(id);
    return;
  }
  await preview(e);
}
async function preview(e: LibraryEntry) {
  openDialog(
    "",
    `<div class="preview-layout"><div class="dialog-head"><div><div class="eyebrow">${escapeHTML(itemType(e))} · ${spaceLabels[ui.space]}</div><h2 id="dialogTitle">${escapeHTML(e.name)}</h2></div><button class="icon-btn" data-close-dialog aria-label="Close preview">${icon("close")}</button></div><div class="preview-body" id="previewBody"><p class="dialog-copy">Opening your piece…</p></div><div class="preview-foot"><span id="previewCaption">${escapeHTML(e.desc || "Saved in your library.")}</span><div class="actions" id="previewActions"></div></div></div>`,
    { preview: true },
  );
  const serial = ++scope.serial;
  let blob;
  try {
    if (e.fileKey) {
      blob = (await storage.read("files", e.fileKey))?.blob;
      if (!blob) throw new Error("The stored original could not be found.");
    } else if (e.demoArt) blob = await (await fetch(cover(e))).blob();
    else if (e.text !== undefined)
      blob = new Blob([e.text], { type: "text/plain" });
    if (serial !== scope.serial) return;
    const body = $("#previewBody"),
      actions = $("#previewActions");
    body.innerHTML = "";
    if (!blob) {
      body.innerHTML = `<div class="preview-unsupported"><h3>${e.legacy ? "A piece of your previous library." : "A little more to discover."}</h3><p>${e.legacy ? "The original file was not saved by the earlier app. Import it to open a full preview." : "There is no original file attached to this piece."}</p>${e.thumbnail ? `<img src="${e.thumbnail}" alt="Saved thumbnail" style="max-height:280px;margin-top:20px">` : ""}</div>`;
      return;
    }
    scope.url = URL.createObjectURL(blob);
    const mime = e.mime || blob.type;
    const download = document.createElement("a");
    download.href = scope.url;
    download.download = e.demoArt
      ? e.name + ".svg"
      : e.text !== undefined
        ? e.name + ".txt"
        : e.name;
    download.className = "btn";
    download.innerHTML = icon("download") + " Download";
    actions.append(download);
    if (mime.startsWith("image/")) {
      const img = new Image();
      img.src = scope.url;
      img.alt = e.name;
      body.append(img);
      const zoom = document.createElement("button");
      zoom.className = "btn";
      zoom.textContent = "Actual size";
      zoom.onclick = () => {
        const active = img.classList.toggle("zoomed");
        zoom.textContent = active ? "Fit to view" : "Actual size";
        zoom.setAttribute("aria-pressed", String(active));
      };
      actions.prepend(zoom);
    } else if (mime === "application/pdf") {
      const frame = document.createElement("iframe");
      frame.title = e.name;
      frame.src = scope.url;
      body.append(frame);
      $("#previewCaption").textContent =
        "PDF preview · If your browser cannot display it, download to open.";
    } else if (mime.startsWith("video/") || mime.startsWith("audio/")) {
      const media = document.createElement(
        mime.startsWith("video/") ? "video" : "audio",
      );
      media.controls = true;
      media.src = scope.url;
      body.append(media);
      media.onerror = () => {
        $("#previewCaption").textContent =
          "This browser cannot play this format. Download to open in another app.";
      };
    } else if (
      mime.startsWith("text/") ||
      /\.(txt|md|csv|json|xml|html|css|js|yaml|yml|log)$/i.test(e.name)
    ) {
      const text = await blob.slice(0, 2 * 1024 * 1024).text();
      if (serial !== scope.serial) return;
      const pre = document.createElement("pre");
      pre.textContent = text;
      body.append(pre);
      if (blob.size > 2 * 1024 * 1024)
        $("#previewCaption").textContent =
          "Showing the first 2 MB. Download for the complete file.";
    } else
      body.innerHTML =
        '<div class="preview-unsupported"><h3>Safe in your library.</h3><p>This file format opens best in its own application. Download the preserved original to continue.</p></div>';
  } catch (error) {
    if (serial === scope.serial) {
      $("#previewBody").innerHTML =
        '<div class="preview-unsupported"><h3>Could not open this piece.</h3><p id="previewError"></p></div>';
      $("#previewError").textContent =
        error instanceof Error
          ? error.message
          : "The stored file could not be opened.";
    }
  }
}
