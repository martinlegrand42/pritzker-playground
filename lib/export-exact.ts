import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from '@ffmpeg/util'
import { createRenderer } from './shader-runtime'
import { AURA_FRAG } from './shaders'
import { hexToRgb, type AuraParams } from './presets'

// A fresh FFmpeg instance (and worker) is created and fully torn down for
// every export, rather than reused across exports. WASM linear memory can
// only grow, never shrink, and ffmpeg's virtual filesystem lives in that
// memory — so writing this many large frames repeatedly into one long-lived
// instance keeps growing its heap forever even after deleting the files,
// eventually exhausting the tab's memory and crashing it. Reusing the
// instance was meant to save re-downloading the ~32MB core on every export,
// but the browser's own HTTP cache already does that (this is a plain
// fetch of a same-origin file); the only repeated cost of a fresh instance
// is re-initializing the WASM module, which is fast.
async function loadFFmpeg(assetBaseUrl: string): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg()
  const coreURL = await toBlobURL(`${assetBaseUrl}/ffmpeg/ffmpeg-core.js`, 'text/javascript')
  const wasmURL = await toBlobURL(`${assetBaseUrl}/ffmpeg/ffmpeg-core.wasm`, 'application/wasm')
  try {
    await ffmpeg.load({ coreURL, wasmURL })
  } finally {
    // toBlobURL fetches the ~32MB core fresh into a new Blob every call —
    // the browser's HTTP cache avoids the network cost, but the Blob and its
    // object URL are only freed by an explicit revoke, not by ffmpeg.load()
    // returning. Both are fully consumed by the time load() resolves
    // (imported into the worker and read by the WASM instantiation), so it's
    // safe to release them here rather than leaving them pinned in memory
    // for the life of the tab across repeated exports.
    URL.revokeObjectURL(coreURL)
    URL.revokeObjectURL(wasmURL)
  }
  return ffmpeg
}

export interface ExactExportResult {
  url: string
  width: number
  height: number
}

export class ExportCancelledError extends Error {
  constructor() {
    super('Export cancelled')
    this.name = 'ExportCancelledError'
  }
}

/**
 * Renders `durationMs` of Aura at an EXACT pixel resolution, deterministically
 * frame by frame on a detached offscreen canvas (bypassing the live on-screen
 * animation loop and its cursor/timing state entirely — uTime is simulated
 * per frame, hover is off), then encodes those frames into a real H.264 mp4
 * with a WASM software encoder.
 *
 * This exists because the browser's own hardware video encoder (used by the
 * fast, live `recordLoop` capture path) can have a resolution ceiling well
 * below what's asked for, and silently rejects or clamps beyond it — a
 * software encoder has no such ceiling, at the cost of being dramatically
 * slower and downloading a one-time ~32MB WASM binary.
 */
export async function exportAuraLoopExact(
  aura: AuraParams,
  width: number,
  height: number,
  durationMs: number,
  fps: number,
  assetBaseUrl: string,
  onProgress: (phase: 'loading' | 'rendering' | 'encoding', t: number) => void,
  isCancelled: () => boolean = () => false,
): Promise<ExactExportResult> {
  const ffmpeg = await loadFFmpeg(assetBaseUrl)
  if (isCancelled()) throw new ExportCancelledError()
  onProgress('loading', 1)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const renderer = createRenderer(canvas, AURA_FRAG)

  // Each export creates a brand new WebGL context on a throwaway canvas.
  // Browsers cap how many can exist at once (commonly 8-16) — past that,
  // a new context is silently born lost, rendering nothing but the clear
  // color, which looks exactly like "solid background, no shape". Fail
  // loudly here instead of producing a silently-wrong video.
  if (renderer.gl.isContextLost()) {
    renderer.destroy()
    throw new Error('WebGL context could not be created (possibly too many contexts open — try reloading the page)')
  }

  const frameCount = Math.max(1, Math.round((durationMs / 1000) * fps))
  const frameName = (i: number) => `frame${String(i).padStart(5, '0')}.png`

  try {
    for (let i = 0; i < frameCount; i++) {
      if (isCancelled()) throw new ExportCancelledError()
      renderer.render(
        {
          uTime: i / fps,
          uMouse: [0, 0],
          uHover: 0,
          uSize: aura.size,
          uWobble: aura.wobble,
          uWobbleSpeed: aura.wobbleSpeed,
          uBreath: aura.breath,
          uBreathSpeed: aura.breathSpeed,
          uSoftness: aura.softness,
          uGradient: aura.gradient,
          uGrain: aura.grainOn ? aura.grain : 0,
          uGrainSize: aura.grainSize,
          uHoverStrength: aura.hoverStrength,
          uMidBurn: aura.midBurn ? 1 : 0,
          uColCore: hexToRgb(aura.colCore),
          uColMid: hexToRgb(aura.colMid),
          uColEdge: hexToRgb(aura.colEdge),
          uColBg: hexToRgb(aura.colBg),
        },
        width,
      )
      if (i === 0) {
        const glError = renderer.gl.getError()
        if (glError !== renderer.gl.NO_ERROR) {
          throw new Error(`WebGL error while rendering (code ${glError}) — try reloading the page`)
        }
      }
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('canvas.toBlob failed'))), 'image/png')
      })
      await ffmpeg.writeFile(frameName(i), new Uint8Array(await blob.arrayBuffer()))
      onProgress('rendering', (i + 1) / frameCount)
    }

    onProgress('encoding', 0)
    await ffmpeg.exec([
      '-framerate',
      String(fps),
      '-i',
      'frame%05d.png',
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      'out.mp4',
    ])
    onProgress('encoding', 1)

    const data = await ffmpeg.readFile('out.mp4')
    // ffmpeg.wasm's FileData can be backed by a SharedArrayBuffer, which
    // Blob's constructor type doesn't accept — copy into a plain,
    // definitely-non-shared Uint8Array first.
    const mp4Blob = new Blob([new Uint8Array(data as Uint8Array)], { type: 'video/mp4' })

    return { url: URL.createObjectURL(mp4Blob), width, height }
  } finally {
    renderer.destroy()
    // Explicitly force this throwaway context to release its GPU resources
    // now rather than whenever GC gets to it — repeated exports in one
    // session would otherwise pile up contexts toward the browser's limit
    // (commonly 8-16), after which new ones are silently born lost.
    renderer.gl.getExtension('WEBGL_lose_context')?.loseContext()
    // Tear the whole ffmpeg worker/WASM instance down rather than just
    // deleting its virtual-FS files — WASM memory only grows, so deleting
    // files doesn't actually reclaim the heap they were written into.
    ffmpeg.terminate()
  }
}
