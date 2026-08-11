function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

function pickMimeType() {
  const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
  for (const candidate of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(candidate)) {
      return candidate
    }
  }
  return ''
}

export function exportPng(canvas: HTMLCanvasElement, filenameBase: string) {
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    triggerDownload(url, `${filenameBase}.png`)
    URL.revokeObjectURL(url)
  }, 'image/png')
}

export function downloadVideo(url: string, filenameBase: string) {
  triggerDownload(url, `${filenameBase}.webm`)
  URL.revokeObjectURL(url)
}

/**
 * Records `durationMs` of the canvas as a webm clip. `onDone` receives a
 * blob URL to download, or null if recording isn't supported/produced
 * nothing (e.g. captureStream/MediaRecorder missing, or stopped too early).
 */
export function recordLoop(
  canvas: HTMLCanvasElement,
  durationMs: number,
  onProgress: (t: number) => void,
  onDone: (url: string | null) => void,
): { stop: () => void } {
  if (typeof MediaRecorder === 'undefined' || typeof canvas.captureStream !== 'function') {
    onDone(null)
    return { stop: () => {} }
  }

  const stream = canvas.captureStream(30)
  const mimeType = pickMimeType()
  let recorder: MediaRecorder
  try {
    recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
  } catch {
    stream.getTracks().forEach((track) => track.stop())
    onDone(null)
    return { stop: () => {} }
  }

  const chunks: BlobPart[] = []
  let stopped = false
  let raf = 0

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }
  recorder.onstop = () => {
    stream.getTracks().forEach((track) => track.stop())
    if (chunks.length === 0) {
      onDone(null)
      return
    }
    onDone(URL.createObjectURL(new Blob(chunks, { type: mimeType || 'video/webm' })))
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
