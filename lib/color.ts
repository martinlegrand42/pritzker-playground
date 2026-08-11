export function hexToRgb01(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return [r, g, b];
}

/** Samples a multi-stop gradient (stops ordered 0..1) at t, returning [r,g,b] in 0-1. */
export function sampleGradient(stops: string[], t: number): [number, number, number] {
  const clamped = Math.min(1, Math.max(0, t));
  const segment = 1 / (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.floor(clamped / segment));
  const localT = (clamped - index * segment) / segment;

  const [r1, g1, b1] = hexToRgb01(stops[index]);
  const [r2, g2, b2] = hexToRgb01(stops[index + 1]);

  return [r1 + (r2 - r1) * localT, g1 + (g2 - g1) * localT, b1 + (b2 - b1) * localT];
}
