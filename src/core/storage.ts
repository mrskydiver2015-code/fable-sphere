import type {
  LibraryEntry,
  StoredFile,
  StoredMeta,
  LibraryChange,
  Space,
} from "./types";
type Records = { entries: LibraryEntry; files: StoredFile; meta: StoredMeta };
type StoreName = keyof Records;
/** The adapter has no DOM dependencies. Metadata and blobs share one commit. */
export class LibraryStorage {
  private connection: IDBDatabase | null = null;
  async open(
    onBlocked: () => void,
    onVersionChange: () => void,
  ): Promise<void> {
    if (this.connection) return;
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("fable-sphere-library", 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        db.createObjectStore("entries", { keyPath: "key" });
        db.createObjectStore("files", { keyPath: "key" });
        db.createObjectStore("meta", { keyPath: "key" });
      };
      request.onsuccess = () => {
        this.connection = request.result;
        this.connection.onversionchange = () => {
          this.close();
          onVersionChange();
        };
        resolve();
      };
      request.onerror = () => reject(request.error);
      request.onblocked = onBlocked;
    });
  }
  close() {
    this.connection?.close();
    this.connection = null;
  }
  private transaction(
    stores: StoreName | StoreName[],
    mode: IDBTransactionMode,
  ) {
    if (!this.connection)
      throw new Error("The library is closed. Reload to reconnect.");
    return this.connection.transaction(stores, mode);
  }
  read<S extends StoreName>(store: S): Promise<Records[S][]>;
  read<S extends StoreName>(
    store: S,
    key: string,
  ): Promise<Records[S] | undefined>;
  read<S extends StoreName>(
    store: S,
    key?: string,
  ): Promise<Records[S][] | Records[S] | undefined> {
    return new Promise((resolve, reject) => {
      const tx = this.transaction(store, "readonly");
      const request =
        key === undefined
          ? tx.objectStore(store).getAll()
          : tx.objectStore(store).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  commit({
    put = [],
    remove = [],
    files = [],
    removeFiles = [],
    meta = [],
  }: LibraryChange = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.transaction(["entries", "files", "meta"], "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () =>
        reject(
          tx.error ||
            new Error("The save was interrupted. No changes were kept."),
        );
      // Synchronous serialization errors must abort earlier queued writes too.
      try {
        for (const e of put) tx.objectStore("entries").put(e);
        for (const key of remove) tx.objectStore("entries").delete(key);
        for (const f of files) tx.objectStore("files").put(f);
        for (const key of removeFiles) tx.objectStore("files").delete(key);
        for (const m of meta) tx.objectStore("meta").put(m);
      } catch (error) {
        tx.abort();
        reject(error);
      }
    });
  }
}
export const keyFor = (id: string, space: Space) => `${space}:${id}`;
export const storage = new LibraryStorage();
