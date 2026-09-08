'use client'

import { useEffect, useRef, useState } from 'react'
import { Clapperboard, Dices, Download, ImageDown, RotateCcw } from 'lucide-react'
import { Stage } from './stage'
import { ControlPanel } from './control-panel'
import { cn } from '@/lib/utils'
import { exportPng, recordLoop, downloadVideo } from '@/lib/export'
import { loadPersisted, savePersisted } from '@/lib/persist'
import { AURA_DEFAULT, randomizeAura, type AuraParams } from '@/lib/presets'

type Aspect = 'square' | 'wide' | 'portrait' | 'fill'

const ASPECTS: { id: Aspect; label: string; ratio?: number }[] = [
  { id: 'fill', label: 'Fill' },
  { id: 'square', label: '1:1', ratio: 1 },
  { id: 'wide', label: '16:9', ratio: 16 / 9 },
  { id: 'portrait', label: '4:5', ratio: 4 / 5 },
]

const STORAGE_KEY = 'pritzker-identity-studio:v1'

interface PersistedState {
  aspect: Aspect
  aura: AuraParams
}

export function Playground() {
  // SSR/first paint always uses these defaults, matching the static
  // prerender exactly — no hydration mismatch. A mount-only effect below
  // then corrects from localStorage if there's a saved look.
  const [aura, setAuraState] = useState<AuraParams>(AURA_DEFAULT)
  const [aspect, setAspectState] = useState<Aspect>('fill')
  const [error, setError] = useState<string | null>(null)

  const [recording, setRecording] = useState(false)
  const [progress, setProgress] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [exportWidth, setExportWidth] = useState<number | undefined>(undefined)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const recordHandle = useRef<{ stop: () => void } | null>(null)

  // Load any saved look once, after mount (client-only, so it can't create
  // a hydration mismatch). This uses the raw setters, not the persisting
  // wrappers below — hydrating shouldn't itself trigger a write.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = loadPersisted<PersistedState>(STORAGE_KEY)
    if (!saved) return
    if (saved.aspect && ASPECTS.some((a) => a.id === saved.aspect)) setAspectState(saved.aspect)
    if (saved.aura) setAuraState((p) => ({ ...p, ...saved.aura }))
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Every user-driven change persists immediately, using the value it just
  // computed rather than whatever's in the outer closure — so this can
  // never race with (or be raced by) the load effect above.
  const setAspect = (next: Aspect) => {
    setAspectState(next)
    savePersisted<PersistedState>(STORAGE_KEY, { aspect: next, aura })
  }
  const setAura = (updater: AuraParams | ((p: AuraParams) => AuraParams)) => {
    setAuraState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      savePersisted<PersistedState>(STORAGE_KEY, { aspect, aura: next })
      return next
    })
  }

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const activeRatio = ASPECTS.find((a) => a.id === aspect)?.ratio

  const handleRandomize = () => setAura((p) => randomizeAura(p))
  const handleReset = () => setAura(AURA_DEFAULT)

  const handleExportPng = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    exportPng(canvas, `pritzker-aura-${Date.now()}`)
    setToast('Still frame exported (.png)')
  }

  // H.264's hardware encoder can reject a large resolution outright — e.g.
  // "the given encoder configuration is not supported by the encoder" — even
  // though mp4 itself is supported. mp4 must stay mp4, so what steps down
  // here is the resolution, not the format; only at the smallest width does
  // recordLoop get permission to fall back to webm as a last resort.
  const EXPORT_WIDTHS = [4000, 2560, 1920, 1280]

  const attemptExportLoop = (canvas: HTMLCanvasElement, widthIndex: number) => {
    setExportWidth(EXPORT_WIDTHS[widthIndex])
    setProgress(0)
    // Switching exportWidth only takes effect once React re-renders Stage
    // and its own rAF loop resizes the canvas — a couple of frames away.
    // Wait for that before starting captureStream, so the recording starts
    // at the export resolution from frame one instead of resizing partway
    // through (which some encoders handle poorly).
    const isLastWidth = widthIndex === EXPORT_WIDTHS.length - 1
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        recordHandle.current = recordLoop(
          canvas,
          6000,
          (t) => setProgress(t),
          (url, mimeType, reason, actualSize) => {
            recordHandle.current = null
            if (!url) {
              if (!isLastWidth) {
                attemptExportLoop(canvas, widthIndex + 1)
                return
              }
              setRecording(false)
              setExportWidth(undefined)
              setToast(reason || 'Video recording is not supported in this browser')
              return
            }
            setRecording(false)
            setExportWidth(undefined)
            downloadVideo(url, `pritzker-aura-loop-${Date.now()}`, mimeType)
            // Report what the file actually decodes to, not what we asked
            // for — some encoders silently clamp resolution rather than
            // erroring, and a wrong claim is worse than an honest one.
            const res = actualSize ? `${actualSize.width}x${actualSize.height}` : `~${EXPORT_WIDTHS[widthIndex]}px wide (unverified)`
            setToast(
              mimeType.startsWith('video/mp4')
                ? `6s loop exported (.mp4, ${res})`
                : `6s loop exported (.webm — mp4 unsupported here, ${res})`,
            )
          },
          // mp4 is required at every width except the last — only once
          // every resolution has failed to produce mp4 is webm allowed,
          // as an absolute last resort rather than a routine substitute.
          isLastWidth,
        )
      })
    })
  }

  const handleExportLoop = () => {
    const canvas = canvasRef.current
    if (!canvas || recording) return
    setRecording(true)
    attemptExportLoop(canvas, 0)
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
            <Stage aura={aura} canvasRef={canvasRef} onError={setError} exportWidth={exportWidth} />
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
              <p className="text-sm font-semibold">Aura</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">The mark</p>
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

          <ControlPanel aura={aura} setAura={setAura} />

          <div className="mt-auto border-t border-border px-5 py-4">
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              A living mark that breathes and wobbles — never a perfect circle. Hover it, generate
              variations, then export a still or a 6-second loop.
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
