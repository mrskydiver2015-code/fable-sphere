import { readableSize } from "./format";
import { $ } from "./dom";
let toastTimer: ReturnType<typeof setTimeout>;
export function toast(text: string) {
  $("#toast").textContent = text;
  $("#toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("#toast").hidden = true), 4200);
}
export function showError(error: unknown) {
  console.error(error);
  toast(
    (error instanceof Error ? error.name : null) === "QuotaExceededError"
      ? "Device storage is full. Nothing was saved. Free some space and try again."
      : (error instanceof Error ? error.message : null) ||
          "Could not save changes. Please try again.",
  );
}
export async function updateStorageInfo() {
  try {
    const estimate = await navigator.storage?.estimate?.();
    const persistent = await navigator.storage?.persisted?.();
    $("#storageStatus").textContent = persistent
      ? "Stored on this device"
      : "Stored in this browser";
    $("#storageInfo").textContent = estimate?.usage
      ? `${readableSize(estimate.usage)} used · ${persistent ? "Persistent storage" : "Download originals for backup"}`
      : "Original files stay in this browser";
  } catch {
    $("#storageInfo").textContent = "Download originals for backup";
  }
}
