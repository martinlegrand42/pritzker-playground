'use client'

import { useEffect, useRef, useState } from 'react'
import { Clapperboard, Download, ImageDown, Link2, RotateCcw } from 'lucide-react'
import { Stage } from './stage'
import { ShapeControlPanel } from './shape-control-panel'
import { StudioNav } from './studio-nav'
import { exportPng, recordLoop, downloadVideo } from '@/lib/export'
import { loadPersisted, savePersisted } from '@/lib/persist'
import { AURA_DEFAULT, type AuraParams } from '@/lib/presets'

const SHARE_PARAM = 's'

// Reuses Aura's own mark (Stage + AuraParams) as Shape Studio's shape --
// the three-separately-blurred-circles technique it's built on already
// produces the soft, layered look this tab was after, rather than the
// earlier SDF rounded-rect lens-blur approach fighting to approximate it.
// Motion diverges from Aura's own page though: no time-based breathing,
// and the blur/threshold expands based on cursor position instead (see
// uCursorExpand in lib/shaders.ts) -- so this tab gets its own default
// params and its own control panel rather than Aura's.
function encodeAuraParams(params: AuraParams): string {
  return btoa(JSON.stringify(params))
}

function decodeAuraParams(encoded: string): Partial<AuraParams> | null {
  try {
    return JSON.parse(atob(encoded))
  } catch {
    return null
  }
}

const SHAPE_DEFAULT: AuraParams = {
  ...AURA_DEFAULT,
  size: 0.2,
  breath: 0,
  breathSpeed: 0,
  wobble: 0,
  gradient: 0,
  hoverReact: false,
  hoverStrength: 0,
  cursorExpand: 0.7,
  edgeBlurRatio: 0.85,
  edgeSizeRatio: 0.75,
  midSizeRatio: 0.95,
  // Color Burn barely darkens a light backdrop (its math divides by the
  // burn color, so a near-white backdrop stays near-white regardless of
  // mix amount), which is exactly the mid/edge boundary here -- reading as
  // a faint uneven/lighter patch rather than a clean gradient. A plain
  // linear mix doesn't have that quirk.
  midBurn: false,
}

const STORAGE_KEY = 'pritzker-identity-studio:shape:v10'

export function ShapePlayground() {
  const [aura, setAuraState] = useState<AuraParams>(SHAPE_DEFAULT)
  const [error, setError] = useState<string | null>(null)

  const [recording, setRecording] = useState(false)
  const [progress, setProgress] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const recordHandle = useRef<{ stop: () => void } | null>(null)

  // A share link's own params take priority over whatever's already saved
  // in this browser, so opening someone else's URL always reproduces
  // their exact look rather than silently keeping your own local one.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const encoded = new URLSearchParams(window.location.search).get(SHARE_PARAM)
    const fromUrl = encoded ? decodeAuraParams(encoded) : null
    if (fromUrl) {
      setAuraState((p) => ({ ...p, ...fromUrl }))
      return
    }
    const saved = loadPersisted<AuraParams>(STORAGE_KEY)
    if (saved) setAuraState((p) => ({ ...p, ...saved }))
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  const setAura = (next: AuraParams) => {
    setAuraState(next)
    savePersisted<AuraParams>(STORAGE_KEY, next)
    const url = new URL(window.location.href)
    url.searchParams.set(SHARE_PARAM, encodeAuraParams(next))
    window.history.replaceState(null, '', url)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setToast('Link copied — it reproduces this exact look')
  }

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const handleReset = () => setAura(SHAPE_DEFAULT)

  const handleExportPng = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    exportPng(canvas, `pritzker-shape-${Date.now()}`)
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
      (url, mimeType) => {
        setRecording(false)
        recordHandle.current = null
        if (!url) {
          setToast('Video recording is not supported in this browser')
          return
        }
        downloadVideo(url, `pritzker-shape-loop-${Date.now()}`, mimeType)
        setToast(mimeType.startsWith('video/mp4') ? '6s loop exported (.mp4)' : '6s loop exported (.webm — mp4 unsupported here)')
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

        <StudioNav />

        <div className="flex items-center gap-1.5">
          <ToolButton onClick={handleReset} icon={<RotateCcw className="h-4 w-4" />} label="Reset" hideLabelOnMobile />
          <ToolButton onClick={handleCopyLink} icon={<Link2 className="h-4 w-4" />} label="Copy link" hideLabelOnMobile />
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

          <div className="relative z-[1] h-full w-full max-w-[900px] overflow-hidden shadow-[0_20px_60px_-24px_rgba(20,30,80,0.35)] ring-1 ring-black/5">
            <Stage aura={aura} canvasRef={canvasRef} onError={setError} />
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
              <p className="text-sm font-semibold">Shape</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Aura&apos;s mark, reused
              </p>
            </div>
          </div>

          <ShapeControlPanel aura={aura} setAura={setAura} />

          <div className="mt-auto border-t border-border px-5 py-4">
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              The same breathing, wobbly gradient mark as Aura — move the cursor near it, then
              export a still or a 6-second loop.
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
