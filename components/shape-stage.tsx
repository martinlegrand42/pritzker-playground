'use client'

import { useEffect, useRef } from 'react'
import { createRenderer, ContextLostError, type Renderer, type Uniforms } from '@/lib/shader-runtime'
import { SHAPE_FRAG } from '@/lib/shape-shaders'
import { hexToRgb } from '@/lib/presets'
import { type ShapeParams } from '@/lib/shape-presets'

// Fraction of the canvas's short side left as a background margin around
// the shape at full zoom, so the background color always reads as a
// visible frame even before the user dezooms it further.
const PADDING_FRACTION = 0.08

interface ShapeStageProps {
  shape: ShapeParams
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  onError?: (message: string) => void
}

export function ShapeStage({ shape, canvasRef, onError }: ShapeStageProps) {
  const shapeRef = useRef(shape)
  /* eslint-disable react-hooks/refs */
  shapeRef.current = shape
  /* eslint-enable react-hooks/refs */

  // Mouse position in CSS px (canvas-local, top-left origin), and how far
  // the lens is currently faded in — eased so leaving/entering the canvas
  // reads as a smooth defocus rather than a hard cut.
  const pointerRef = useRef<[number, number]>([-9999, -9999])
  const hoverRef = useRef(0)
  const hoverTargetRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let renderer: Renderer | null = null
    let raf = 0
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let cancelled = false

    const init = (attempt: number) => {
      if (cancelled) return
      try {
        renderer = createRenderer(canvas, SHAPE_FRAG)
        onError?.('')
        raf = requestAnimationFrame(frame)
      } catch (err) {
        if (err instanceof ContextLostError && attempt < 5) {
          retryTimer = setTimeout(() => init(attempt + 1), 120 * (attempt + 1))
          return
        }
        onError?.(err instanceof Error ? err.message : 'Failed to initialize renderer')
      }
    }

    const frame = () => {
      hoverRef.current += (hoverTargetRef.current - hoverRef.current) * 0.08

      const p = shapeRef.current
      const width = canvas.clientWidth || 1
      const height = canvas.clientHeight || 1
      const dpr = renderer ? renderer.canvas.width / width : 1

      // Zoom scales the shape's own half-extent down from its full-frame
      // size (zoom = 1, the original tight framing) toward the canvas
      // center, which grows the margin around it on every side — "dezoom"
      // reads as the shape shrinking away within a fixed-size frame.
      const minSideDevice = Math.min(width, height) * dpr
      const basePadding = PADDING_FRACTION * minSideDevice
      const baseHalf = 0.5 * minSideDevice - basePadding
      const zoom = Math.min(1, Math.max(p.zoom, 0))
      const shapeHalf = zoom * baseHalf
      const padding = 0.5 * minSideDevice - shapeHalf
      const halfShort = shapeHalf / dpr
      // A circle is just the rounded rect with its radius maxed out —
      // Infinity clamps to halfShort below exactly like any other radius
      // past the shape's short side would.
      const radiusPx = p.shapeType === 'circle' ? Infinity : p.radiusPx
      const radius = Math.min(radiusPx, Math.max(halfShort, 0)) * dpr

      const [mx, my] = pointerRef.current
      const uniforms: Uniforms = {
        uMouse: [mx * dpr, (height - my) * dpr],
        uPadding: padding,
        uRadius: radius,
        uBordered: p.bordered ? 1 : 0,
        uBorderWidth: p.borderWidthPx * dpr,
        uHoverIntensity: p.hoverIntensity * hoverRef.current,
        uCenterDamp: p.centerBlurReduction,
        uColBg: hexToRgb(p.bgColor),
        uColShape: hexToRgb(p.shapeColor),
        uColHover: hexToRgb(p.hoverColor),
      }

      if (renderer) renderer.render(uniforms)
      raf = requestAnimationFrame(frame)
    }

    let started = false
    const maybeStart = () => {
      if (started || cancelled) return
      if (canvas.clientWidth > 0 && canvas.clientHeight > 0) {
        started = true
        init(0)
      }
    }

    const ro = new ResizeObserver(() => maybeStart())
    ro.observe(canvas)
    maybeStart()

    return () => {
      cancelled = true
      ro.disconnect()
      cancelAnimationFrame(raf)
      if (retryTimer) clearTimeout(retryTimer)
      renderer?.destroy()
    }
    // Mount once — one shader program, nothing to recreate for.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updatePointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    pointerRef.current = [e.clientX - rect.left, e.clientY - rect.top]
  }

  return (
    <div
      className="relative h-full w-full"
      onPointerEnter={() => (hoverTargetRef.current = 1)}
      onPointerLeave={() => (hoverTargetRef.current = 0)}
      onPointerMove={updatePointer}
    >
      <canvas ref={canvasRef} className="h-full w-full" aria-label="Shape preview" />
    </div>
  )
}
