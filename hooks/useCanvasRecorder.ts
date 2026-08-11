"use client";

import { useCallback, useRef, useState } from "react";

function pickMimeType() {
  const candidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "";
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Records a fixed-length loop from a live canvas and downloads it as a .webm file. */
export function useCanvasRecorder(getCanvas: () => HTMLCanvasElement | null) {
  const [isRecording, setIsRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = useCallback(
    (durationMs: number, filename: string) => {
      const canvas = getCanvas();
      if (!canvas || isRecording) return;

      const stream = canvas.captureStream(30);
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        setIsRecording(false);
        setProgress(0);
        download(new Blob(chunks, { type: mimeType || "video/webm" }), filename);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorderRef.current = recorder;
      setIsRecording(true);
      recorder.start();

      const start = performance.now();
      const tick = () => {
        const elapsed = performance.now() - start;
        setProgress(Math.min(1, elapsed / durationMs));
        if (elapsed < durationMs) {
          requestAnimationFrame(tick);
        } else if (recorderRef.current?.state === "recording") {
          recorderRef.current.stop();
        }
      };
      requestAnimationFrame(tick);
    },
    [getCanvas, isRecording],
  );

  return { isRecording, progress, startRecording };
}

export function exportCanvasPng(canvas: HTMLCanvasElement | null, filename: string) {
  if (!canvas) return;
  canvas.toBlob((blob) => {
    if (blob) download(blob, filename);
  }, "image/png");
}
