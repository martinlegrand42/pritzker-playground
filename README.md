# Pritzker Foundation — Generative Studio

A generative playground for experimenting with brand motion. Tune a live WebGL
shader with bounded controls, then export a still (PNG) or a looping clip
(WebM) — no code editing, so there's no way to break it.

## Engines

- **Aura** — a single breathing, gently imperfect circle. Rim distortion is
  one low-frequency simplex-noise octave, kept subtle enough to stay
  circular rather than faceted. Hovering gathers a smooth, rounded lobe of
  "liquid" toward the cursor — additive, not a spike — tunable via a
  dedicated hover-intensity slider.
- **Prism** — a divergent take: a perfect disc that cycles continuously
  through the full hue spectrum instead of sitting on a fixed brand palette,
  with a soft center highlight that drifts gently toward the cursor on
  hover, and a chromatic-aberration slider that splits the red/blue
  channels apart near the rim like light through glass.

Both run on the same fragment-shader runtime (`lib/shader-runtime.ts`),
share a control panel (palette, per-engine sliders, "Generate" for a random
variation, "Reset" back to defaults), and persist their settings to
`localStorage` (`lib/persist.ts`) so a custom look survives a reload. Grain
is a fixed per-cell dither (`lib/shaders.ts`'s `grain()`), deliberately not
animated — it's texture, not flicker. An export toolbar (PNG still / 6s
WebM loop via `canvas.captureStream` + `MediaRecorder`) rounds both out.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS, raw WebGL1 (no
three.js/p5.js — the shaders in `lib/shaders.ts` are hand-written GLSL).
