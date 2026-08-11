'use client'

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

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-xs text-foreground">
      <span>{label}</span>
      <span className="flex items-center gap-2">
        <span className="relative h-6 w-6 overflow-hidden rounded-full border border-border">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label={label}
            className="absolute -left-1 -top-1 h-8 w-8 cursor-pointer border-none bg-transparent p-0"
          />
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">{value}</span>
      </span>
    </label>
  )
}
