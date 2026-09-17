import type { EmbroideryPattern, Point, StitchStyle, ThreadPath } from './types'

function runsForColor(pattern: EmbroideryPattern, colorIndex: number) {
  const runs: { y: number; x0: number; x1: number }[] = []
  for (let y = 0; y < pattern.height; y++) {
    let x = 0
    while (x < pattern.width) {
      while (x < pattern.width && pattern.cells[y][x] !== colorIndex) x++
      if (x >= pattern.width) break
      const x0 = x
      while (x < pattern.width && pattern.cells[y][x] === colorIndex) x++
      runs.push({ y, x0, x1: x })
    }
  }
  return runs
}

function cruzPaths(pattern: EmbroideryPattern): ThreadPath[] {
  const paths: ThreadPath[] = []
  for (let colorIndex = 0; colorIndex < pattern.palette.length; colorIndex++) {
    for (let y = 0; y < pattern.height; y++) {
      for (let x = 0; x < pattern.width; x++) {
        if (pattern.cells[y][x] !== colorIndex) continue
        paths.push({
          colorIndex,
          points: [
            { x: x + 0.16, y: y + 0.16 },
            { x: x + 0.84, y: y + 0.84 },
          ],
        })
        paths.push({
          colorIndex,
          points: [
            { x: x + 0.84, y: y + 0.16 },
            { x: x + 0.16, y: y + 0.84 },
          ],
        })
      }
    }
  }
  return paths
}

function satenPaths(pattern: EmbroideryPattern): ThreadPath[] {
  const paths: ThreadPath[] = []
  for (let colorIndex = 0; colorIndex < pattern.palette.length; colorIndex++) {
    for (const run of runsForColor(pattern, colorIndex)) {
      const points: Point[] = []
      const steps = Math.max(3, Math.round((run.x1 - run.x0) * 2.4))
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const left = i % 2 === 0
        points.push({
          x: left ? run.x0 + 0.08 : run.x1 - 0.08,
          y: run.y + 0.12 + t * 0.76,
        })
      }
      paths.push({ colorIndex, points })
    }
  }
  return paths
}

function rellenoPaths(pattern: EmbroideryPattern): ThreadPath[] {
  const paths: ThreadPath[] = []
  for (let colorIndex = 0; colorIndex < pattern.palette.length; colorIndex++) {
    for (const run of runsForColor(pattern, colorIndex)) {
      const rows = 3
      for (let r = 0; r < rows; r++) {
        const y = run.y + 0.2 + (r * 0.6) / (rows - 1)
        const offset = r % 2 === 0 ? 0 : 0.18
        const forward = r % 2 === 0
        const x0 = run.x0 + 0.08 + offset
        const x1 = run.x1 - 0.08
        paths.push({
          colorIndex,
          points: forward
            ? [
                { x: x0, y },
                { x: x1, y },
              ]
            : [
                { x: x1, y },
                { x: x0, y },
              ],
        })
      }
    }
  }
  return paths
}

function isColor(pattern: EmbroideryPattern, x: number, y: number, colorIndex: number) {
  if (x < 0 || y < 0 || x >= pattern.width || y >= pattern.height) return false
  return pattern.cells[y][x] === colorIndex
}

function contornoPaths(pattern: EmbroideryPattern): ThreadPath[] {
  const paths: ThreadPath[] = []
  for (let colorIndex = 0; colorIndex < pattern.palette.length; colorIndex++) {
    for (let y = 0; y < pattern.height; y++) {
      for (let x = 0; x < pattern.width; x++) {
        if (pattern.cells[y][x] !== colorIndex) continue
        const neighbors = [
          [0, -1],
          [1, 0],
          [0, 1],
          [-1, 0],
        ]
        for (const [dx, dy] of neighbors) {
          if (isColor(pattern, x + dx, y + dy, colorIndex)) continue
          if (dx === 0 && dy === -1) {
            paths.push({
              colorIndex,
              points: [
                { x, y },
                { x: x + 1, y },
              ],
            })
          } else if (dx === 1 && dy === 0) {
            paths.push({
              colorIndex,
              points: [
                { x: x + 1, y },
                { x: x + 1, y: y + 1 },
              ],
            })
          } else if (dx === 0 && dy === 1) {
            paths.push({
              colorIndex,
              points: [
                { x: x + 1, y: y + 1 },
                { x, y: y + 1 },
              ],
            })
          } else {
            paths.push({
              colorIndex,
              points: [
                { x, y: y + 1 },
                { x, y },
              ],
            })
          }
        }
      }
    }
  }
  return paths
}

export function buildThreadPaths(
  pattern: EmbroideryPattern,
  style: StitchStyle,
): ThreadPath[] {
  switch (style) {
    case 'saten':
      return satenPaths(pattern)
    case 'relleno':
      return rellenoPaths(pattern)
    case 'contorno':
      return contornoPaths(pattern)
    default:
      return cruzPaths(pattern)
  }
}

export function stitchCount(paths: ThreadPath[]) {
  return paths.reduce((sum, path) => sum + Math.max(0, path.points.length - 1), 0)
}
