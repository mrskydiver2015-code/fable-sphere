import { makeMatrixDemo } from "./matrixDemo";
import type { LibraryEntry } from "../core/types";
import { keyFor } from "../core/storage";
export function makeDemo(): LibraryEntry[] {
  const now = Date.now(),
    result: LibraryEntry[] = [];
  const themes = [
    [
      "chronicles",
      "Chronicles",
      "Stories taking shape, worlds waiting to be found.",
      "landscape",
    ],
    [
      "visual",
      "Visual studies",
      "Experiments in form, light, and the art of looking.",
      "abstract",
    ],
    [
      "places",
      "Places & spaces",
      "Architecture, faraway places, and quiet corners.",
      "architecture",
    ],
    [
      "cosmos",
      "The observatory",
      "Small discoveries in a very big universe.",
      "cosmos",
    ],
    [
      "fieldnotes",
      "Field notes",
      "Collected thoughts from the everyday expedition.",
      "paper",
    ],
    [
      "inspiration",
      "Cabinet of curiosities",
      "Beautiful fragments. Unexpected connections.",
      "landscape",
    ],
  ];
  const add = (
    id: string,
    kind: LibraryEntry["kind"],
    name: string,
    parentId: string | null,
    seed: number,
    art: string,
    desc: string,
    extra: Partial<LibraryEntry> = {},
  ) =>
    result.push({
      key: keyFor(id, "demo"),
      space: "demo",
      id,
      kind,
      name,
      parentId,
      seed,
      art,
      desc,
      created: now - result.length * 86400000,
      updated: now - result.length * 86400000,
      ...extra,
    });
  themes.forEach(([id, name, desc, art], i) =>
    add(id, "folder", name, null, i, art, desc),
  );
  add(
    "forest",
    "folder",
    "Deep Forest",
    "chronicles",
    0,
    "landscape",
    "A quiet world of ancient trees and unfinished tales.",
  );
  add(
    "tides",
    "folder",
    "The distant shore",
    "chronicles",
    3,
    "landscape",
    "Stories carried in on the tide.",
  );
  add(
    "forms",
    "folder",
    "Forms & fragments",
    "visual",
    1,
    "abstract",
    "Studies in rhythm, contrast, and negative space.",
  );
  const images: [string, string, number, string][] = [
    ["A place between trees", "forest", 0, "landscape"],
    ["The last light", "forest", 1, "landscape"],
    ["Beyond the blue hour", "tides", 3, "landscape"],
    ["Soft geometry", "visual", 4, "abstract"],
    ["Balance, no. 03", "forms", 2, "abstract"],
    ["A room for stillness", "places", 1, "architecture"],
    ["Passage of light", "places", 3, "architecture"],
    ["Saturn, imagined", "cosmos", 2, "cosmos"],
    ["An orbit of our own", "cosmos", 4, "cosmos"],
    ["Objects of affection", "inspiration", 5, "abstract"],
    ["The way home", "inspiration", 0, "landscape"],
    ["Almost autumn", "inspiration", 1, "landscape"],
  ];
  images.forEach(([name, parent, seed, art], i) =>
    add(
      "art" + i,
      "asset",
      name,
      parent,
      seed,
      art,
      "An original procedural study from the Fable Sphere demo collection.",
      { type: "Image", demoArt: true, mime: "image/svg+xml" },
    ),
  );
  [
    [
      "The forest remembers",
      "forest",
      "The forest remembers\n\nEvery path began as a question.\n\nWe walked beneath the branches until the noise of the day became something softer. There, between the roots and the last light, we found a place for the stories we had not yet told.\n\nChapter one · A beginning",
    ],
    [
      "Notes on noticing",
      "fieldnotes",
      "Notes on noticing\n\n1. Find a familiar place.\n2. Stay a little longer than usual.\n3. Notice what changes when you stop looking for anything.\n\nThe extraordinary is often just the ordinary, given time.",
    ],
    [
      "A small collection of possibilities",
      "chronicles",
      "A small collection of possibilities\n\nA map with no destination.\nA letter arriving fifty years too late.\nA library that only opens when it rains.\n\nKeep the door open.",
    ],
  ].forEach(([name, parent, text], i) =>
    add(
      "note" + i,
      "asset",
      name,
      parent,
      i + 1,
      "paper",
      "A page from the notebook. Open it and take a moment.",
      { type: "Text", text, mime: "text/plain" },
    ),
  );
  return [...result, ...makeMatrixDemo(now)];
}
