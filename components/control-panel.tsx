'use client'

import { ColorField, Section, Slider, Toggle } from './ui-controls'
import { cn } from '@/lib/utils'
import {
  AURA_PALETTES,
  FIELD_PALETTES,
  type AuraParams,
  type FieldParams,
  type EngineKind,
} from '@/lib/presets'

interface ControlPanelProps {
  kind: EngineKind
  aura: AuraParams
  field: FieldParams
  setAura: (p: AuraParams) => void
  setField: (p: FieldParams) => void
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

export function ControlPanel({ kind, aura, field, setAura, setField }: ControlPanelProps) {
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
        </Section>

        <Section title="Texture">
          <Slider label="Grain" value={aura.grain} min={0} max={0.16} onChange={(v) => setAura({ ...aura, grain: v })} />
        </Section>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <Section title="Palette">
        <PaletteRow
          swatches={FIELD_PALETTES.map((p) => ({
            name: p.name,
            colors: [p.col0, p.col1, p.col2, p.col3],
          }))}
          active={[field.col0, field.col1, field.col2, field.col3]}
          onSelect={(i) => {
            const p = FIELD_PALETTES[i]
            setField({ ...field, col0: p.col0, col1: p.col1, col2: p.col2, col3: p.col3 })
          }}
        />
        <div className="grid grid-cols-1 gap-3 pt-1">
          <ColorField label="Low" value={field.col0} onChange={(v) => setField({ ...field, col0: v })} />
          <ColorField label="Mid-low" value={field.col1} onChange={(v) => setField({ ...field, col1: v })} />
          <ColorField label="Mid-high" value={field.col2} onChange={(v) => setField({ ...field, col2: v })} />
          <ColorField label="High" value={field.col3} onChange={(v) => setField({ ...field, col3: v })} />
        </div>
      </Section>

      <Section title="Field">
        <Slider label="Scale" value={field.scale} min={1} max={4.5} onChange={(v) => setField({ ...field, scale: v })} />
        <Slider label="Warp" value={field.warp} min={0} max={3} onChange={(v) => setField({ ...field, warp: v })} />
        <Slider label="Contrast" value={field.contrast} min={0.6} max={2.4} onChange={(v) => setField({ ...field, contrast: v })} />
      </Section>

      <Section title="Motion">
        <Slider label="Flow speed" value={field.speed} min={0.01} max={0.35} onChange={(v) => setField({ ...field, speed: v })} />
        <Slider
          label="Thermal bands"
          value={field.bands}
          min={0}
          max={16}
          step={1}
          format={(v) => (v < 0.5 ? 'off' : String(Math.round(v)))}
          onChange={(v) => setField({ ...field, bands: v })}
        />
        <Toggle label="React to hover" checked={field.hoverReact} onChange={(v) => setField({ ...field, hoverReact: v })} />
      </Section>

      <Section title="Texture">
        <Slider label="Grain" value={field.grain} min={0} max={0.16} onChange={(v) => setField({ ...field, grain: v })} />
      </Section>
    </div>
  )
}
