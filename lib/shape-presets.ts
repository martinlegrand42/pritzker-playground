export interface ShapeParams {
  widthPx: number
  heightPx: number
  bgColor: string
  shapeColor: string
  radiusPx: number
  bordered: boolean
  borderWidthPx: number
  hoverIntensity: number
}

export const SHAPE_LIMITS = {
  widthPx: { min: 64, max: 1600 },
  heightPx: { min: 64, max: 1600 },
  radiusPx: { min: 0, max: 400 },
  borderWidthPx: { min: 1, max: 120 },
} as const

export const SHAPE_DEFAULT: ShapeParams = {
  widthPx: 480,
  heightPx: 480,
  bgColor: '#f4f3ef',
  shapeColor: '#19188a',
  radiusPx: 48,
  bordered: false,
  borderWidthPx: 10,
  hoverIntensity: 0.6,
}
