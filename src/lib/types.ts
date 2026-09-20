export type StitchStyle = 'real' | 'cruz' | 'saten' | 'relleno' | 'contorno'
export type FabricKind = 'aida' | 'lino'
export type PathKind = 'cross' | 'satin' | 'fill' | 'outline' | 'underlay'

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
  density: number
  fillAngle: number
  maxStitchMm: number
  underlay: boolean
  fabric: FabricKind
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
  kind?: PathKind
}

export const DEFAULT_SETTINGS: Settings = {
  gridWidth: 80,
  colorCount: 12,
  style: 'real',
  ignoreLightBackground: true,
  backgroundThreshold: 0.86,
  brightness: 0,
  contrast: 8,
  aidaCount: 14,
  density: 1,
  fillAngle: 32,
  maxStitchMm: 5.5,
  underlay: true,
  fabric: 'aida',
}
