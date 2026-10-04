/** Required references fail close to the component that owns them. */
export function $<T extends HTMLElement = HTMLElement>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`Missing interface element: ${selector}`);
  return node;
}
export function $$<T extends HTMLElement = HTMLElement>(selector: string): T[] {
  return [...document.querySelectorAll<T>(selector)];
}
export function find<T extends HTMLElement = HTMLElement>(
  selector: string,
): T | null {
  return document.querySelector<T>(selector);
}
