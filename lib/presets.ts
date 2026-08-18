export interface AuraParams {
  size: number
  softness: number
  wobble: number
  wobbleSpeed: number
  breath: number
  breathSpeed: number
  gradient: number
  grain: number
  grainSize: number
  hoverReact: boolean
  hoverStrength: number
  midBurn: boolean
  colCore: string
  colMid: string
  colEdge: string
  colBg: string
}

interface AuraPalette {
  name: string
  colCore: string
  colMid: string
  colEdge: string
  colBg: string
}

// Four brand palettes for Aura's center-out mix.
export const AURA_PALETTES: AuraPalette[] = [
  { name: 'Pritzker Blue', colCore: '#e4ecff', colMid: '#6f95ff', colEdge: '#1c2b7a', colBg: '#04050d' },
  { name: 'Ember', colCore: '#ffe9c2', colMid: '#ff9d3d', colEdge: '#7a2600', colBg: '#0d0300' },
  { name: 'Verdant', colCore: '#e6fff2', colMid: '#5fe0a0', colEdge: '#0d4a2e', colBg: '#020a06' },
  { name: 'Orchid', colCore: '#fbe6ff', colMid: '#c060e0', colEdge: '#4a1060', colBg: '#0a020c' },
]

export const AURA_DEFAULT: AuraParams = {
  size: 0.34,
  softness: 0.35,
  wobble: 0.05,
  wobbleSpeed: 0.4,
  breath: 0.08,
  breathSpeed: 0.5,
  gradient: 0.6,
  grain: 0.06,
  grainSize: 2.2,
  hoverReact: true,
  hoverStrength: 0.3,
  midBurn: true,
  ...AURA_PALETTES[0],
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function randPalette<T>(palettes: T[]): T {
  return palettes[Math.floor(Math.random() * palettes.length)]
}

export function randomizeAura(current: AuraParams): AuraParams {
  const palette = randPalette(AURA_PALETTES)
  return {
    ...current,
    ...palette,
    size: rand(0.24, 0.5),
    softness: rand(0.12, 0.7),
    wobble: rand(0.01, 0.14),
    wobbleSpeed: rand(0.15, 1),
    breath: rand(0.02, 0.16),
    breathSpeed: rand(0.2, 1),
    gradient: rand(0.2, 1),
    grain: rand(0, 0.1),
    grainSize: rand(1.4, 4),
    hoverStrength: rand(0.15, 0.6),
  }
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  return [r, g, b]
}
