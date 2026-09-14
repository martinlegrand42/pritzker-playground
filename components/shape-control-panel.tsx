'use client'

import { ColorField, Section, Slider, Toggle } from './ui-controls'
import { type AuraParams } from '@/lib/presets'

interface ShapeControlPanelProps {
  aura: AuraParams
  setAura: (p: AuraParams) => void
}

// A fork of Aura's own ControlPanel, not a reuse of it — Shape Studio's
// motion needs diverged from Aura's (cursor-position-driven threshold
// instead of time-based breathing), so showing Aura's breathing sliders
// here would expose a control that no longer does anything meaningful for
// this tab, and adding the cursor control to the shared panel would leak
// it onto Aura's own page.
export function ShapeControlPanel({ aura, setAura }: ShapeControlPanelProps) {
  return (
    <div className="flex flex-col">
      <Section title="Palette">
        <div className="grid grid-cols-1 gap-3">
          <ColorField label="Core" value={aura.colCore} onChange={(v) => setAura({ ...aura, colCore: v })} />
          <ColorField label="Mid" value={aura.colMid} onChange={(v) => setAura({ ...aura, colMid: v })} />
          <ColorField label="Edge" value={aura.colEdge} onChange={(v) => setAura({ ...aura, colEdge: v })} />
          <ColorField label="Background" value={aura.colBg} onChange={(v) => setAura({ ...aura, colBg: v })} />
        </div>
        <Toggle label="Color burn (mid)" checked={aura.midBurn} onChange={(v) => setAura({ ...aura, midBurn: v })} />
      </Section>

      <Section title="Form">
        <Slider label="Size" value={aura.size} min={0.2} max={0.6} onChange={(v) => setAura({ ...aura, size: v })} />
        <Slider label="Softness" value={aura.softness} min={0.05} max={0.9} onChange={(v) => setAura({ ...aura, softness: v })} />
        <Slider label="Wobble" value={aura.wobble} min={0} max={0.16} onChange={(v) => setAura({ ...aura, wobble: v })} />
        <Slider label="Wobble speed" value={aura.wobbleSpeed} min={0.05} max={1.2} onChange={(v) => setAura({ ...aura, wobbleSpeed: v })} />
      </Section>

      <Section title="Motion">
        <Slider label="Gradient drift" value={aura.gradient} min={0} max={1} onChange={(v) => setAura({ ...aura, gradient: v })} />
        <Toggle label="React to hover" checked={aura.hoverReact} onChange={(v) => setAura({ ...aura, hoverReact: v })} />
        <Slider label="Hover intensity" value={aura.hoverStrength} min={0} max={0.6} onChange={(v) => setAura({ ...aura, hoverStrength: v })} />
        <Slider
          label="Cursor threshold expansion"
          value={aura.cursorExpand}
          min={0}
          max={1}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => setAura({ ...aura, cursorExpand: v })}
        />
      </Section>

      <Section title="Texture">
        <Toggle label="Grain" checked={aura.grainOn} onChange={(v) => setAura({ ...aura, grainOn: v })} />
        <Slider label="Grain amount" value={aura.grain} min={0} max={0.16} onChange={(v) => setAura({ ...aura, grain: v })} />
        <Slider label="Grain size" value={aura.grainSize} min={1} max={6} step={0.1} onChange={(v) => setAura({ ...aura, grainSize: v })} />
      </Section>
    </div>
  )
}
