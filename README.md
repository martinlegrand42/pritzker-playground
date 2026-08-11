# Pritzker Foundation — Generative Studio

A generative playground for experimenting with brand motion. Tune a live WebGL
shader with bounded controls, then export a still (PNG) or a looping clip
(WebM) — no code editing, so there's no way to break it.

## Engines

- **Aura** — a single breathing, wobbly gradient mark. Rim distortion runs off
  layered simplex noise so it's never a perfect circle, the gradient bands
  drift out of sync with each other, and film grain dithers the fill.
  Hovering makes it wobble more energetically.
- **Field** — a divergent take: the identity becomes an environment instead of
  an object — a domain-warped thermal gradient, optionally banded into
  contour lines, for wallpapers and motion backgrounds.

Both run on the same fragment-shader runtime (`lib/shader-runtime.ts`) and
share a control panel (palette, per-engine sliders, "Generate" for a random
variation, "Reset" back to defaults) plus an export toolbar (PNG still / 6s
WebM loop via `canvas.captureStream` + `MediaRecorder`).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS, raw WebGL1 (no
three.js/p5.js — the shaders in `lib/shaders.ts` are hand-written GLSL).
