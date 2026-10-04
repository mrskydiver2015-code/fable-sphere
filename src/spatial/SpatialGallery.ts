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
  rows = 1;
  cols = 1;
  gap = 0;
  cw = 0;
  ch = 0;
  offset = 0;
  wall: HTMLElement | null = null;
  cards: HTMLElement[] = [];
  list: LibraryEntry[] = [];
  drag: {
    id: number;
    start: number;
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
  }
  mount(list: LibraryEntry[]) {
    this.list = list;

    this.wall = this.viewport.querySelector<HTMLElement>(".wall")!;
    this.cards = [...this.wall.querySelectorAll<HTMLElement>(".card")];
    this.abort = new AbortController();
    const options = { signal: this.abort.signal };
    this.viewport.style.perspective = `${CYLINDER.perspective}px`;
    this.layout();
    this.observer = new ResizeObserver(() => this.layout());
    this.observer.observe(this.viewport);
    const wall = this.wall;
    const surface = this.viewport;
    surface.addEventListener(
      "pointerdown",
      (e) => {
        if (
          e.button !== 0 ||
          (e.target instanceof Element && e.target.closest(".card-info"))
        )
          return;
        cancelAnimationFrame(this.raf);
        this.raf = 0;
        this.velocity = 0;
        clearTimeout(this.wheelTimer);
        this.drag = {
          id: e.pointerId,
          start: e.clientX,
          x: e.clientX,
          time: performance.now(),
          moved: false,
          samples: [[performance.now(), e.clientX]],
        };
      },
      options,
    );
    surface.addEventListener(
      "pointermove",
      (e) => {
        const d = this.drag;
        if (!d || d.id !== e.pointerId) return;
        const delta = (e.clientX - d.x) * CYLINDER.dragSensitivity,
          now = performance.now();
        if (Math.abs(e.clientX - d.start) > 7) d.moved = true;
        if (!d.moved) return;
        surface.setPointerCapture(e.pointerId);
        wall.classList.add("dragging");
        const resistance =
          this.pos < 0 || this.pos > this.max * this.stride
            ? CYLINDER.rubber
            : 1;
        this.pos = Math.max(
          -this.stride * 0.8,
          Math.min(
            this.max * this.stride + this.stride * 0.8,
            this.pos - delta * resistance,
          ),
        );
        d.samples.push([now, e.clientX]);
        while (d.samples.length > 2 && now - d.samples[0][0] > 90)
          d.samples.shift();
        const [startTime, startX] = d.samples[0];
        this.velocity =
          now > startTime
            ? (-(e.clientX - startX) * CYLINDER.dragSensitivity) /
              (now - startTime)
            : 0;
        d.x = e.clientX;
        d.time = now;
        this.apply();
      },
      options,
    );
    const finish = (e: PointerEvent) => {
      const d = this.drag;
      if (!d || d.id !== e.pointerId) return;
      this.drag = null;
      wall.classList.remove("dragging");
      if (d.moved) {
        this.suppressUntil = performance.now() + 250;
        if (performance.now() - d.time > 100) this.velocity = 0;
        if (e.type !== "pointerup") this.velocity = 0;
        this.snap(projectedColumn(this.pos, this.velocity, this.stride));
        try {
          surface.releasePointerCapture(e.pointerId);
        } catch {}
      }
    };
    surface.addEventListener("pointerup", finish, options);
    surface.addEventListener("pointercancel", finish, options);
    surface.addEventListener(
      "lostpointercapture",
      (e) => {
        // Touch transfers implicit capture from a card to the viewport.
        // Ignore the bubbled loss from that card during the handoff.
        if (e.target === surface && this.drag) finish(e);
      },
      options,
    );
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
        this.apply();
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
    const w = this.viewport.clientWidth,
      h = this.viewport.clientHeight;
    this.rows = h >= 510 ? 2 : 1;
    this.cols = Math.max(
      1,
      Math.min(
        5,
        Math.ceil(this.cards.length / this.rows),
        Math.floor((w - 30) / 230),
      ),
    );
    this.gap = w < 540 ? 18 : 24;
    this.cw = Math.min(420, (w - (this.cols + 1) * this.gap) / this.cols);
    this.offset = (w - (this.cols * this.cw + (this.cols - 1) * this.gap)) / 2;
    this.ch = Math.min(370, (h - 36 - (this.rows - 1) * this.gap) / this.rows);
    this.ch = Math.max(160, this.ch);
    this.stride = this.cw + this.gap;
    this.max = Math.max(
      0,
      Math.ceil(this.cards.length / this.rows) - this.cols,
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
  }
  apply() {
    if (!this.wall) return;
    const w = this.viewport.clientWidth,
      half = w / 2;
    this.cards.forEach((card, i) => {
      const col = Math.floor(i / this.rows),
        left = this.offset + col * this.stride - this.pos,
        x = left + this.cw / 2 - half;
      const projection = projectCylinder(x, w);
      card.style.transform = `translate3d(${half + projection.x - this.cw / 2}px,0,${projection.z}px) rotateY(${projection.rotation}deg)`;
      // Cull by the unrolled position too: clamped far-away columns must not pile up.
      const visible =
        left + this.cw > -this.stride &&
        left < w + this.stride &&
        projection.opacity > 0;
      const interactive = visible && projection.opacity === 1;
      card.style.opacity = visible ? String(projection.opacity) : "0";
      card.inert = !interactive;
      card.setAttribute("aria-hidden", String(!interactive));
    });
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
    else if (column >= this.position.index + this.cols)
      this.snap(column - this.cols + 1, true);
  }
}
