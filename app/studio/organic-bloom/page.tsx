"use client";

import { useRef, useState } from "react";
import { PlaygroundShell } from "@/components/PlaygroundShell";
import { ExportPanel } from "@/components/ExportPanel";
import {
  ActionButton,
  ControlGroup,
  PaletteSwatches,
  Slider,
  ToggleRow,
} from "@/components/ui/Controls";
import { palettes } from "@/lib/palette";
import { OrganicBloom, OrganicBloomHandle } from "@/components/generators/OrganicBloom";
import { exportCanvasPng, useCanvasRecorder } from "@/hooks/useCanvasRecorder";

export default function OrganicBloomPage() {
  const [palette, setPalette] = useState(palettes[0]);
  const [wobbleAmount, setWobbleAmount] = useState(0.5);
  const [breatheSpeed, setBreatheSpeed] = useState(0.5);
  const [grainOpacity, setGrainOpacity] = useState(0.18);
  const [hoverReactive, setHoverReactive] = useState(true);
  const [seed, setSeed] = useState(1.7);

  const bloomRef = useRef<OrganicBloomHandle | null>(null);
  const { isRecording, progress, startRecording } = useCanvasRecorder(() =>
    bloomRef.current?.getCanvas() ?? null,
  );

  return (
    <PlaygroundShell
      title="Organic Bloom"
      subtitle="A single wobbly, breathing gradient form — noise-driven and never quite still."
      stage={
        <OrganicBloom
          ref={bloomRef}
          settings={{ palette, wobbleAmount, breatheSpeed, grainOpacity, hoverReactive, seed }}
        />
      }
      sidebar={
        <>
          <ControlGroup label="Palette">
            <PaletteSwatches value={palette} onChange={setPalette} />
          </ControlGroup>

          <ControlGroup label="Wobble amount">
            <Slider value={wobbleAmount} min={0} max={1} step={0.01} onChange={setWobbleAmount} />
          </ControlGroup>

          <ControlGroup label="Breathing speed">
            <Slider value={breatheSpeed} min={0} max={1} step={0.01} onChange={setBreatheSpeed} />
          </ControlGroup>

          <ControlGroup label="Grain opacity">
            <Slider value={grainOpacity} min={0} max={0.5} step={0.01} onChange={setGrainOpacity} />
          </ControlGroup>

          <ToggleRow label="React to hover" checked={hoverReactive} onChange={setHoverReactive} />

          <ActionButton onClick={() => setSeed(Math.random() * 100)}>
            Shuffle variation
          </ActionButton>

          <div className="border-t border-white/10 pt-4">
            <ExportPanel
              isRecording={isRecording}
              progress={progress}
              onExportPng={() => exportCanvasPng(bloomRef.current?.getCanvas() ?? null, "organic-bloom.png")}
              onExportLoop={(ms) => startRecording(ms, "organic-bloom-loop.webm")}
            />
          </div>
        </>
      }
    />
  );
}
