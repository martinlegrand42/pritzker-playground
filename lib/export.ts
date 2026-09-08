function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

// Prefer mp4 (H.264) since that's what people actually want to share/edit
// with; fall back to webm (VP9/VP8) on browsers that can't record mp4
// directly. H.264 also has hardware-encoder resolution ceilings (its
// "level" system) that VP9/VP8 don't share, so this list matters even when
// mp4 itself is supported — a high resolution can exceed the H.264 level
// the hardware supports while still fitting fine in webm.
const MIME_CANDIDATES = [
  'video/mp4;codecs=avc1',
  'video/mp4;codecs=h264',
  'video/mp4',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
]

function supportedMimeTypes() {
  const supported = MIME_CANDIDATES.filter(
    (candidate) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(candidate),
  )
  // isTypeSupported() doesn't know about a resolution we haven't chosen yet,
  // so even with nothing on the list, let the browser try its own default
  // rather than giving up before even attempting to record.
  return supported.length > 0 ? supported : ['']
}

function extForMimeType(mimeType: string) {
  return mimeType.startsWith('video/mp4') ? 'mp4' : 'webm'
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
 * Records `durationMs` of the canvas, trying mp4 (H.264) first and falling
 * back through webm (VP9/VP8) at the SAME resolution before giving up —
 * a resolution can exceed what H.264's hardware encoder supports while
 * still fitting fine in webm, so the container/codec is what flexes here,
 * not the size of the recording. `onDone` receives a blob URL to download
 * plus the mime type actually recorded, or null/'' plus a `reason`
 * describing exactly what went wrong if nothing worked.
 */
export function recordLoop(
  canvas: HTMLCanvasElement,
  durationMs: number,
  onProgress: (t: number) => void,
  onDone: (url: string | null, mimeType: string, reason?: string) => void,
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
  const candidates = supportedMimeTypes()

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
      onDone(URL.createObjectURL(new Blob(chunks, { type: blobType })), blobType)
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
