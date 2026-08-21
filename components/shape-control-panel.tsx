'use client'

import { ColorField, NumberField, Section, Slider, Toggle } from './ui-controls'
import { SHAPE_LIMITS, type ShapeParams } from '@/lib/shape-presets'

interface ShapeControlPanelProps {
  shape: ShapeParams
  setShape: (p: ShapeParams) => void
}

export function ShapeControlPanel({ shape, setShape }: ShapeControlPanelProps) {
  const maxRadius = Math.min(shape.widthPx, shape.heightPx) / 2

  return (
    <div className="flex flex-col">
      <Section title="Format">
        <NumberField
          label="Width"
          value={shape.widthPx}
          min={SHAPE_LIMITS.widthPx.min}
          max={SHAPE_LIMITS.widthPx.max}
          onChange={(v) => setShape({ ...shape, widthPx: v })}
        />
        <NumberField
          label="Height"
          value={shape.heightPx}
          min={SHAPE_LIMITS.heightPx.min}
          max={SHAPE_LIMITS.heightPx.max}
          onChange={(v) => setShape({ ...shape, heightPx: v })}
        />
      </Section>

      <Section title="Color">
        <ColorField label="Background" value={shape.bgColor} onChange={(v) => setShape({ ...shape, bgColor: v })} />
        <ColorField label="Shape" value={shape.shapeColor} onChange={(v) => setShape({ ...shape, shapeColor: v })} />
      </Section>

      <Section title="Style">
        <Slider
          label="Corner radius"
          value={Math.min(shape.radiusPx, maxRadius)}
          min={0}
          max={Math.max(maxRadius, 1)}
          step={1}
          format={(v) => `${Math.round(v)}px`}
          onChange={(v) => setShape({ ...shape, radiusPx: v })}
        />
        <Toggle label="Bordered" checked={shape.bordered} onChange={(v) => setShape({ ...shape, bordered: v })} />
        {shape.bordered ? (
          <Slider
            label="Border width"
            value={shape.borderWidthPx}
            min={SHAPE_LIMITS.borderWidthPx.min}
            max={SHAPE_LIMITS.borderWidthPx.max}
            step={1}
            format={(v) => `${Math.round(v)}px`}
            onChange={(v) => setShape({ ...shape, borderWidthPx: v })}
          />
        ) : null}
      </Section>

      <Section title="Motion">
        <Slider
          label="Hover blur intensity"
          value={shape.hoverIntensity}
          min={0}
          max={1}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => setShape({ ...shape, hoverIntensity: v })}
        />
      </Section>
    </div>
  )
}
