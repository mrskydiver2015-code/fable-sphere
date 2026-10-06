/** Reference SWIPE QA tuning. Positions are CSS pixels, time is milliseconds. */
export const CYLINDER = Object.freeze({
  curve: 32,
  rows: 4,
  columns: 6,
  cardWidth: 178,
  cardHeight: 128,
  gap: 8,
  perspective: 1100,
  projectionMs: 300,
  springK: 20 / 100_000,
  dragSensitivity: 1,
  rubber: 0.3,
  maximumVelocity: 6,
});

/** Unroll horizontal travel onto the inside wall; the centre recedes from us. */
export function projectCylinder(
  x: number,
  viewportWidth: number,
  curve: number = CYLINDER.curve,
) {
  const half = Math.max(1, viewportWidth / 2);
  // Six 178px cards + five 8px gaps give R=657.875px at the QA width.
  const radius = half * (38 / Math.max(6, curve));
  const edgeAngle = Math.asin(Math.min(1, half / radius));
  const theta = Math.max(-1.35, Math.min(1.35, x / radius));
  const edgeSag = 1 - Math.cos(edgeAngle);
  const sag = Math.min(220, radius * edgeSag);
  const depthFraction = (1 - Math.cos(theta)) / edgeSag;
  return {
    radius,
    x: radius * Math.sin(theta),
    z: Math.min(-12, -42 - sag * (1 - depthFraction)),
    // The tangent faces the viewer on both sides of the concave wall.
    rotation: (-theta * 180) / Math.PI,
    opacity: Math.max(0, Math.min(1, 1 - (Math.abs(theta) - edgeAngle) / 0.35)),
  };
}

export function projectedColumn(
  position: number,
  velocity: number,
  stride: number,
) {
  const capped = Math.max(
    -CYLINDER.maximumVelocity,
    Math.min(CYLINDER.maximumVelocity, velocity),
  );
  return Math.round((position + capped * CYLINDER.projectionMs) / stride);
}

/** Exact critically damped spring solution, consistent at 60/120Hz and after jank. */
export function springStep(
  position: number,
  velocity: number,
  target: number,
  dt: number,
) {
  const omega = Math.sqrt(CYLINDER.springK);
  const displacement = position - target;
  const coefficient = velocity + omega * displacement;
  const decay = Math.exp(-omega * dt);
  return {
    position: target + (displacement + coefficient * dt) * decay,
    velocity: (velocity - omega * coefficient * dt) * decay,
  };
}
