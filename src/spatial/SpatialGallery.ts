import {
  CYLINDER,
  projectCylinder,
  projectedColumn,
  springStep,
} from "./cylinder";
import type { LibraryEntry } from "../core/types";
/** Owns animation, gesture listeners and resize observation. Never writes the library. */
export class SpatialGallery {
  raf = 0;
  observer: ResizeObserver | null = null;
  abort: AbortController | null = null;
  pos = 0;
  target = 0;
  velocity = 0;
  stride = 1;
  max = 0;
  rows: number = CYLINDER.rows;
  curve: number = CYLINDER.curve;
  cols = 1;
  private viewColumns = 1;
  gap = 0;
  cw = 0;
  ch = 0;
  offset = 0;
  width = 0;
  scale = 1;
  camera: HTMLElement | null = null;
  private visibleCards = new Set<number>();
  wall: HTMLElement | null = null;
  cards: HTMLElement[] = [];
  list: LibraryEntry[] = [];
  drag: {
    id: number;
    start: number;
    startY: number;
    x: number;
    time: number;
    moved: boolean;
    samples: [number, number][];
  } | null = null;
  suppressUntil = 0;
  wheelTimer: ReturnType<typeof setTimeout> | undefined;
  private reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  private onMotionChange = () => {
    if (this.wall) this.snap(this.position.index, true);
  };
  constructor(
    private viewport: HTMLElement,
    private controls: {
      previous: HTMLButtonElement;
      next: HTMLButtonElement;
      progress: HTMLElement;
    },
    private position: { index: number },
  ) {
    this.reducedMotion.addEventListener("change", this.onMotionChange);
  }
  dispose() {
    this.destroy();
    this.reducedMotion.removeEventListener("change", this.onMotionChange);
  }
  destroy() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.observer?.disconnect();
    this.abort?.abort();
    clearTimeout(this.wheelTimer);
    this.drag = null;
    this.wall = null;
    this.camera = null;
    this.visibleCards.clear();
  }
  mount(list: LibraryEntry[]) {
    this.list = list;

    this.camera = this.viewport.querySelector<HTMLElement>(".cylinder-camera")!;
    this.wall = this.viewport.querySelector<HTMLElement>(".wall")!;
    this.cards = [...this.wall.querySelectorAll<HTMLElement>(".card")];
    this.cards.forEach((card) => {
      card.style.visibility = "hidden";
      card.inert = true;
      card.setAttribute("aria-hidden", "true");
    });
    this.abort = new AbortController();
    const options = { signal: this.abort.signal };
    this.camera.style.perspective = `${CYLINDER.perspective}px`;
    this.layout();
    this.observer = new ResizeObserver(() => this.layout());
    this.observer.observe(this.viewport);
    const wall = this.wall;
    const surface = this.viewport;
    const begin = (id: number, x: number, y: number) => {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
      this.velocity = 0;
      clearTimeout(this.wheelTimer);
      this.drag = {
        id,
        start: x,
        startY: y,
        x,
        time: performance.now(),
        moved: false,
        samples: [[performance.now(), x]],
      };
    };
    const move = (x: number) => {
      const d = this.drag;
      if (!d) return;
      if (Math.abs(x - d.start) > 7) d.moved = true;
      if (!d.moved) return;
      const delta = ((x - d.x) * CYLINDER.dragSensitivity) / this.scale,
        now = performance.now();
      wall.classList.add("dragging");
      const resistance =
        this.pos < 0 || this.pos > this.max * this.stride ? CYLINDER.rubber : 1;
      this.pos = Math.max(
        -this.stride * 0.8,
        Math.min(
          this.max * this.stride + this.stride * 0.8,
          this.pos - delta * resistance,
        ),
      );
      d.samples.push([now, x]);
      while (d.samples.length > 2 && now - d.samples[0][0] > 90)
        d.samples.shift();
      const [startTime, startX] = d.samples[0];
      this.velocity =
        now > startTime
          ? (-(x - startX) * CYLINDER.dragSensitivity) /
            ((now - startTime) * this.scale)
          : 0;
      d.x = x;
      d.time = now;
      this.queueApply();
    };
    const finish = (cancelled = false) => {
      const d = this.drag;
      if (!d) return;
      this.drag = null;
      wall.classList.remove("dragging");
      if (d.moved) {
        this.suppressUntil = performance.now() + 350;
        if (cancelled || performance.now() - d.time > 100) this.velocity = 0;
        this.snap(projectedColumn(this.pos, this.velocity, this.stride));
      }
    };
    surface.addEventListener(
      "pointerdown",
      (e) => {
        // Touch uses an axis-aware path; mouse and pen retain pointer capture.
        if (
          e.pointerType === "touch" ||
          this.drag ||
          e.button !== 0 ||
          (e.target instanceof Element && e.target.closest(".card-info"))
        )
          return;
        begin(e.pointerId, e.clientX, e.clientY);
      },
      options,
    );
    surface.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerType === "touch" || this.drag?.id !== e.pointerId) return;
        move(e.clientX);
        if (this.drag?.moved) surface.setPointerCapture(e.pointerId);
      },
      options,
    );
    const finishPointer = (e: PointerEvent) => {
      if (e.pointerType === "touch" || this.drag?.id !== e.pointerId) return;
      finish(e.type !== "pointerup");
      if (surface.hasPointerCapture(e.pointerId))
        surface.releasePointerCapture(e.pointerId);
    };
    surface.addEventListener("pointerup", finishPointer, options);
    surface.addEventListener("pointercancel", finishPointer, options);
    surface.addEventListener(
      "lostpointercapture",
      (e) => {
        if (e.target === surface) finishPointer(e);
      },
      options,
    );
    surface.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length !== 1) {
          finish(true);
          return;
        }
        if (
          this.drag ||
          (e.target instanceof Element && e.target.closest(".card-info"))
        )
          return;
        const touch = e.touches[0];
        begin(touch.identifier, touch.clientX, touch.clientY);
      },
      { ...options, passive: true },
    );
    surface.addEventListener(
      "touchmove",
      (e) => {
        const d = this.drag;
        if (!d) return;
        if (e.touches.length !== 1) {
          finish(true);
          return;
        }
        const touch = e.touches[0];
        if (touch.identifier !== d.id) return;
        const dx = Math.abs(touch.clientX - d.start),
          dy = Math.abs(touch.clientY - d.startY);
        if (!d.moved && dy > dx && dy > 7) {
          finish(true);
          return;
        }
        if (!d.moved && dx <= 7) return;
        if (!e.cancelable) {
          finish(true);
          return;
        }
        e.preventDefault();
        move(touch.clientX);
      },
      { ...options, passive: false },
    );
    surface.addEventListener(
      "touchend",
      (e) => {
        if (
          this.drag &&
          [...e.changedTouches].some(
            (touch) => touch.identifier === this.drag?.id,
          )
        )
          finish();
      },
      options,
    );
    surface.addEventListener("touchcancel", () => finish(true), options);
    surface.addEventListener(
      "wheel",
      (e) => {
        if (!this.max) return;
        const delta =
          Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        e.preventDefault();
        cancelAnimationFrame(this.raf);
        this.raf = 0;
        const value =
          delta *
          (e.deltaMode === 1
            ? 16
            : e.deltaMode === 2
              ? this.viewport.clientWidth
              : 1);
        this.pos = Math.max(
          0,
          Math.min(this.max * this.stride, this.pos + value),
        );
        this.queueApply();
        clearTimeout(this.wheelTimer);
        this.wheelTimer = setTimeout(() => {
          this.velocity = 0;
          this.snap(Math.round(this.pos / this.stride));
        }, 100);
      },
      { ...options, passive: false },
    );
  }
  layout() {
    if (!this.wall) return;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    const physicalWidth = this.viewport.clientWidth,
      physicalHeight = this.viewport.clientHeight;
    const landscape = matchMedia(
      "(max-height:520px), (max-width:1100px) and (orientation:landscape) and (pointer:coarse)",
    ).matches;
    this.rows = CYLINDER.rows;
    let w = physicalWidth,
      h = physicalHeight;
    this.scale = 1;
    let landscapeSpan: number | undefined;
    if (landscape) {
      // Fit four proportional rows, then extend the scene past both screen edges.
      w =
        CYLINDER.columns * CYLINDER.cardWidth +
        (CYLINDER.columns - 1) * CYLINDER.gap;
      this.cw = CYLINDER.cardWidth;
      this.ch = CYLINDER.cardWidth / 1.6;
      this.gap = CYLINDER.gap;
      h = this.rows * this.ch + (this.rows - 1) * this.gap + 24;
      this.scale = Math.min(
        1,
        (physicalWidth - 8) / w,
        (physicalHeight - 8) / h,
      );
      // Compensate for the uniform scale and the inward projection's horizontal
      // contraction. Overscan keeps the curved wall crossing the viewport edges.
      w = (physicalWidth / this.scale) * 1.24;
      const perspective = CYLINDER.perspective * (w / 1108);
      // Place the first/last column across the screen edge, but keep its
      // centre hit-testable. Fractional travel avoids rounding into side gaps.
      const edge = physicalWidth / (2 * this.scale) - this.cw * 0.12;
      let low = 0;
      let high = w / 2;
      for (let i = 0; i < 24; i++) {
        const x = (low + high) / 2;
        const projected = projectCylinder(x, w, this.curve);
        const screenX =
          (projected.x * perspective) / (perspective - projected.z);
        if (screenX < edge) low = x;
        else high = x;
      }
      landscapeSpan = 1 + (low + high) / (this.cw + this.gap);
      this.cols = Math.ceil(landscapeSpan);
    } else {
      this.gap = w < 540 ? 6 : CYLINDER.gap;
      const desiredColumns = w < 420 ? 3 : w < 540 ? 4 : CYLINDER.columns;
      const cardScale = Math.max(
        0.1,
        Math.min(
          1,
          (w - (w < 540 ? 12 : 0) - (desiredColumns - 1) * this.gap) /
            (desiredColumns * CYLINDER.cardWidth),
          (h - 24 - (this.rows - 1) * this.gap) /
            (this.rows * CYLINDER.cardHeight),
        ),
      );
      this.cw = CYLINDER.cardWidth * cardScale;
      this.ch = CYLINDER.cardHeight * cardScale;
      this.cols = Math.max(
        1,
        Math.min(10, Math.floor((w + this.gap) / (this.cw + this.gap))),
      );
    }
    this.viewColumns = landscapeSpan ?? this.cols;
    this.width = w;
    if (this.camera) {
      this.camera.style.perspective = `${
        landscape ? CYLINDER.perspective * (w / 1108) : CYLINDER.perspective
      }px`;
      this.camera.style.width = `${w}px`;
      this.camera.style.height = `${h}px`;
      this.camera.style.transform = `translate(-50%, -50%) scale(${this.scale})`;
    }
    this.offset =
      (w -
        ((landscapeSpan ?? this.cols) * this.cw +
          ((landscapeSpan ?? this.cols) - 1) * this.gap)) /
      2;
    this.viewport.classList.toggle("landscape-wall", landscape);
    this.viewport.classList.toggle("compact-wall", !landscape && this.ch < 110);
    this.stride = this.cw + this.gap;
    this.max = Math.max(
      0,
      Math.ceil(this.cards.length / this.rows) - (landscapeSpan ?? this.cols),
    );
    this.position.index = Math.max(0, Math.min(this.max, this.position.index));
    this.pos = this.target = this.position.index * this.stride;
    this.velocity = 0;
    this.cards.forEach((card, i) => {
      card.style.width = this.cw + "px";
      card.style.height = this.ch + "px";
      card.style.top =
        Math.max(
          12,
          (h - (this.ch * this.rows + this.gap * (this.rows - 1))) / 2,
        ) +
        (i % this.rows) * (this.ch + this.gap) +
        "px";
    });
    this.apply();
    this.viewport.dispatchEvent(new Event("spatialchange"));
  }
  setCurve(curve: number) {
    this.curve = Math.max(6, Math.min(50, curve));
    this.apply();
    this.viewport.dispatchEvent(new Event("spatialchange"));
  }
  private queueApply() {
    if (this.raf) return;
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      this.apply();
    });
  }
  apply() {
    if (!this.wall) return;
    const w = this.width,
      half = w / 2;
    const visibleCards = new Set<number>();
    // Visit only the viewport plus one column of overscan, independent of library size.
    const first = Math.max(
      0,
      Math.floor((this.pos - this.offset) / this.stride) - 1,
    );
    const last = Math.min(
      Math.ceil(this.cards.length / this.rows) - 1,
      Math.ceil((this.pos + w - this.offset) / this.stride),
    );
    for (let col = first; col <= last; col++) {
      const left = this.offset + col * this.stride - this.pos;
      const projection = projectCylinder(
        left + this.cw / 2 - half,
        w,
        this.curve,
      );
      if (projection.opacity <= 0) continue;
      const transform = `translate3d(${half + projection.x - this.cw / 2}px,0,${projection.z}px) rotateY(${projection.rotation}deg)`;
      const interactive = projection.opacity === 1;
      for (let row = 0; row < this.rows; row++) {
        const i = col * this.rows + row,
          card = this.cards[i];
        if (!card) break;
        visibleCards.add(i);
        card.style.visibility = "visible";
        card.style.transform = transform;
        card.style.opacity = String(projection.opacity);
        if (card.inert === interactive) {
          card.inert = !interactive;
          card.setAttribute("aria-hidden", String(!interactive));
        }
      }
    }
    for (const i of this.visibleCards) {
      if (visibleCards.has(i)) continue;
      const card = this.cards[i];
      card.style.visibility = "hidden";
      card.inert = true;
      card.setAttribute("aria-hidden", "true");
    }
    this.visibleCards = visibleCards;
    this.controls.previous.disabled = this.pos < 1;
    this.controls.next.disabled = this.pos >= this.max * this.stride - 1;
    this.controls.progress.style.width =
      (this.max
        ? Math.min(
            100,
            Math.max(8, ((this.pos / this.stride + 1) / (this.max + 1)) * 100),
          )
        : 100) + "%";
  }
  snap(index: number, instant = false) {
    this.velocity = Math.max(
      -CYLINDER.maximumVelocity,
      Math.min(CYLINDER.maximumVelocity, this.velocity),
    );
    this.position.index = Math.max(0, Math.min(this.max, index));
    this.target = this.position.index * this.stride;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    if (instant || this.reducedMotion.matches) {
      this.pos = this.target;
      this.velocity = 0;
      this.apply();
      return;
    }
    let previous = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(64, now - previous);
      previous = now;
      const distance = this.target - this.pos;
      const next = springStep(this.pos, this.velocity, this.target, dt);
      this.pos = next.position;
      this.velocity = next.velocity;
      if (Math.abs(distance) < 0.4 && Math.abs(this.velocity) < 0.02) {
        this.pos = this.target;
        this.velocity = 0;
        this.raf = 0;
        this.apply();
        return;
      }
      this.apply();
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }
  reveal(index: number) {
    const column = Math.floor(index / this.rows);
    if (column < this.position.index) this.snap(column, true);
    else if (column > this.position.index + this.viewColumns - 1)
      this.snap(column - this.viewColumns + 1, true);
  }
}
