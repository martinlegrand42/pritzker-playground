'use client'

import { cn } from '@/lib/utils'

export type StudioVersion = 'v1' | 'v2'

interface VersionToggleProps {
  version: StudioVersion
  onChange: (version: StudioVersion) => void
}

export function VersionToggle({ version, onChange }: VersionToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-secondary/60 p-1">
      {(['v1', 'v2'] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            'rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors',
            version === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {v === 'v1' ? 'Version 1' : 'Version 2'}
        </button>
      ))}
    </div>
  )
}
