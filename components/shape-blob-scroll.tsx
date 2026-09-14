'use client'

import { useEffect, useRef, useState } from 'react'

// Three fixed keyframes along scroll progress (0..1) through the demo
// section, per spec: enter and exit are a tall portrait oval off-center,
// middle rounds out to near-circular and centers exactly.
const KEYFRAMES = [
  { at: 0, widthFrac: 0.55, aspect: 1.16, centerFrac: 0.44 },
  { at: 0.5, widthFrac: 0.43, aspect: 1.03, centerFrac: 0.5 },
  { at: 1, widthFrac: 0.55, aspect: 1.16, centerFrac: 0.64 },
] as const

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

// Smoothstep easing between keyframes rather than linear interpolation, so
// the blob eases into/out of the middle state instead of changing speed
// abruptly right at each keyframe boundary.
function ease(t: number) {
  return t * t * (3 - 2 * t)
}

function interpolate(progress: number) {
  const p = Math.min(1, Math.max(0, progress))
  const [enter, middle, exit] = KEYFRAMES
  const [a, b, t] =
    p <= middle.at
      ? ([enter, middle, ease(p / middle.at)] as const)
      : ([middle, exit, ease((p - middle.at) / (1 - middle.at))] as const)
  return {
    widthFrac: lerp(a.widthFrac, b.widthFrac, t),
    aspect: lerp(a.aspect, b.aspect, t),
    centerFrac: lerp(a.centerFrac, b.centerFrac, t),
  }
}

// A soft radial glow whose size, aspect, and vertical position are driven by
// scroll progress through an internally-scrollable section (no page-level
// scroll-jacking) — enter/exit as a tall off-center oval, rounding out to a
// compact circle dead-center at the midpoint.
export function ShapeBlobScroll() {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [progress, setProgress] = useState(0)
  const [size, setSize] = useState({ w: 600, h: 600 })

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight
      setProgress(max > 0 ? el.scrollTop / max : 0)
    }
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    onScroll()
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      ro.disconnect()
      el.removeEventListener('scroll', onScroll)
    }
  }, [])

  const { widthFrac, aspect, centerFrac } = interpolate(progress)
  const blobWidthPx = widthFrac * size.w
  // Heavy blur, scaling with the blob's own size so it stays proportionally
  // just as soft whether the blob is at its smaller or larger keyframe.
  const blurPx = Math.max(24, blobWidthPx * 0.16)

  return (
    <div ref={scrollRef} className="relative h-full w-full overflow-x-hidden overflow-y-scroll">
      <div className="relative" style={{ height: size.h * 3 }}>
        <div className="sticky top-0" style={{ height: size.h }}>
          <div
            className="absolute left-1/2 rounded-full"
            style={{
              width: `${widthFrac * 100}%`,
              aspectRatio: `1 / ${aspect}`,
              top: `${centerFrac * 100}%`,
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, #132FDF 0%, #8DC0F6 55%, transparent 78%)',
              filter: `blur(${blurPx}px)`,
            }}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <span className="rounded-full bg-card/80 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur">
              Scroll to preview — {Math.round(progress * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
