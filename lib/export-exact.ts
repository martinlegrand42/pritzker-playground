import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from '@ffmpeg/util'
import { createRenderer } from './shader-runtime'
import { AURA_FRAG } from './shaders'
import { hexToRgb, type AuraParams } from './presets'

// Loaded once and reused across exports, so only the first export in a
// session pays for the ~32MB WASM download.
let ffmpegPromise: Promise<FFmpeg> | null = null

function loadFFmpeg(assetBaseUrl: string): Promise<FFmpeg> {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const ffmpeg = new FFmpeg()
      const coreURL = await toBlobURL(`${assetBaseUrl}/ffmpeg/ffmpeg-core.js`, 'text/javascript')
      const wasmURL = await toBlobURL(`${assetBaseUrl}/ffmpeg/ffmpeg-core.wasm`, 'application/wasm')
      await ffmpeg.load({ coreURL, wasmURL })
      return ffmpeg
    })()
  }
  return ffmpegPromise
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

    for (let i = 0; i < frameCount; i++) {
      await ffmpeg.deleteFile(frameName(i)).catch(() => {})
    }
    await ffmpeg.deleteFile('out.mp4').catch(() => {})

    return { url: URL.createObjectURL(mp4Blob), width, height }
  } finally {
    renderer.destroy()
  }
}
