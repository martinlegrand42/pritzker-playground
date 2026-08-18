'use client'

import { useEffect, useRef } from 'react'
import { createRenderer, ContextLostError, type Renderer, type Uniforms } from '@/lib/shader-runtime'
import { AURA_FRAG } from '@/lib/shaders'
import { hexToRgb, type AuraParams } from '@/lib/presets'

interface StageProps {
  aura: AuraParams
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  onError?: (message: string) => void
}

export function Stage({ aura, canvasRef, onError }: StageProps) {
  // Keep latest params in a ref so the render loop reads fresh values
  // without tearing down WebGL on every slider change.
  const auraRef = useRef(aura)
  // Deliberate "latest ref" sync: written during render, only ever read
  // later from the rAF loop/event handlers below — never read here.
  /* eslint-disable react-hooks/refs */
  auraRef.current = aura
  /* eslint-enable react-hooks/refs */

  const pointerRef = useRef<[number, number]>([0.5, 0.5])
  const hoverRef = useRef(0)
  const hoverTargetRef = useRef(0)
  // The raw cursor position jumps a lot between frames when moved quickly;
  // feeding that straight into the angle math made the liquid lobe's
  // direction snap around instead of following smoothly. Ease the position
  // itself, the same way hover intensity already eases.
  const smoothMouseRef = useRef<[number, number]>([0, 0])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let renderer: Renderer | null = null
    let raf = 0
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let cancelled = false

    const start = performance.now()

    const init = (attempt: number) => {
      if (cancelled) return
      try {
        renderer = createRenderer(canvas, AURA_FRAG)
        onError?.('')
        raf = requestAnimationFrame(frame)
      } catch (err) {
        // Context-loss at mount is transient — retry a few times before giving up.
        if (err instanceof ContextLostError && attempt < 5) {
          retryTimer = setTimeout(() => init(attempt + 1), 120 * (attempt + 1))
          return
        }
        onError?.(err instanceof Error ? err.message : 'Failed to initialize renderer')
      }
    }

    const frame = () => {
      const time = (performance.now() - start) / 1000

      // ease hover
      hoverRef.current += (hoverTargetRef.current - hoverRef.current) * 0.08
      const hover = hoverRef.current
      const [pu, pv] = pointerRef.current

      // aspect-corrected uv space, matching gl_FragCoord math in the shader
      const w = canvas.width
      const h = canvas.height
      const minWH = Math.min(w, h) || 1
      const mx = ((pu - 0.5) * w) / minWH
      const my = ((pv - 0.5) * h) / minWH
      smoothMouseRef.current[0] += (mx - smoothMouseRef.current[0]) * 0.15
      smoothMouseRef.current[1] += (my - smoothMouseRef.current[1]) * 0.15

      const p = auraRef.current
      const uniforms: Uniforms = {
        uTime: time,
        uMouse: smoothMouseRef.current,
        uHover: p.hoverReact ? hover : 0,
        uSize: p.size,
        uWobble: p.wobble,
        uWobbleSpeed: p.wobbleSpeed,
        uBreath: p.breath,
        uBreathSpeed: p.breathSpeed,
        uSoftness: p.softness,
        uGradient: p.gradient,
        uGrain: p.grainOn ? p.grain : 0,
        uGrainSize: p.grainSize,
        uHoverStrength: p.hoverStrength,
        uMidBurn: p.midBurn ? 1 : 0,
        uColCore: hexToRgb(p.colCore),
        uColMid: hexToRgb(p.colMid),
        uColEdge: hexToRgb(p.colEdge),
        uColBg: hexToRgb(p.colBg),
      }

      if (renderer) renderer.render(uniforms)
      raf = requestAnimationFrame(frame)
    }

    // Only initialize once the canvas has a real layout size. Initializing
    // against a 0/1px drawing buffer makes some drivers drop the context.
    let started = false
    const maybeStart = () => {
      if (started || cancelled) return
      if (canvas.clientWidth > 0 && canvas.clientHeight > 0) {
        started = true
        init(0)
        return true
      }
      return false
    }

    const ro = new ResizeObserver(() => maybeStart())
    ro.observe(canvas)
    // Try immediately in case layout is already resolved.
    maybeStart()

    return () => {
      cancelled = true
      ro.disconnect()
      cancelAnimationFrame(raf)
      if (retryTimer) clearTimeout(retryTimer)
      renderer?.destroy()
    }
    // Mount once — there's only one shader program now, nothing to recreate for.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updatePointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const u = (e.clientX - rect.left) / rect.width
    // flip Y so it matches gl_FragCoord (bottom-left origin)
    const v = 1 - (e.clientY - rect.top) / rect.height
    pointerRef.current = [u, v]
  }

  return (
    <div
      className="relative h-full w-full"
      onPointerEnter={() => (hoverTargetRef.current = 1)}
      onPointerLeave={() => (hoverTargetRef.current = 0)}
      onPointerMove={updatePointer}
    >
      <canvas ref={canvasRef} className="h-full w-full" aria-label="Generative brand mark preview" />
    </div>
  )
}
