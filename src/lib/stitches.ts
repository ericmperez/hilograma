import { digitizePattern } from './digitize'
import type { EmbroideryPattern, Settings, StitchStyle, ThreadPath } from './types'

export function buildThreadPaths(
  pattern: EmbroideryPattern,
  styleOrSettings: StitchStyle | Settings,
): ThreadPath[] {
  if (typeof styleOrSettings === 'string') {
    return digitizePattern(pattern, {
      gridWidth: pattern.width,
      colorCount: pattern.palette.length,
      style: styleOrSettings,
      ignoreLightBackground: true,
      backgroundThreshold: 0.86,
      brightness: 0,
      contrast: 0,
      aidaCount: 14,
      density: 1,
      fillAngle: 32,
      maxStitchMm: 5.5,
      underlay: styleOrSettings === 'real' || styleOrSettings === 'saten' || styleOrSettings === 'relleno',
      fabric: 'aida',
    })
  }
  return digitizePattern(pattern, styleOrSettings)
}

export function stitchCount(paths: ThreadPath[]) {
  return paths.reduce((sum, path) => {
    if (path.kind === 'underlay') return sum
    return sum + Math.max(0, path.points.length - 1)
  }, 0)
}

export function visiblePaths(paths: ThreadPath[], includeUnderlay = false) {
  return includeUnderlay ? paths : paths.filter((path) => path.kind !== 'underlay')
}
