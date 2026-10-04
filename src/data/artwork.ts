export function artwork(seed = 0, variant = "landscape") {
  const colors = [
    ["#293c37", "#819780", "#c7be91", "#142d2a"],
    ["#584632", "#c6a577", "#ecd5a4", "#343e30"],
    ["#282d48", "#747aa3", "#d8bfb8", "#222a3b"],
    ["#324d55", "#9cbcb4", "#dce2c3", "#1a373e"],
    ["#533c3d", "#bb8f7e", "#ebc39d", "#3e343b"],
    ["#4b4939", "#b0ad84", "#f1dab0", "#303e35"],
  ][Math.abs(seed) % 6];
  const [dark, mid, light, front] = colors;
  let shapes = "";
  if (variant === "abstract") {
    shapes = `<circle cx="180" cy="155" r="110" fill="${light}"/><path d="M0 230Q150 70 260 170T640 100V400H0" fill="${mid}"/><path d="M210 400V0h90v400m60 0V0h30v400" fill="${dark}" opacity=".75"/><circle cx="470" cy="220" r="115" fill="none" stroke="${light}" stroke-width="2"/><circle cx="470" cy="220" r="85" fill="none" stroke="${light}" stroke-width="1"/>`;
  } else if (variant === "architecture") {
    shapes = `<path d="M110 400V130a210 210 0 0 1 420 0v270" fill="${mid}"/><path d="M180 400V155a140 140 0 0 1 280 0v245" fill="${dark}"/><path d="M237 400V178a83 83 0 0 1 166 0v222" fill="${light}"/><path d="M0 340h640M0 360h640M0 390h640" stroke="${front}" stroke-width="3"/><path d="m0 400 237-90m403 90-237-90" stroke="${front}" stroke-width="2"/>`;
  } else if (variant === "cosmos") {
    shapes = `<circle cx="335" cy="195" r="106" fill="url(#planet)"/><ellipse cx="335" cy="208" rx="220" ry="43" fill="none" stroke="${light}" stroke-width="12" transform="rotate(-24 335 208)" opacity=".65"/>${Array.from({ length: 48 }, (_, i) => `<circle cx="${(i * 113 + seed * 19) % 640}" cy="${(i * i * 31 + 23) % 400}" r="${i % 3 === 0 ? 1.5 : 0.7}" fill="${light}" opacity=".65"/>`).join("")}`;
  } else if (variant === "paper") {
    shapes = `<g transform="rotate(-9 320 210)"><rect x="180" y="45" width="270" height="340" rx="3" fill="${light}"/><rect x="211" y="89" width="44" height="4" fill="${dark}"/>${Array.from({ length: 12 }, (_, i) => `<path d="M211 ${135 + i * 15}h${i % 4 === 3 ? 137 : 205}" stroke="${dark}" opacity=".38" stroke-width="2"/>`).join("")}<circle cx="391" cy="332" r="14" fill="none" stroke="${dark}" opacity=".6"/></g>`;
  } else {
    const trees = Array.from({ length: 18 }, (_, i) => {
      const x = ((i * 53 + seed * 23) % 680) - 20,
        y = 180 + ((i * 29) % 130),
        h = 90 + ((i * 37) % 130);
      return `<path d="M${x} ${y - h}l${h * 0.22} ${h * 0.75}h-${h * 0.12}l${h * 0.15} ${h * 0.25}h-${h * 0.5}l${h * 0.15}-${h * 0.25}h-${h * 0.12}z" fill="${front}" opacity="${0.4 + (i % 3) * 0.2}"/>`;
    }).join("");
    shapes = `<circle cx="${420 - (seed % 3) * 70}" cy="100" r="43" fill="${light}" opacity=".85"/><path d="M0 230 150 100 280 240 450 120 640 245V400H0" fill="${mid}" opacity=".55"/><path d="M0 260Q140 190 310 265T640 205V400H0" fill="${mid}"/>${trees}<path d="M0 350Q190 250 370 350T640 290V400H0" fill="${front}"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400"><defs><linearGradient id="bg" x2=".4" y2="1"><stop stop-color="${dark}"/><stop offset="1" stop-color="${mid}"/></linearGradient><radialGradient id="planet" cx=".25" cy=".2"><stop stop-color="${light}"/><stop offset=".65" stop-color="${mid}"/><stop offset="1" stop-color="${dark}"/></radialGradient><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".65" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".09"/></feComponentTransfer><feBlend in="SourceGraphic" mode="soft-light"/></filter></defs><g filter="url(#grain)"><path fill="url(#bg)" d="M0 0h640v400H0z"/>${shapes}</g></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
