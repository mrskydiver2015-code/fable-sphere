/** Persistent schema: compatible with the v2 single-file application's database. */
export type Space = "showcase" | "demo" | "personal";
export type View = "swipe" | "grid" | "list";
export type Filter = "all" | "folders" | "images" | "documents";
export type Sort = "curated" | "name" | "recent";
export interface LibraryEntry {
  key: string;
  id: string;
  space: Space;
  kind: "folder" | "asset";
  parentId: string | null;
  name: string;
  desc: string;
  seed: number;
  art: string;
  created: number;
  updated: number;
  type?: string;
  category?: string;
  headerColor?: string;
  mime?: string;
  bytes?: number;
  fileKey?: string;
  thumbnail?: string | null;
  legacy?: boolean;
  demoArt?: boolean;
  text?: string;
}
export interface StoredFile {
  key: string;
  blob: Blob;
}
export interface StoredMeta {
  key: string;
  value: unknown;
}
export interface LibraryChange {
  put?: LibraryEntry[];
  remove?: string[];
  files?: StoredFile[];
  removeFiles?: string[];
  meta?: StoredMeta[];
}
export interface UiState {
  space: Space;
  folder: string | null;
  view: View;
  query: string;
  filter: Filter;
  sort: Sort;
  selected: string | null;
  expanded: Set<string>;
  index: number;
}
export const isView = (value: unknown): value is View =>
  value === "swipe" || value === "grid" || value === "list";
export const isFilter = (value: unknown): value is Filter =>
  value === "all" ||
  value === "folders" ||
  value === "images" ||
  value === "documents";
export const isSort = (value: unknown): value is Sort =>
  value === "curated" || value === "name" || value === "recent";

export type DatasetPreset = "showcase" | "classic" | "empty";
export const presetSpaces: Record<DatasetPreset, Space> = {
  showcase: "showcase",
  classic: "demo",
  empty: "personal",
};
export const spacePresets: Record<Space, DatasetPreset> = {
  showcase: "showcase",
  demo: "classic",
  personal: "empty",
};
export const spaceLabels: Record<Space, string> = {
  showcase: "Showcase",
  demo: "Classic",
  personal: "Empty · Your files",
};
export const isPreset = (value: unknown): value is DatasetPreset =>
  value === "showcase" || value === "classic" || value === "empty";
