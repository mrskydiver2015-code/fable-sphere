import { ui } from "../core/state";
import { $ } from "../components/dom";
import { SpatialGallery } from "./SpatialGallery";
export const spatial = new SpatialGallery(
  $("#content"),
  { previous: $("#prevBtn"), next: $("#nextBtn"), progress: $("#positionBar") },
  ui,
);
