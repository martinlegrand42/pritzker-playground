'use client'

import { ColorField, Section, Slider, Toggle } from './ui-controls'
import { cn } from '@/lib/utils'
import {
  AURA_PALETTES,
  PRISM_BACKGROUNDS,
  type AuraParams,
  type PrismParams,
  type EngineKind,
} from '@/lib/presets'

interface ControlPanelProps {
  kind: EngineKind
  aura: AuraParams
  prism: PrismParams
  setAura: (p: AuraParams) => void
  setPrism: (p: PrismParams) => void
}

function PaletteRow({
  swatches,
  active,
  onSelect,
}: {
  swatches: { name: string; colors: string[] }[]
  active: string[]
  onSelect: (i: number) => void
}) {
  const activeKey = active.join()
  return (
    <div className="flex flex-wrap gap-2">
      {swatches.map((p, i) => {
        const key = p.colors.join()
        return (
          <button
            key={p.name}
            type="button"
            title={p.name}
            aria-label={`Palette ${p.name}`}
            onClick={() => onSelect(i)}
            className={cn(
              'flex h-7 overflow-hidden rounded-full border transition-all',
              activeKey === key
                ? 'border-primary ring-2 ring-primary/25'
                : 'border-border hover:border-primary/40',
            )}
          >
            {p.colors.map((c, j) => (
              <span key={j} className="h-full w-4" style={{ backgroundColor: c }} />
            ))}
          </button>
        )
      })}
    </div>
  )
}

export function ControlPanel({ kind, aura, prism, setAura, setPrism }: ControlPanelProps) {
  if (kind === 'aura') {
    return (
      <div className="flex flex-col">
        <Section title="Palette">
          <PaletteRow
            swatches={AURA_PALETTES.map((p) => ({
              name: p.name,
              colors: [p.colBg, p.colEdge, p.colMid, p.colCore],
            }))}
            active={[aura.colBg, aura.colEdge, aura.colMid, aura.colCore]}
            onSelect={(i) => {
              const p = AURA_PALETTES[i]
              setAura({ ...aura, colCore: p.colCore, colMid: p.colMid, colEdge: p.colEdge, colBg: p.colBg })
            }}
          />
          <div className="grid grid-cols-1 gap-3 pt-1">
            <ColorField label="Core" value={aura.colCore} onChange={(v) => setAura({ ...aura, colCore: v })} />
            <ColorField label="Mid" value={aura.colMid} onChange={(v) => setAura({ ...aura, colMid: v })} />
            <ColorField label="Edge" value={aura.colEdge} onChange={(v) => setAura({ ...aura, colEdge: v })} />
            <ColorField label="Background" value={aura.colBg} onChange={(v) => setAura({ ...aura, colBg: v })} />
          </div>
        </Section>

        <Section title="Form">
          <Slider label="Size" value={aura.size} min={0.2} max={0.6} onChange={(v) => setAura({ ...aura, size: v })} />
          <Slider label="Softness" value={aura.softness} min={0.05} max={0.9} onChange={(v) => setAura({ ...aura, softness: v })} />
          <Slider label="Wobble" value={aura.wobble} min={0} max={0.16} onChange={(v) => setAura({ ...aura, wobble: v })} />
          <Slider label="Wobble speed" value={aura.wobbleSpeed} min={0.05} max={1.2} onChange={(v) => setAura({ ...aura, wobbleSpeed: v })} />
        </Section>

        <Section title="Motion">
          <Slider label="Breathing" value={aura.breath} min={0} max={0.18} onChange={(v) => setAura({ ...aura, breath: v })} />
          <Slider label="Breathing speed" value={aura.breathSpeed} min={0.1} max={1.2} onChange={(v) => setAura({ ...aura, breathSpeed: v })} />
          <Slider label="Gradient drift" value={aura.gradient} min={0} max={1} onChange={(v) => setAura({ ...aura, gradient: v })} />
          <Toggle label="React to hover" checked={aura.hoverReact} onChange={(v) => setAura({ ...aura, hoverReact: v })} />
          <Slider label="Hover intensity" value={aura.hoverStrength} min={0} max={1} onChange={(v) => setAura({ ...aura, hoverStrength: v })} />
        </Section>

        <Section title="Texture">
          <Slider label="Grain" value={aura.grain} min={0} max={0.16} onChange={(v) => setAura({ ...aura, grain: v })} />
          <Slider label="Grain size" value={aura.grainSize} min={1} max={6} step={0.1} onChange={(v) => setAura({ ...aura, grainSize: v })} />
        </Section>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <Section title="Background">
        <PaletteRow
          swatches={PRISM_BACKGROUNDS.map((p) => ({ name: p.name, colors: [p.colBg] }))}
          active={[prism.colBg]}
          onSelect={(i) => setPrism({ ...prism, colBg: PRISM_BACKGROUNDS[i].colBg })}
        />
        <div className="grid grid-cols-1 gap-3 pt-1">
          <ColorField label="Background" value={prism.colBg} onChange={(v) => setPrism({ ...prism, colBg: v })} />
        </div>
      </Section>

      <Section title="Form">
        <Slider label="Size" value={prism.size} min={0.2} max={0.6} onChange={(v) => setPrism({ ...prism, size: v })} />
        <Slider label="Softness" value={prism.softness} min={0.01} max={0.25} onChange={(v) => setPrism({ ...prism, softness: v })} />
        <Slider label="Glow size" value={prism.glowSize} min={0.1} max={0.6} onChange={(v) => setPrism({ ...prism, glowSize: v })} />
      </Section>

      <Section title="Color">
        <Slider label="Hue speed" value={prism.hueSpeed} min={0.01} max={0.3} onChange={(v) => setPrism({ ...prism, hueSpeed: v })} />
        <Slider label="Hue spread" value={prism.hueSpread} min={0} max={1.5} onChange={(v) => setPrism({ ...prism, hueSpread: v })} />
        <Slider label="Saturation" value={prism.saturation} min={0.3} max={1} onChange={(v) => setPrism({ ...prism, saturation: v })} />
        <Slider label="Chromatic aberration" value={prism.chroma} min={0} max={1} onChange={(v) => setPrism({ ...prism, chroma: v })} />
      </Section>

      <Section title="Motion">
        <Toggle label="React to hover" checked={prism.hoverReact} onChange={(v) => setPrism({ ...prism, hoverReact: v })} />
        <Slider label="Hover intensity" value={prism.hoverStrength} min={0} max={1} onChange={(v) => setPrism({ ...prism, hoverStrength: v })} />
      </Section>

      <Section title="Texture">
        <Slider label="Grain" value={prism.grain} min={0} max={0.16} onChange={(v) => setPrism({ ...prism, grain: v })} />
        <Slider label="Grain size" value={prism.grainSize} min={1} max={6} step={0.1} onChange={(v) => setPrism({ ...prism, grainSize: v })} />
      </Section>
    </div>
  )
}
