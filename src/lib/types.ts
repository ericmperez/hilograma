export type StitchStyle = 'cruz' | 'saten' | 'relleno' | 'contorno'

export interface DmcColor {
  code: string
  name: string
  hex: string
  r: number
  g: number
  b: number
}

export interface Settings {
  gridWidth: number
  colorCount: number
  style: StitchStyle
  ignoreLightBackground: boolean
  backgroundThreshold: number
  brightness: number
  contrast: number
  aidaCount: number
}

export interface EmbroideryPattern {
  width: number
  height: number
  cells: (number | null)[][]
  palette: DmcColor[]
  counts: number[]
}

export interface Point {
  x: number
  y: number
}

export interface ThreadPath {
  colorIndex: number
  points: Point[]
}

export const DEFAULT_SETTINGS: Settings = {
  gridWidth: 72,
  colorCount: 10,
  style: 'cruz',
  ignoreLightBackground: true,
  backgroundThreshold: 0.86,
  brightness: 0,
  contrast: 8,
  aidaCount: 14,
}
