"use client";

import { ActionButton, ControlGroup } from "@/components/ui/Controls";

export function ExportPanel({
  onExportPng,
  onExportLoop,
  isRecording,
  progress,
}: {
  onExportPng: () => void;
  onExportLoop: (durationMs: number) => void;
  isRecording: boolean;
  progress: number;
}) {
  return (
    <ControlGroup label="Export">
      <div className="flex flex-wrap gap-2">
        <ActionButton onClick={onExportPng} disabled={isRecording}>
          PNG still
        </ActionButton>
        <ActionButton
          variant="primary"
          disabled={isRecording}
          onClick={() => onExportLoop(4000)}
        >
          {isRecording ? `Recording ${Math.round(progress * 100)}%` : "4s loop (webm)"}
        </ActionButton>
      </div>
      <p className="text-xs text-zinc-500">
        Loops render at 30fps and download automatically when done.
      </p>
    </ControlGroup>
  );
}
