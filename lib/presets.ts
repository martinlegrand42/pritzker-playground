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
  grainOn: boolean
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

// Six brand palettes for Aura's center-out mix, all sharing the same role
// structure matched to the studio's reference image: colCore is a rich,
// saturated body color (no bright hotspot), colMid is a deeper accent
// burned in as a soft interior band, colEdge is a light tint of the same
// hue for the transitional ring, and colBg is a near-white ground that
// the edge fades into.
export const AURA_PALETTES: AuraPalette[] = [
  { name: 'Pritzker Blue', colCore: '#1c2ad4', colMid: '#121f96', colEdge: '#aac6ff', colBg: '#f4f7fc' },
  { name: 'Ember', colCore: '#d6491c', colMid: '#a83112', colEdge: '#ffcfa3', colBg: '#fdf6f0' },
  { name: 'Verdant', colCore: '#17915a', colMid: '#0f6e42', colEdge: '#b9f0d3', colBg: '#f2fbf6' },
  { name: 'Orchid', colCore: '#9a2bc4', colMid: '#711f92', colEdge: '#edc2ff', colBg: '#faf2fc' },
  { name: 'Slate', colCore: '#445066', colMid: '#2c3547', colEdge: '#cdd6e3', colBg: '#f7f8fa' },
  { name: 'Gold', colCore: '#c98a12', colMid: '#9c6708', colEdge: '#ffe7ad', colBg: '#fdfaf2' },
]

export const AURA_DEFAULT: AuraParams = {
  size: 0.55,
  softness: 0.4,
  wobble: 0.05,
  wobbleSpeed: 0.4,
  breath: 0.08,
  breathSpeed: 0.5,
  gradient: 0.6,
  grain: 0.06,
  grainSize: 2.2,
  grainOn: true,
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
    size: rand(0.3, 0.6),
    softness: rand(0.15, 0.6),
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
