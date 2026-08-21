'use client'

import { ColorField, Section, Slider, Toggle } from './ui-controls'
import { cn } from '@/lib/utils'
import { SHAPE_LIMITS, SHAPE_TYPE_SIZE, type ShapeParams, type ShapeType } from '@/lib/shape-presets'

interface ShapeControlPanelProps {
  shape: ShapeParams
  setShape: (p: ShapeParams) => void
}

const SHAPE_TYPES: { id: ShapeType; label: string }[] = [
  { id: 'rectangle', label: 'Rectangle' },
  { id: 'square', label: 'Square' },
  { id: 'circle', label: 'Circle' },
]

export function ShapeControlPanel({ shape, setShape }: ShapeControlPanelProps) {
  const maxRadius = Math.min(shape.widthPx, shape.heightPx) / 2

  const setShapeType = (shapeType: ShapeType) => {
    setShape({ ...shape, shapeType, ...SHAPE_TYPE_SIZE[shapeType] })
  }

  return (
    <div className="flex flex-col">
      <Section title="Format">
        <div className="grid grid-cols-3 gap-1 rounded-full border border-border bg-secondary/40 p-1">
          {SHAPE_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setShapeType(t.id)}
              className={cn(
                'rounded-full px-2 py-1 text-[11px] font-medium transition-colors',
                shape.shapeType === t.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Slider
          label="Zoom"
          value={shape.zoom}
          min={SHAPE_LIMITS.zoom.min}
          max={SHAPE_LIMITS.zoom.max}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => setShape({ ...shape, zoom: v })}
        />
      </Section>

      <Section title="Color">
        <ColorField label="Background" value={shape.bgColor} onChange={(v) => setShape({ ...shape, bgColor: v })} />
        <ColorField label="Shape" value={shape.shapeColor} onChange={(v) => setShape({ ...shape, shapeColor: v })} />
      </Section>

      <Section title="Style">
        {shape.shapeType !== 'circle' ? (
          <Slider
            label="Corner radius"
            value={Math.min(shape.radiusPx, maxRadius)}
            min={0}
            max={Math.max(maxRadius, 1)}
            step={1}
            format={(v) => `${Math.round(v)}px`}
            onChange={(v) => setShape({ ...shape, radiusPx: v })}
          />
        ) : null}
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
