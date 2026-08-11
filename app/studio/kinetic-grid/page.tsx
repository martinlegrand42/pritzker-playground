"use client";

import { useRef, useState } from "react";
import { PlaygroundShell } from "@/components/PlaygroundShell";
import { ExportPanel } from "@/components/ExportPanel";
import { ActionButton, ControlGroup, PaletteSwatches, Slider } from "@/components/ui/Controls";
import { palettes } from "@/lib/palette";
import { KineticGrid, KineticGridHandle } from "@/components/generators/KineticGrid";
import { exportCanvasPng, useCanvasRecorder } from "@/hooks/useCanvasRecorder";

export default function KineticGridPage() {
  const [palette, setPalette] = useState(palettes[0]);
  const [density, setDensity] = useState(12);
  const [breatheSpeed, setBreatheSpeed] = useState(0.5);
  const [rippleStrength, setRippleStrength] = useState(0.6);
  const [seed, setSeed] = useState(3.2);

  const gridRef = useRef<KineticGridHandle | null>(null);
  const { isRecording, progress, startRecording } = useCanvasRecorder(() =>
    gridRef.current?.getCanvas() ?? null,
  );

  return (
    <PlaygroundShell
      title="Kinetic Grid"
      subtitle="The same brand palette, reimagined as a structured mosaic that shimmers and ripples on touch."
      stage={
        <KineticGrid
          ref={gridRef}
          settings={{ palette, density, breatheSpeed, rippleStrength, seed }}
        />
      }
      sidebar={
        <>
          <ControlGroup label="Palette">
            <PaletteSwatches value={palette} onChange={setPalette} />
          </ControlGroup>

          <ControlGroup label="Grid density">
            <Slider value={density} min={5} max={22} step={1} onChange={setDensity} />
          </ControlGroup>

          <ControlGroup label="Breathing speed">
            <Slider value={breatheSpeed} min={0} max={1} step={0.01} onChange={setBreatheSpeed} />
          </ControlGroup>

          <ControlGroup label="Ripple strength">
            <Slider value={rippleStrength} min={0} max={1} step={0.01} onChange={setRippleStrength} />
          </ControlGroup>

          <ActionButton onClick={() => setSeed(Math.random() * 100)}>
            Shuffle variation
          </ActionButton>

          <div className="border-t border-white/10 pt-4">
            <ExportPanel
              isRecording={isRecording}
              progress={progress}
              onExportPng={() => exportCanvasPng(gridRef.current?.getCanvas() ?? null, "kinetic-grid.png")}
              onExportLoop={(ms) => startRecording(ms, "kinetic-grid-loop.webm")}
            />
          </div>
        </>
      }
    />
  );
}
