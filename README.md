# Pritzker Foundation — Generative Studio

A generative playground for experimenting with brand motion. Pick a system, tune it
live with bounded controls, and export a still (PNG) or a looping clip (WebM) —
no code editing, so there's no way to break it.

## Systems

- **Organic Bloom** (`/studio/organic-bloom`) — a p5.js sketch: a wobbly,
  Perlin-noise-displaced blob that breathes in and out, with an animated
  multi-stop gradient whose highlight drifts independently so different zones
  brighten at different moments, plus a flickering grain overlay. Hovering
  intensifies the wobble.
- **Kinetic Grid** (`/studio/kinetic-grid`) — a three.js `InstancedMesh` take on
  the same brand palette: a grid of cells sampling a moving noise field, each
  breathing on its own phase so the grid shimmers like a wave, with a ripple
  that propagates outward from the cursor on hover.

Both share a control panel (palette, motion parameters, a "shuffle variation"
seed reset) and an export toolbar (PNG still / 4s WebM loop via
`canvas.captureStream` + `MediaRecorder`).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS, p5.js, three.js.
