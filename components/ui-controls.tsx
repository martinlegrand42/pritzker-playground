'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-b border-border px-5 py-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  )
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 0.01,
  format,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  format?: (value: number) => string
  onChange: (value: number) => void
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between text-xs">
        <span className="text-foreground">{label}</span>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {format ? format(value) : value.toFixed(2)}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
      />
    </label>
  )
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between text-xs text-foreground">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn('relative h-5 w-9 rounded-full transition-colors', checked ? 'bg-primary' : 'bg-secondary')}
      >
        <span
          className={cn(
            'absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-background transition-transform',
            checked && 'translate-x-4',
          )}
        />
      </button>
    </div>
  )
}

// A bounded numeric field (px dimensions, etc). Mirrors ColorField's
// draft-text-then-commit pattern so typing a value doesn't fight the
// cursor, but clamps every committed value to [min, max] so it can't
// produce a degenerate/broken shape.
export function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = 'px',
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  suffix?: string
  onChange: (value: number) => void
}) {
  const [text, setText] = useState(String(value))
  const [prevValue, setPrevValue] = useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    setText(String(value))
  }

  const commit = (raw: string) => {
    const n = Number(raw)
    if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)))
  }

  return (
    <label className="flex items-center justify-between gap-3 text-xs text-foreground">
      <span>{label}</span>
      <span className="flex items-center gap-1.5">
        <input
          type="number"
          value={text}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            setText(e.target.value)
            commit(e.target.value)
          }}
          onBlur={() => setText(String(value))}
          aria-label={label}
          className="w-16 rounded border border-border bg-transparent px-1.5 py-1 text-right font-mono text-[11px] text-foreground focus:border-primary focus:outline-none"
        />
        <span className="font-mono text-[10px] text-muted-foreground">{suffix}</span>
      </span>
    </label>
  )
}

// A swatch (native picker, for quick browsing) paired with a hex text field
// that is the actual source of truth — typing/pasting a hex code is always
// the primary way to set an exact value, never just whatever RGB UI the
// browser's native color input happens to default to.
export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const [text, setText] = useState(value)
  // Reset the draft text whenever the prop changes from outside (palette
  // click, Reset, Generate) — done during render, per React's guidance for
  // adjusting state from props, rather than in a setState-in-effect.
  const [prevValue, setPrevValue] = useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    setText(value)
  }

  const commit = (raw: string) => {
    const cleaned = raw.trim().replace(/^#/, '')
    if (/^[0-9a-f]{6}$/i.test(cleaned)) {
      onChange(`#${cleaned.toLowerCase()}`)
    }
  }

  return (
    <label className="flex items-center justify-between gap-3 text-xs text-foreground">
      <span>{label}</span>
      <span className="flex items-center gap-2">
        <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full border border-border">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label={`${label} color swatch`}
            className="absolute -left-1 -top-1 h-8 w-8 cursor-pointer border-none bg-transparent p-0"
          />
        </span>
        <input
          type="text"
          value={text}
          spellCheck={false}
          maxLength={7}
          onChange={(e) => {
            setText(e.target.value)
            commit(e.target.value)
          }}
          onBlur={() => setText(value)}
          aria-label={`${label} hex value`}
          className="w-20 rounded border border-border bg-transparent px-1.5 py-1 font-mono text-[11px] uppercase text-muted-foreground focus:border-primary focus:text-foreground focus:outline-none"
        />
      </span>
    </label>
  )
}
