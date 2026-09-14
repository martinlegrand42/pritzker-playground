function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

// mp4 (H.264) is required — webm is only ever used as an absolute last
// resort (see `allowWebm` below), not swapped in automatically just
// because a given resolution doesn't fit. Within mp4 itself, try a couple
// of codec-string variants since a bare "avc1"/"h264" is sometimes
// accepted where the other isn't.
const MP4_CANDIDATES = ['video/mp4;codecs=avc1', 'video/mp4;codecs=h264', 'video/mp4']
const WEBM_CANDIDATES = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']

function supportedMimeTypes(allowWebm: boolean) {
  const pool = allowWebm ? [...MP4_CANDIDATES, ...WEBM_CANDIDATES] : MP4_CANDIDATES
  return pool.filter((candidate) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(candidate))
}

function extForMimeType(mimeType: string) {
  return mimeType.startsWith('video/mp4') ? 'mp4' : 'webm'
}

// The requested canvas resolution isn't necessarily what actually ends up
// in the file — some hardware encoders silently clamp to whatever they
// support instead of erroring out. Read the real dimensions back from the
// encoded video itself rather than trusting what we asked for.
function readVideoDimensions(blob: Blob): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    const url = URL.createObjectURL(blob)
    video.src = url
    const finish = (result: { width: number; height: number } | null) => {
      URL.revokeObjectURL(url)
      resolve(result)
    }
    video.onloadedmetadata = () => finish({ width: video.videoWidth, height: video.videoHeight })
    video.onerror = () => finish(null)
  })
}

export function exportPng(canvas: HTMLCanvasElement, filenameBase: string) {
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    triggerDownload(url, `${filenameBase}.png`)
    URL.revokeObjectURL(url)
  }, 'image/png')
}

export function downloadVideo(url: string, filenameBase: string, mimeType: string) {
  triggerDownload(url, `${filenameBase}.${extForMimeType(mimeType)}`)
  URL.revokeObjectURL(url)
}

/**
 * Records `durationMs` of the canvas as mp4 (H.264), trying a couple of
 * codec-string variants before giving up on that. Only when `allowWebm` is
 * true does it also try webm (VP9/VP8) as an absolute last resort — mp4 is
 * a hard requirement otherwise, even if that means this resolution doesn't
 * work at all and the caller needs to retry smaller. `onDone` receives a
 * blob URL to download, the mime type actually recorded, and the video's
 * real dimensions as decoded back from the file itself (not just the
 * canvas size we requested, since some encoders silently clamp resolution
 * rather than erroring) — or null/'' plus a `reason` describing exactly
 * what went wrong if nothing worked.
 */
export function recordLoop(
  canvas: HTMLCanvasElement,
  durationMs: number,
  onProgress: (t: number) => void,
  onDone: (url: string | null, mimeType: string, reason?: string, actualSize?: { width: number; height: number }) => void,
  allowWebm = false,
): { stop: () => void } {
  if (typeof MediaRecorder === 'undefined') {
    onDone(null, '', 'MediaRecorder is not available in this browser')
    return { stop: () => {} }
  }
  if (typeof canvas.captureStream !== 'function') {
    onDone(null, '', 'canvas.captureStream is not available in this browser')
    return { stop: () => {} }
  }

  const stream = canvas.captureStream(30)
  const candidates = supportedMimeTypes(allowWebm)

  let stopped = false
  let externallyStopped = false
  let raf = 0
  let activeRecorder: MediaRecorder | null = null
  let lastReason: string | undefined

  const tryCandidate = (index: number) => {
    if (externallyStopped) return
    if (index >= candidates.length) {
      stream.getTracks().forEach((track) => track.stop())
      onDone(null, '', lastReason || 'No supported video encoder configuration succeeded')
      return
    }

    const mimeType = candidates[index]
    let recorder: MediaRecorder
    try {
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    } catch (err) {
      lastReason = `MediaRecorder failed to start (${mimeType || 'default'}): ${err instanceof Error ? err.message : String(err)}`
      tryCandidate(index + 1)
      return
    }

    const chunks: BlobPart[] = []
    let recorderError: string | undefined

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }
    recorder.onerror = (e) => {
      const error = (e as { error?: unknown }).error
      recorderError = `MediaRecorder error (${mimeType || 'default'}): ${error instanceof Error ? error.message : String(error)}`
    }
    recorder.onstop = () => {
      if (chunks.length === 0) {
        lastReason = recorderError || `Recording produced no video data (${mimeType || 'default'})`
        // This candidate didn't actually work — try the next one at the
        // same resolution rather than giving up or shrinking the recording.
        tryCandidate(index + 1)
        return
      }
      stream.getTracks().forEach((track) => track.stop())
      const blobType = mimeType || 'video/webm'
      const blob = new Blob(chunks, { type: blobType })
      readVideoDimensions(blob).then((actualSize) => {
        onDone(URL.createObjectURL(blob), blobType, undefined, actualSize || undefined)
      })
    }

    activeRecorder = recorder
    recorder.start()
    const start = performance.now()

    const tick = () => {
      const elapsed = performance.now() - start
      onProgress(Math.min(1, elapsed / durationMs))
      if (stopped) return
      if (elapsed < durationMs) {
        raf = requestAnimationFrame(tick)
      } else if (recorder.state === 'recording') {
        recorder.stop()
      }
    }
    raf = requestAnimationFrame(tick)
  }

  tryCandidate(0)

  return {
    stop: () => {
      if (stopped) return
      stopped = true
      externallyStopped = true
      cancelAnimationFrame(raf)
      if (activeRecorder && (activeRecorder as MediaRecorder).state === 'recording') {
        ;(activeRecorder as MediaRecorder).stop()
      }
    },
  }
}
