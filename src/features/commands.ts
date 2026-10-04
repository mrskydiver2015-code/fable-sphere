import type { LibraryChange } from "../core/types";
import { storage } from "../core/storage";
import { busy, ready, setBusy, loadEntries, notify } from "../core/state";
import { toast, showError, updateStorageInfo } from "../components/status";
export async function mutate(change: LibraryChange, message?: string) {
  if (busy || !ready) return false;
  setBusy(true);
  try {
    await storage.commit(change);
    await loadEntries();
    notify();
    if (message) toast(message);
    return true;
  } catch (error) {
    showError(error);
    return false;
  } finally {
    setBusy(false);
    updateStorageInfo();
  }
}
