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
  zoom: number
}

export const SHAPE_LIMITS = {
  widthPx: { min: 64, max: 1600 },
  heightPx: { min: 64, max: 1600 },
  radiusPx: { min: 0, max: 400 },
  borderWidthPx: { min: 1, max: 120 },
  zoom: { min: 0.35, max: 1 },
} as const

export const SHAPE_DEFAULT: ShapeParams = {
  shapeType: 'rectangle',
  widthPx: 480,
  heightPx: 480,
  bgColor: '#f4f3ef',
  shapeColor: '#19188a',
  radiusPx: 48,
  bordered: false,
  borderWidthPx: 10,
  hoverIntensity: 0.6,
  zoom: 1,
}
