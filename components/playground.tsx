'use client'

import { useEffect, useRef, useState } from 'react'
import { Clapperboard, Dices, Download, ImageDown, RotateCcw } from 'lucide-react'
import { Stage } from './stage'
import { ControlPanel } from './control-panel'
import { cn } from '@/lib/utils'
import { exportPng, recordLoop, downloadVideo } from '@/lib/export'
import {
  AURA_DEFAULT,
  FIELD_DEFAULT,
  randomizeAura,
  randomizeField,
  type AuraParams,
  type FieldParams,
  type EngineKind,
} from '@/lib/presets'

type Aspect = 'square' | 'wide' | 'portrait' | 'fill'

const ASPECTS: { id: Aspect; label: string; ratio?: number }[] = [
  { id: 'fill', label: 'Fill' },
  { id: 'square', label: '1:1', ratio: 1 },
  { id: 'wide', label: '16:9', ratio: 16 / 9 },
  { id: 'portrait', label: '4:5', ratio: 4 / 5 },
]

const ENGINES: { id: EngineKind; label: string; sub: string }[] = [
  { id: 'aura', label: 'Aura', sub: 'The mark' },
  { id: 'field', label: 'Field', sub: 'The environment' },
]

export function Playground() {
  const [kind, setKind] = useState<EngineKind>('aura')
  const [aura, setAura] = useState<AuraParams>(AURA_DEFAULT)
  const [field, setField] = useState<FieldParams>(FIELD_DEFAULT)
  const [aspect, setAspect] = useState<Aspect>('fill')
  const [error, setError] = useState<string | null>(null)

  const [recording, setRecording] = useState(false)
  const [progress, setProgress] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const recordHandle = useRef<{ stop: () => void } | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const activeRatio = ASPECTS.find((a) => a.id === aspect)?.ratio

  const handleRandomize = () => {
    if (kind === 'aura') setAura((p) => randomizeAura(p))
    else setField((p) => randomizeField(p))
  }

  const handleReset = () => {
    if (kind === 'aura') setAura(AURA_DEFAULT)
    else setField(FIELD_DEFAULT)
  }

  const handleExportPng = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    exportPng(canvas, `pritzker-${kind}-${Date.now()}`)
    setToast('Still frame exported (.png)')
  }

  const handleExportLoop = () => {
    const canvas = canvasRef.current
    if (!canvas || recording) return
    setRecording(true)
    setProgress(0)
    recordHandle.current = recordLoop(
      canvas,
      6000,
      (t) => setProgress(t),
      (url) => {
        setRecording(false)
        recordHandle.current = null
        if (!url) {
          setToast('Video recording is not supported in this browser')
          return
        }
        downloadVideo(url, `pritzker-${kind}-loop-${Date.now()}`)
        setToast('6s loop exported (.webm)')
      },
    )
  }

  return (
    <main className="flex min-h-screen flex-col bg-background lg:h-screen lg:overflow-hidden">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary">
            <span className="h-2.5 w-2.5 rounded-full bg-primary-foreground" />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold tracking-tight">Pritzker Foundation</p>
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Identity Studio
            </p>
          </div>
        </div>

        {/* Engine switch */}
        <div className="hidden items-center rounded-full border border-border bg-card p-1 sm:flex">
          {ENGINES.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setKind(e.id)}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-medium transition-colors',
                kind === e.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {e.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <ToolButton onClick={handleRandomize} icon={<Dices className="h-4 w-4" />} label="Generate" hideLabelOnMobile />
          <ToolButton onClick={handleReset} icon={<RotateCcw className="h-4 w-4" />} label="Reset" hideLabelOnMobile />
          <div className="mx-1 hidden h-5 w-px bg-border sm:block" />
          <ToolButton onClick={handleExportPng} icon={<ImageDown className="h-4 w-4" />} label="PNG" hideLabelOnMobile />
          <button
            type="button"
            onClick={handleExportLoop}
            disabled={recording}
            className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <Clapperboard className="h-4 w-4" />
            <span className="hidden sm:inline">{recording ? `${Math.round(progress * 100)}%` : 'Export loop'}</span>
          </button>
        </div>
      </header>

      {/* Mobile engine switch */}
      <div className="flex items-center gap-1 border-b border-border p-2 sm:hidden">
        {ENGINES.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => setKind(e.id)}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              kind === e.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
            )}
          >
            {e.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Stage */}
        <div className="relative flex min-h-[52vh] flex-1 items-center justify-center overflow-hidden p-4 md:p-8 lg:min-h-0">
          <StageGrid />
          {/* Aspect chips */}
          <div className="absolute left-4 top-4 z-10 flex gap-1 rounded-full border border-border bg-card/80 p-1 backdrop-blur md:left-8 md:top-8">
            {ASPECTS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAspect(a.id)}
                className={cn(
                  'rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors',
                  aspect === a.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {a.label}
              </button>
            ))}
          </div>

          <div
            className="relative z-[1] max-h-full max-w-full overflow-hidden rounded-2xl border border-border shadow-[0_20px_60px_-24px_rgba(20,30,80,0.35)] ring-1 ring-black/5"
            style={
              activeRatio
                ? { aspectRatio: String(activeRatio), width: activeRatio >= 1 ? 'min(100%, 900px)' : 'auto', height: activeRatio >= 1 ? 'auto' : 'min(100%, 640px)' }
                : { width: '100%', height: '100%' }
            }
          >
            <Stage kind={kind} aura={aura} field={field} canvasRef={canvasRef} onError={setError} />
            {error ? (
              <div className="absolute inset-0 flex items-center justify-center bg-secondary/95 p-6 text-center text-sm text-muted-foreground">
                {error}
              </div>
            ) : null}
          </div>
        </div>

        {/* Controls */}
        <aside className="flex w-full shrink-0 flex-col border-t border-border bg-card lg:w-[344px] lg:border-l lg:border-t-0 lg:overflow-y-auto">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <p className="text-sm font-semibold">{ENGINES.find((e) => e.id === kind)?.label}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {ENGINES.find((e) => e.id === kind)?.sub}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRandomize}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <Dices className="h-3.5 w-3.5" />
              Generate
            </button>
          </div>

          <ControlPanel kind={kind} aura={aura} field={field} setAura={setAura} setField={setField} />

          <div className="mt-auto border-t border-border px-5 py-4">
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {kind === 'aura'
                ? 'A living mark that breathes and wobbles — never a perfect circle. Hover it, generate variations, then export a still or a 6-second loop.'
                : 'The identity as an environment: a warped thermal gradient for wallpapers and motion backgrounds. Add thermal bands for a contour look.'}
            </p>
          </div>
        </aside>
      </div>

      {/* Recording overlay */}
      {recording && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2.5 shadow-lg">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive/60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
            </span>
            <span className="text-xs font-medium">Recording loop</span>
            <span className="h-1 w-28 overflow-hidden rounded-full bg-secondary">
              <span className="block h-full bg-primary transition-[width]" style={{ width: `${progress * 100}%` }} />
            </span>
            <button
              type="button"
              onClick={() => recordHandle.current?.stop()}
              className="pointer-events-auto text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Stop
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && !recording && (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center">
          <div className="flex items-center gap-2 rounded-full border border-border bg-foreground px-4 py-2.5 text-xs font-medium text-background shadow-lg">
            <Download className="h-3.5 w-3.5" />
            {toast}
          </div>
        </div>
      )}
    </main>
  )
}

function ToolButton({
  onClick,
  icon,
  label,
  hideLabelOnMobile,
}: {
  onClick: () => void
  icon: React.ReactNode
  label: string
  hideLabelOnMobile?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
    >
      {icon}
      <span className={hideLabelOnMobile ? 'hidden sm:inline' : ''}>{label}</span>
    </button>
  )
}

function StageGrid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.5]"
      style={{
        backgroundImage:
          'linear-gradient(to right, color-mix(in oklch, var(--border) 60%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklch, var(--border) 60%, transparent) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 78%)',
      }}
    />
  )
}
