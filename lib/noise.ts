/** Lightweight seeded 2D value-noise (smooth, continuous, no external deps). */

function hash(x: number, y: number, seed: number) {
  let h = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  h = h - Math.floor(h);
  return h;
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

export function valueNoise2D(x: number, y: number, seed = 0): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = smoothstep(x - x0);
  const fy = smoothstep(y - y0);

  const a = hash(x0, y0, seed);
  const b = hash(x0 + 1, y0, seed);
  const c = hash(x0, y0 + 1, seed);
  const d = hash(x0 + 1, y0 + 1, seed);

  const ab = a + (b - a) * fx;
  const cd = c + (d - c) * fx;
  return ab + (cd - ab) * fy;
}

/** Returns a value in [-1, 1] combining a couple of octaves for a livelier signal. */
export function driftNoise(x: number, y: number, seed = 0): number {
  const n1 = valueNoise2D(x, y, seed);
  const n2 = valueNoise2D(x * 2.13, y * 2.13, seed + 91.3) * 0.5;
  return (n1 + n2) / 1.5 - 1;
}
