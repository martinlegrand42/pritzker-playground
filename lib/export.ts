function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

function pickMimeType() {
  // Prefer mp4 (H.264) since that's what people actually want to share/edit
  // with; fall back to webm on browsers that can't record mp4 directly.
  const candidates = [
    'video/mp4;codecs=avc1',
    'video/mp4;codecs=h264',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ]
  for (const candidate of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(candidate)) {
      return candidate
    }
  }
  return ''
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
 * Records `durationMs` of the canvas as an mp4 clip (falling back to webm on
 * browsers that can't record mp4 directly). `onDone` receives a blob URL to
 * download plus the mime type actually recorded, or null/'' plus a `reason`
 * describing exactly what went wrong if recording isn't supported/produced
 * nothing.
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
  const mimeType = pickMimeType()
  let recorder: MediaRecorder
  try {
    recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
  } catch (err) {
    stream.getTracks().forEach((track) => track.stop())
    onDone(null, '', `MediaRecorder failed to start: ${err instanceof Error ? err.message : String(err)}`)
    return { stop: () => {} }
  }

  const chunks: BlobPart[] = []
  let stopped = false
  let raf = 0
  let recorderError: string | undefined

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }
  recorder.onerror = (e) => {
    const error = (e as { error?: unknown }).error
    recorderError = `MediaRecorder error: ${error instanceof Error ? error.message : String(error)}`
  }
  recorder.onstop = () => {
    stream.getTracks().forEach((track) => track.stop())
    if (chunks.length === 0) {
      onDone(null, '', recorderError || 'Recording produced no video data')
      return
    }
    const blobType = mimeType || 'video/webm'
    onDone(URL.createObjectURL(new Blob(chunks, { type: blobType })), blobType)
  }

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

  return {
    stop: () => {
      if (stopped) return
      stopped = true
      cancelAnimationFrame(raf)
      if (recorder.state === 'recording') recorder.stop()
    },
  }
}
