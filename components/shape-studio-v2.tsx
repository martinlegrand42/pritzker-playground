'use client'

import { StudioNav } from './studio-nav'
import { StageGrid } from './stage-grid'
import { ShapeBlobScroll } from './shape-blob-scroll'
import { VersionToggle, type StudioVersion } from './version-toggle'

interface ShapeStudioV2Props {
  version: StudioVersion
  onVersionChange: (version: StudioVersion) => void
}

export function ShapeStudioV2({ version, onVersionChange }: ShapeStudioV2Props) {
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

        <VersionToggle version={version} onChange={onVersionChange} />
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Stage */}
        <div className="relative flex min-h-[52vh] flex-1 items-center justify-center overflow-hidden p-4 md:p-8 lg:min-h-0">
          <StageGrid />

          <div className="relative z-[1] h-full w-full max-w-[720px] overflow-hidden shadow-[0_20px_60px_-24px_rgba(20,30,80,0.35)] ring-1 ring-black/5">
            <ShapeBlobScroll />
          </div>
        </div>

        {/* Info */}
        <aside className="flex w-full shrink-0 flex-col border-t border-border bg-card lg:w-[344px] lg:border-l lg:border-t-0 lg:overflow-y-auto">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <p className="text-sm font-semibold">Shape</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Scroll-linked glow
              </p>
            </div>
          </div>

          <div className="space-y-3 px-5 py-4 text-[11px] leading-relaxed text-muted-foreground">
            <p>
              Scroll inside the preview to move through the section. The glow starts as a tall
              oval near the top, rounds out to a compact circle dead-center at the midpoint, then
              stretches back into a tall oval again lower down.
            </p>
            <p>Position and shape are driven entirely by scroll progress — there&apos;s no hover interaction in this version.</p>
          </div>

          <div className="mt-auto border-t border-border px-5 py-4">
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              A single soft radial glow, always centered horizontally, with no hard edges at any
              point in the scroll.
            </p>
          </div>
        </aside>
      </div>
    </main>
  )
}
