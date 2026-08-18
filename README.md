# Pritzker Foundation — Generative Studio

A generative playground for experimenting with brand motion. Tune a live WebGL
shader with bounded controls, then export a still (PNG) or a looping clip
(WebM) — no code editing, so there's no way to break it.

## Aura

A single breathing, gently imperfect circle, rendered by a hand-written
GLSL fragment shader (`lib/shaders.ts`, run through `lib/shader-runtime.ts`).

- Rim distortion is one low-frequency simplex-noise octave, sampled from a
  small patch of the noise field so it stays circular rather than faceted.
- Hovering the sides/rim gathers a smooth, rounded lobe of "liquid" toward
  the cursor — additive, not a spike — tunable via a hover-intensity slider.
  The middle of the shape is a deliberate dead zone: a cursor's angle
  relative to the center is numerically unstable near the center itself, so
  the directional effect only activates once the cursor is actually near
  the rim. The cursor position itself is also eased frame to frame, so a
  fast sweep settles smoothly instead of snapping the lobe's direction.
- The "mid" palette color blends in via a real Color Burn (the CSS
  Compositing / Figma / Photoshop formula), evaluated at full strength and
  masked into a soft band partway out — not linearly cross-faded, which
  would just average it toward a paler in-between tone. Toggleable per look.
- Grain is a fixed per-cell dither (`grain()`), deliberately not
  time-varying — it's texture, not flicker. Toggleable, with its own
  amount/size sliders.
- Six palettes (`AURA_PALETTES`), all sharing one role structure: a rich,
  saturated body color with no bright hotspot, a lighter tint for the
  transitional ring, and a near-white background the ring fades into.

Settings (palette, sliders, toggles) persist to `localStorage`
(`lib/persist.ts`) so a custom look survives a reload. Controls include
"Generate" for a random variation and "Reset" back to defaults, plus an
export toolbar (PNG still / 6s WebM loop via `canvas.captureStream` +
`MediaRecorder`).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS, raw WebGL1 (no
three.js/p5.js — the shaders in `lib/shaders.ts` are hand-written GLSL).
