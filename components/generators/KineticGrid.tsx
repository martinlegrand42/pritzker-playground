"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { Palette } from "@/lib/palette";
import { sampleGradient } from "@/lib/color";
import { valueNoise2D } from "@/lib/noise";

export type KineticGridSettings = {
  palette: Palette;
  density: number; // grid cells per side, e.g. 5-20
  breatheSpeed: number; // 0-1
  rippleStrength: number; // 0-1
  seed: number;
};

export type KineticGridHandle = {
  getCanvas: () => HTMLCanvasElement | null;
};

const RIPPLE_LIFETIME = 1.3; // seconds
const RIPPLE_SPEED = 2.1; // world units / second

type Ripple = { x: number; y: number; start: number };

export const KineticGrid = forwardRef<KineticGridHandle, { settings: KineticGridSettings }>(
  function KineticGrid({ settings }, ref) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const settingsRef = useRef(settings);
    settingsRef.current = settings;

    useImperativeHandle(ref, () => ({
      getCanvas: () => rendererRef.current?.domElement ?? null,
    }));

    useEffect(() => {
      const parent = containerRef.current;
      if (!parent) return;

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
      camera.position.z = 3;

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      parent.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      const geometry = new THREE.CircleGeometry(1, 24);
      // A per-vertex "color" attribute is required alongside instanceColor: three.js
      // multiplies instance color by the geometry's vertex color, which defaults to
      // black when the attribute is absent.
      geometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count * 3).fill(1), 3),
      );
      const material = new THREE.MeshBasicMaterial({ vertexColors: true });
      let mesh: THREE.InstancedMesh | null = null;
      let count = 0;

      const ripples: Ripple[] = [];
      let hovering = false;
      const pointer = { x: 0, y: 0 };
      let framesSinceRipple = 999;

      const buildGrid = (n: number) => {
        if (mesh) {
          scene.remove(mesh);
        }
        count = n * n;
        mesh = new THREE.InstancedMesh(geometry, material, count);
        scene.add(mesh);
      };

      buildGrid(settingsRef.current.density);

      const dummy = new THREE.Object3D();
      const clock = new THREE.Clock();

      const resize = () => {
        const size = Math.min(parent.clientWidth, parent.clientHeight);
        if (size <= 0) return;
        renderer.setSize(size, size);
      };
      resize();
      const observer = new ResizeObserver(resize);
      observer.observe(parent);

      const toWorld = (clientX: number, clientY: number) => {
        const rect = renderer.domElement.getBoundingClientRect();
        return {
          x: ((clientX - rect.left) / rect.width) * 2 - 1,
          y: -(((clientY - rect.top) / rect.height) * 2 - 1),
        };
      };

      const onPointerMove = (e: PointerEvent) => {
        const w = toWorld(e.clientX, e.clientY);
        pointer.x = w.x;
        pointer.y = w.y;
      };
      const onPointerEnter = (e: PointerEvent) => {
        hovering = true;
        const w = toWorld(e.clientX, e.clientY);
        ripples.push({ x: w.x, y: w.y, start: clock.getElapsedTime() });
        framesSinceRipple = 0;
      };
      const onPointerLeave = () => {
        hovering = false;
      };

      renderer.domElement.addEventListener("pointermove", onPointerMove);
      renderer.domElement.addEventListener("pointerenter", onPointerEnter);
      renderer.domElement.addEventListener("pointerleave", onPointerLeave);

      let rafId = 0;
      const animate = () => {
        rafId = requestAnimationFrame(animate);
        const s = settingsRef.current;

        if (s.density !== Math.round(Math.sqrt(count))) {
          buildGrid(s.density);
        }
        if (!mesh) return;

        const n = s.density;
        const now = clock.getElapsedTime();
        const t = now * (0.5 + s.breatheSpeed * 1.6);

        framesSinceRipple++;
        if (hovering && framesSinceRipple > 26) {
          ripples.push({ x: pointer.x, y: pointer.y, start: now });
          framesSinceRipple = 0;
        }
        while (ripples.length && now - ripples[0].start > RIPPLE_LIFETIME) ripples.shift();

        const extent = 1.7;
        const spacing = n > 1 ? extent / (n - 1) : 0;
        const baseRadius = spacing * 0.36;

        let i = 0;
        for (let gy = 0; gy < n; gy++) {
          for (let gx = 0; gx < n; gx++) {
            const x = (gx - (n - 1) / 2) * spacing;
            const y = (gy - (n - 1) / 2) * spacing;

            const field = valueNoise2D(gx * 0.35 + t * 0.05, gy * 0.35 - t * 0.04, s.seed);
            const phase = (gx + gy) * 0.55 + valueNoise2D(gx, gy, s.seed + 50) * 4;
            let scale = baseRadius * (0.72 + 0.32 * Math.sin(t * 1.3 + phase));

            let rippleBoost = 0;
            for (const r of ripples) {
              const age = now - r.start;
              const ringRadius = age * RIPPLE_SPEED;
              const dist = Math.hypot(x - r.x, y - r.y);
              const band = Math.exp(-((dist - ringRadius) ** 2) / (2 * 0.18 ** 2));
              const fade = Math.max(0, 1 - age / RIPPLE_LIFETIME);
              rippleBoost += band * fade;
            }
            rippleBoost = Math.min(1.2, rippleBoost) * s.rippleStrength;
            scale *= 1 + rippleBoost * 0.9;

            dummy.position.set(x, y, 0);
            dummy.scale.setScalar(Math.max(0.001, scale));
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);

            const [r, g, b] = sampleGradient(s.palette.stops, field);
            if (rippleBoost > 0.02) {
              const [hr, hg, hb] = sampleGradient(s.palette.stops, 1);
              const mix = Math.min(1, rippleBoost);
              mesh.setColorAt(i, new THREE.Color(r + (hr - r) * mix, g + (hg - g) * mix, b + (hb - b) * mix));
            } else {
              mesh.setColorAt(i, new THREE.Color(r, g, b));
            }
            i++;
          }
        }

        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

        renderer.render(scene, camera);
      };
      animate();

      return () => {
        cancelAnimationFrame(rafId);
        observer.disconnect();
        renderer.domElement.removeEventListener("pointermove", onPointerMove);
        renderer.domElement.removeEventListener("pointerenter", onPointerEnter);
        renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        parent.removeChild(renderer.domElement);
        rendererRef.current = null;
      };
    }, []);

    return <div ref={containerRef} className="aspect-square w-full max-w-[560px]" />;
  },
);
