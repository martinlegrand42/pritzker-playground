'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/', label: 'Aura' },
  { href: '/shape', label: 'Shape Studio' },
]

export function StudioNav() {
  const pathname = usePathname()
  return (
    <nav className="flex items-center gap-1 rounded-full border border-border bg-secondary/60 p-1">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            'rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors',
            pathname === tab.href
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
