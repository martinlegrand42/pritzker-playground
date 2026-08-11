export type EngineKind = 'aura' | 'field'

export interface AuraParams {
  size: number
  softness: number
  wobble: number
  wobbleSpeed: number
  breath: number
  breathSpeed: number
  gradient: number
  grain: number
  hoverReact: boolean
  colCore: string
  colMid: string
  colEdge: string
  colBg: string
}

export interface FieldParams {
  scale: number
  warp: number
  contrast: number
  speed: number
  bands: number
  grain: number
  hoverReact: boolean
  col0: string
  col1: string
  col2: string
  col3: string
}

interface AuraPalette {
  name: string
  colCore: string
  colMid: string
  colEdge: string
  colBg: string
}

interface FieldPalette {
  name: string
  col0: string
  col1: string
  col2: string
  col3: string
}

// Four brand palettes, shared across both engines: a light core/high value
// down to a near-black rim/background, so "Aura"'s center-out mix and
// "Field"'s low-to-high value map read as the same identity either way.
export const AURA_PALETTES: AuraPalette[] = [
  { name: 'Pritzker Blue', colCore: '#e4ecff', colMid: '#6f95ff', colEdge: '#1c2b7a', colBg: '#04050d' },
  { name: 'Ember', colCore: '#ffe9c2', colMid: '#ff9d3d', colEdge: '#7a2600', colBg: '#0d0300' },
  { name: 'Verdant', colCore: '#e6fff2', colMid: '#5fe0a0', colEdge: '#0d4a2e', colBg: '#020a06' },
  { name: 'Orchid', colCore: '#fbe6ff', colMid: '#c060e0', colEdge: '#4a1060', colBg: '#0a020c' },
]

export const FIELD_PALETTES: FieldPalette[] = [
  { name: 'Pritzker Blue', col0: '#04050d', col1: '#1c2b7a', col2: '#6f95ff', col3: '#e4ecff' },
  { name: 'Ember', col0: '#0d0300', col1: '#7a2600', col2: '#ff9d3d', col3: '#ffe9c2' },
  { name: 'Verdant', col0: '#020a06', col1: '#0d4a2e', col2: '#5fe0a0', col3: '#e6fff2' },
  { name: 'Orchid', col0: '#0a020c', col1: '#4a1060', col2: '#c060e0', col3: '#fbe6ff' },
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
  hoverReact: true,
  ...AURA_PALETTES[0],
}

export const FIELD_DEFAULT: FieldParams = {
  scale: 2.2,
  warp: 1.4,
  contrast: 1.2,
  speed: 0.08,
  bands: 0,
  grain: 0.05,
  hoverReact: true,
  ...FIELD_PALETTES[0],
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
  }
}

export function randomizeField(current: FieldParams): FieldParams {
  const palette = randPalette(FIELD_PALETTES)
  return {
    ...current,
    ...palette,
    scale: rand(1.3, 4),
    warp: rand(0.4, 2.6),
    contrast: rand(0.8, 2),
    speed: rand(0.02, 0.28),
    bands: Math.random() < 0.35 ? Math.round(rand(3, 14)) : 0,
    grain: rand(0, 0.1),
  }
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  return [r, g, b]
}
