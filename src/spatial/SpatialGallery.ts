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
    this.layout();
    this.observer = new ResizeObserver(() => this.layout());
    this.observer.observe(this.viewport);
    const wall = this.wall;
    wall.addEventListener(
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
        this.drag = {
          id: e.pointerId,
          start: e.clientX,
          x: e.clientX,
          time: performance.now(),
          moved: false,
        };
      },
      options,
    );
    wall.addEventListener(
      "pointermove",
      (e) => {
        const d = this.drag;
        if (!d || d.id !== e.pointerId) return;
        const delta = e.clientX - d.x,
          now = performance.now(),
          dt = Math.max(8, now - d.time);
        if (Math.abs(e.clientX - d.start) > 7) d.moved = true;
        if (!d.moved) return;
        wall.setPointerCapture(e.pointerId);
        wall.classList.add("dragging");
        const resistance =
          this.pos < 0 || this.pos > this.max * this.stride ? 0.32 : 1;
        this.pos = Math.max(
          -this.stride * 0.35,
          Math.min(
            this.max * this.stride + this.stride * 0.35,
            this.pos - delta * resistance,
          ),
        );
        this.velocity = 0.65 * this.velocity + 0.35 * (-delta / dt);
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
        if (e.type === "pointercancel") this.velocity = 0;
        this.snap(Math.round((this.pos + this.velocity * 190) / this.stride));
        try {
          wall.releasePointerCapture(e.pointerId);
        } catch {}
      }
    };
    wall.addEventListener("pointerup", finish, options);
    wall.addEventListener("pointercancel", finish, options);
    wall.addEventListener(
      "lostpointercapture",
      (e) => {
        // Touch transfers implicit capture from a card to the wall.
        // Ignore the bubbled loss from that card during the handoff.
        if (e.target === wall && this.drag) finish(e);
      },
      options,
    );
    wall.addEventListener(
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
      const angle = Math.max(-0.8, Math.min(0.8, x / (w * 1.65)));
      const z =
        this.cols === 1 ? 1 : 1 + Math.min(38, Math.pow(x / half, 2) * 38);
      const bend = this.cols === 1 ? 0 : Math.sin(angle) * w * 1.65 - x;
      card.style.transform = `translate3d(${left + bend}px,0,${z}px) rotateY(${-angle * 28}deg)`;
      const visible = left + this.cw > 6 && left < w - 6;
      card.style.opacity = visible ? "1" : "0";
      card.inert = !visible;
      card.setAttribute("aria-hidden", String(!visible));
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
      const dt = Math.min(32, now - previous);
      previous = now;
      const distance = this.target - this.pos;
      this.velocity += (distance * 0.00028 - this.velocity * 0.034) * dt;
      this.pos += this.velocity * dt;
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
