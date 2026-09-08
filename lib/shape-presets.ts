export type ShapeType = 'rectangle' | 'square' | 'circle'

export interface ShapeParams {
  shapeType: ShapeType
  widthPx: number
  heightPx: number
  bgColor: string
  shapeColor: string
  radiusPx: number
  bordered: boolean
  borderWidthPx: number
  hoverIntensity: number
  hoverColor: string
  hoverColorAmount: number
  centerBlurReduction: number
  zoom: number
}

export const SHAPE_LIMITS = {
  radiusPx: { min: 0, max: 400 },
  borderWidthPx: { min: 1, max: 120 },
  zoom: { min: 0.35, max: 1 },
} as const

// Fixed frame dimensions per shape type — there's no px input for these
// anymore, so switching type snaps to a sensible size for that type
// (a landscape rectangle vs. a 1:1 square/circle) rather than leaving
// whatever the previous type happened to be sized at.
export const SHAPE_TYPE_SIZE: Record<ShapeType, { widthPx: number; heightPx: number }> = {
  rectangle: { widthPx: 600, heightPx: 400 },
  square: { widthPx: 480, heightPx: 480 },
  circle: { widthPx: 480, heightPx: 480 },
}

export const SHAPE_DEFAULT: ShapeParams = {
  shapeType: 'rectangle',
  ...SHAPE_TYPE_SIZE.rectangle,
  bgColor: '#fafaff',
  shapeColor: '#0031a7',
  radiusPx: 48,
  bordered: false,
  borderWidthPx: 10,
  hoverIntensity: 0.6,
  hoverColor: '#327fef',
  hoverColorAmount: 1,
  centerBlurReduction: 0.5,
  zoom: 1,
}
