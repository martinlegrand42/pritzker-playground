"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type P5 from "p5";
import { Palette } from "@/lib/palette";

export type OrganicBloomSettings = {
  palette: Palette;
  wobbleAmount: number; // 0-1
  breatheSpeed: number; // 0-1
  grainOpacity: number; // 0-1
  hoverReactive: boolean;
  seed: number;
};

export type OrganicBloomHandle = {
  getCanvas: () => HTMLCanvasElement | null;
};

/** Instance-mode p5 sketch: a wobbly, breathing gradient blob with a grain overlay. */
export const OrganicBloom = forwardRef<OrganicBloomHandle, { settings: OrganicBloomSettings }>(
  function OrganicBloom({ settings }, ref) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const p5Ref = useRef<P5 | null>(null);
    const canvasElRef = useRef<HTMLCanvasElement | null>(null);
    const settingsRef = useRef(settings);
    settingsRef.current = settings;

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasElRef.current,
    }));

    useEffect(() => {
      let disposed = false;

      import("p5").then(({ default: P5Ctor }) => {
        if (disposed || !containerRef.current) return;

        const sketch = (p: P5) => {
          const NUM_POINTS = 140;
          let grain: P5.Graphics;
          let hover = 0; // smoothed 0-1 hover amount
          let rawHover = 0; // 1 while the pointer is over the canvas
          let frame = 0;

          const drift = {
            hotspot: [0, 0].map(() => ({ x: Math.random() * 1000, y: Math.random() * 1000 })),
          };

          p.setup = () => {
            const parent = containerRef.current!;
            const size = Math.min(parent.clientWidth, parent.clientHeight);
            const cnv = p.createCanvas(size, size).parent(parent);
            canvasElRef.current = cnv.elt as HTMLCanvasElement;
            cnv.elt.addEventListener("pointerenter", () => {
              rawHover = 1;
            });
            cnv.elt.addEventListener("pointerleave", () => {
              rawHover = 0;
            });
            grain = p.createGraphics(160, 160);
            p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
          };

          const updateGrain = () => {
            grain.loadPixels();
            const px = grain.pixels;
            for (let i = 0; i < px.length; i += 4) {
              const v = Math.random() * 255;
              px[i] = v;
              px[i + 1] = v;
              px[i + 2] = v;
              px[i + 3] = Math.random() * 60;
            }
            grain.updatePixels();
          };

          p.draw = () => {
            const s = settingsRef.current;
            const w = p.width;
            const h = p.height;
            const t = frame * 0.01 * (0.4 + s.breatheSpeed * 1.4);
            frame++;

            const hoverTarget = s.hoverReactive ? rawHover : 0;
            hover = p.lerp(hover, hoverTarget, 0.06);

            p.background(5, 5, 16);

            const cx = w / 2;
            const cy = h / 2;
            const baseR = Math.min(w, h) * 0.3;

            const breathe =
              1 +
              0.07 * Math.sin(t * 1.1 + s.seed) +
              0.035 * Math.sin(t * 2.3 + s.seed * 1.7) +
              0.03 * (p.noise(s.seed * 12, t * 0.6) * 2 - 1);

            const wobbleBoost = 1 + hover * 0.9;
            const wobbleAmp = (0.16 + s.wobbleAmount * 0.34) * wobbleBoost;
            const noiseSpeed = 0.09 * (1 + hover * 0.7);

            const ctx = p.drawingContext as CanvasRenderingContext2D;

            // --- blob path ---
            const pts: [number, number][] = [];
            for (let i = 0; i < NUM_POINTS; i++) {
              const a = (i / NUM_POINTS) * Math.PI * 2;
              const n = p.noise(
                Math.cos(a) * 1.6 + s.seed * 5 + 100,
                Math.sin(a) * 1.6 + s.seed * 5 + 100,
                t * noiseSpeed,
              );
              const lobe = 1 + 0.05 * Math.sin(2 * a + s.seed) + 0.03 * Math.sin(3 * a - s.seed * 2);
              const r = baseR * breathe * lobe * (1 + wobbleAmp * (n * 2 - 1));
              const rx = r;
              const ry = r * 0.94;
              pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
            }

            ctx.save();
            ctx.beginPath();
            pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
            ctx.closePath();
            ctx.clip();

            // --- base radial gradient ---
            const stops = s.palette.stops;
            const base = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 1.6);
            stops.forEach((c, i) => base.addColorStop(i / (stops.length - 1), c));
            ctx.fillStyle = base;
            ctx.fillRect(cx - baseR * 1.7, cy - baseR * 1.7, baseR * 3.4, baseR * 3.4);

            // --- independently drifting hotspots so different zones brighten at different times ---
            ctx.globalCompositeOperation = "lighter";
            drift.hotspot.forEach((d, i) => {
              const nx = p.noise(d.x, t * 0.25) * 2 - 1;
              const ny = p.noise(d.y, t * 0.25) * 2 - 1;
              const hx = cx + nx * baseR * 0.6;
              const hy = cy + ny * baseR * 0.6;
              const glow = ctx.createRadialGradient(hx, hy, 0, hx, hy, baseR * (0.8 + i * 0.3));
              glow.addColorStop(0, stops[stops.length - 1] + "55");
              glow.addColorStop(1, stops[stops.length - 1] + "00");
              ctx.fillStyle = glow;
              ctx.fillRect(cx - baseR * 1.7, cy - baseR * 1.7, baseR * 3.4, baseR * 3.4);
            });
            ctx.globalCompositeOperation = "source-over";
            ctx.restore();

            // --- grain overlay ---
            if (frame % 3 === 0) updateGrain();
            if (s.grainOpacity > 0) {
              ctx.save();
              ctx.globalAlpha = s.grainOpacity;
              ctx.globalCompositeOperation = "overlay";
              ctx.drawImage(grain.elt, 0, 0, w, h);
              ctx.restore();
            }
          };
        };

        p5Ref.current = new P5Ctor(sketch);
      });

      return () => {
        disposed = true;
        p5Ref.current?.remove();
        p5Ref.current = null;
      };
    }, []);

    useEffect(() => {
      const parent = containerRef.current;
      if (!parent) return;
      const observer = new ResizeObserver(() => {
        const p = p5Ref.current;
        if (!p) return;
        const size = Math.min(parent.clientWidth, parent.clientHeight);
        if (size > 0) p.resizeCanvas(size, size);
      });
      observer.observe(parent);
      return () => observer.disconnect();
    }, []);

    return <div ref={containerRef} className="aspect-square w-full max-w-[560px]" />;
  },
);
