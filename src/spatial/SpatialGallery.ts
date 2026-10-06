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
  gap = 0;
  cw = 0;
  ch = 0;
  offset = 0;
  width = 0;
  private visibleCards = new Set<number>();
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
    this.visibleCards.clear();
  }
  mount(list: LibraryEntry[]) {
    this.list = list;

    this.wall = this.viewport.querySelector<HTMLElement>(".wall")!;
    this.cards = [...this.wall.querySelectorAll<HTMLElement>(".card")];
    this.cards.forEach((card) => {
      card.style.visibility = "hidden";
      card.inert = true;
      card.setAttribute("aria-hidden", "true");
    });
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
          this.drag !== null ||
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
        this.queueApply();
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
    const w = this.viewport.clientWidth,
      h = this.viewport.clientHeight;
    this.width = w;
    // Fixed four-row QA matrix; smaller screens show fewer columns, never fewer rows.
    this.rows = CYLINDER.rows;
    this.gap = CYLINDER.gap;
    this.cw = Math.min(CYLINDER.cardWidth, w);
    this.ch = Math.max(
      1,
      Math.min(
        CYLINDER.cardHeight,
        (h - 24 - (this.rows - 1) * this.gap) / this.rows,
      ),
    );
    this.cols = Math.max(
      1,
      Math.min(
        CYLINDER.columns,
        Math.floor((w + this.gap) / (this.cw + this.gap)),
      ),
    );
    this.offset = (w - (this.cols * this.cw + (this.cols - 1) * this.gap)) / 2;
    this.viewport.classList.toggle("compact-wall", this.ch < 110);
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
    else if (column >= this.position.index + this.cols)
      this.snap(column - this.cols + 1, true);
  }
}
