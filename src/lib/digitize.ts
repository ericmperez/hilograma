import type { EmbroideryPattern, Point, Settings, ThreadPath } from './types'

interface Region {
  colorIndex: number
  cells: Array<[number, number]>
  set: Set<string>
  minX: number
  maxX: number
  minY: number
  maxY: number
}

function key(x: number, y: number) {
  return `${x},${y}`
}

function cellMm(aidaCount: number) {
  return 25.4 / aidaCount
}

function dist(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function pushPath(
  paths: ThreadPath[],
  colorIndex: number,
  points: Point[],
  kind: ThreadPath['kind'],
) {
  if (points.length < 2) return
  paths.push({ colorIndex, points, kind })
}

function splitLongStitches(points: Point[], maxCells: number): Point[] {
  if (points.length < 2) return points
  const out: Point[] = [points[0]]
  for (let i = 1; i < points.length; i++) {
    const a = out[out.length - 1]
    const b = points[i]
    const length = dist(a, b)
    const parts = Math.max(1, Math.ceil(length / maxCells))
    for (let p = 1; p <= parts; p++) {
      const t = p / parts
      out.push({
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
      })
    }
  }
  return out
}

function dropTiny(points: Point[], minCells: number): Point[] {
  if (points.length < 2) return points
  const out: Point[] = [points[0]]
  for (let i = 1; i < points.length; i++) {
    const last = out[out.length - 1]
    if (dist(last, points[i]) >= minCells || i === points.length - 1) {
      if (out.length >= 2 && dist(last, points[i]) < minCells) {
        out[out.length - 1] = points[i]
      } else {
        out.push(points[i])
      }
    }
  }
  return out
}

function finalize(
  points: Point[],
  maxCells: number,
  minCells: number,
): Point[] {
  return dropTiny(splitLongStitches(points, maxCells), minCells)
}

function regionsForColor(pattern: EmbroideryPattern, colorIndex: number): Region[] {
  const seen = new Set<string>()
  const regions: Region[] = []

  for (let y = 0; y < pattern.height; y++) {
    for (let x = 0; x < pattern.width; x++) {
      if (pattern.cells[y][x] !== colorIndex) continue
      const start = key(x, y)
      if (seen.has(start)) continue

      const cells: Array<[number, number]> = []
      const set = new Set<string>()
      const queue: Array<[number, number]> = [[x, y]]
      seen.add(start)
      let minX = x
      let maxX = x
      let minY = y
      let maxY = y

      while (queue.length) {
        const [cx, cy] = queue.pop()!
        cells.push([cx, cy])
        set.add(key(cx, cy))
        minX = Math.min(minX, cx)
        maxX = Math.max(maxX, cx)
        minY = Math.min(minY, cy)
        maxY = Math.max(maxY, cy)
        const next: Array<[number, number]> = [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1],
        ]
        for (const [nx, ny] of next) {
          if (nx < 0 || ny < 0 || nx >= pattern.width || ny >= pattern.height) continue
          if (pattern.cells[ny][nx] !== colorIndex) continue
          const k = key(nx, ny)
          if (seen.has(k)) continue
          seen.add(k)
          queue.push([nx, ny])
        }
      }

      regions.push({ colorIndex, cells, set, minX, maxX, minY, maxY })
    }
  }

  return regions
}

function meanRun(region: Region, axis: 'x' | 'y') {
  const buckets = new Map<number, number>()
  for (const [x, y] of region.cells) {
    const k = axis === 'x' ? y : x
    buckets.set(k, (buckets.get(k) ?? 0) + 1)
  }
  let sum = 0
  for (const n of buckets.values()) sum += n
  return sum / Math.max(1, buckets.size)
}

function chooseSatinAxis(region: Region): 'x' | 'y' {
  const row = meanRun(region, 'x')
  const col = meanRun(region, 'y')
  return row <= col ? 'x' : 'y'
}

function isNarrow(region: Region) {
  const row = meanRun(region, 'x')
  const col = meanRun(region, 'y')
  const thin = Math.min(row, col)
  const long = Math.max(row, col)
  return thin <= 4.6 && long >= 2 && thin / long <= 0.72
}

function lineCellHit(
  origin: Point,
  dir: Point,
  cellX: number,
  cellY: number,
): [number, number] | null {
  let t0 = -Infinity
  let t1 = Infinity
  const bounds = [
    [cellX, cellX + 1, origin.x, dir.x],
    [cellY, cellY + 1, origin.y, dir.y],
  ] as const

  for (const [min, max, o, d] of bounds) {
    if (Math.abs(d) < 1e-8) {
      if (o < min || o > max) return null
      continue
    }
    const ta = (min - o) / d
    const tb = (max - o) / d
    const lo = Math.min(ta, tb)
    const hi = Math.max(ta, tb)
    t0 = Math.max(t0, lo)
    t1 = Math.min(t1, hi)
    if (t0 > t1) return null
  }
  return [t0, t1]
}

function mergeRanges(ranges: Array<[number, number]>) {
  ranges.sort((a, b) => a[0] - b[0])
  const out: Array<[number, number]> = []
  for (const range of ranges) {
    const last = out[out.length - 1]
    if (!last || range[0] > last[1] + 0.08) out.push([...range])
    else last[1] = Math.max(last[1], range[1])
  }
  return out
}

function fillRegion(
  region: Region,
  angleDeg: number,
  spacing: number,
  inset: number,
): Point[][] {
  const angle = (angleDeg * Math.PI) / 180
  const dir = { x: Math.cos(angle), y: Math.sin(angle) }
  const normal = { x: -dir.y, y: dir.x }
  let minP = Infinity
  let maxP = -Infinity

  for (const [x, y] of region.cells) {
    const p = (x + 0.5) * normal.x + (y + 0.5) * normal.y
    minP = Math.min(minP, p)
    maxP = Math.max(maxP, p)
  }

  const buckets = new Map<number, Array<[number, number]>>()
  for (const [x, y] of region.cells) {
    const proj = (x + 0.5) * normal.x + (y + 0.5) * normal.y
    const index = Math.round((proj - minP) / spacing)
    const list = buckets.get(index) ?? []
    list.push([x, y])
    buckets.set(index, list)
  }

  const paths: Point[][] = []
  let flip = false
  let row = 0
  for (let p = minP; p <= maxP + 1e-6; p += spacing, row++) {
    const origin = { x: normal.x * p, y: normal.y * p }
    const nearby = [
      ...(buckets.get(row - 1) ?? []),
      ...(buckets.get(row) ?? []),
      ...(buckets.get(row + 1) ?? []),
    ]
    const hits: Array<[number, number]> = []
    for (const [x, y] of nearby) {
      const hit = lineCellHit(origin, dir, x, y)
      if (hit) hits.push(hit)
    }
    const ranges = mergeRanges(hits)
    for (const [t0, t1] of ranges) {
      if (t1 - t0 < 0.18) continue
      const a = {
        x: origin.x + dir.x * (t0 + inset),
        y: origin.y + dir.y * (t0 + inset),
      }
      const b = {
        x: origin.x + dir.x * (t1 - inset),
        y: origin.y + dir.y * (t1 - inset),
      }
      paths.push(flip ? [b, a] : [a, b])
      flip = !flip
    }
  }
  return paths
}

function satinRegion(region: Region, spacing: number, inset: number): Point[][] {
  const axis = chooseSatinAxis(region)
  const paths: Point[][] = []

  if (axis === 'x') {
    for (let y = region.minY; y <= region.maxY; y++) {
      const columns = region.cells.filter(([, cy]) => cy === y).map(([cx]) => cx)
      if (!columns.length) continue
      columns.sort((a, b) => a - b)
      let start = 0
      while (start < columns.length) {
        let end = start
        while (end + 1 < columns.length && columns[end + 1] === columns[end] + 1) end++
        const rows = Math.max(2, Math.round(1 / spacing))
        for (let r = 0; r < rows; r++) {
          const t = (r + 0.5) / rows
          const yy = y + inset + t * (1 - inset * 2)
          const x0 = columns[start] + inset
          const x1 = columns[end] + 1 - inset
          paths.push(r % 2 === 0 ? [{ x: x0, y: yy }, { x: x1, y: yy }] : [{ x: x1, y: yy }, { x: x0, y: yy }])
        }
        start = end + 1
      }
    }
    return paths
  }

  for (let x = region.minX; x <= region.maxX; x++) {
    const rows = region.cells.filter(([cx]) => cx === x).map(([, cy]) => cy)
    if (!rows.length) continue
    rows.sort((a, b) => a - b)
    let start = 0
    while (start < rows.length) {
      let end = start
      while (end + 1 < rows.length && rows[end + 1] === rows[end] + 1) end++
      const cols = Math.max(2, Math.round(1 / spacing))
      for (let c = 0; c < cols; c++) {
        const t = (c + 0.5) / cols
        const xx = x + inset + t * (1 - inset * 2)
        const y0 = rows[start] + inset
        const y1 = rows[end] + 1 - inset
        paths.push(c % 2 === 0 ? [{ x: xx, y: y0 }, { x: xx, y: y1 }] : [{ x: xx, y: y1 }, { x: xx, y: y0 }])
      }
      start = end + 1
    }
  }
  return paths
}

function outlineRegion(region: Region): Point[][] {
  const edges: Array<[Point, Point, string]> = []
  const used = new Set<string>()

  for (const [x, y] of region.cells) {
    const sides: Array<[number, number, Point, Point]> = [
      [0, -1, { x, y }, { x: x + 1, y }],
      [1, 0, { x: x + 1, y }, { x: x + 1, y: y + 1 }],
      [0, 1, { x: x + 1, y: y + 1 }, { x, y: y + 1 }],
      [-1, 0, { x, y: y + 1 }, { x, y }],
    ]
    for (const [dx, dy, a, b] of sides) {
      if (region.set.has(key(x + dx, y + dy))) continue
      edges.push([a, b, `${a.x},${a.y}->${b.x},${b.y}`])
    }
  }

  const byStart = new Map<string, Array<[Point, Point, string]>>()
  for (const edge of edges) {
    const k = `${edge[0].x},${edge[0].y}`
    const list = byStart.get(k) ?? []
    list.push(edge)
    byStart.set(k, list)
  }

  const paths: Point[][] = []
  for (const edge of edges) {
    if (used.has(edge[2])) continue
    const points: Point[] = [{ ...edge[0] }, { ...edge[1] }]
    used.add(edge[2])
    let cursor = edge[1]
    for (let guard = 0; guard < edges.length + 2; guard++) {
      const options = byStart.get(`${cursor.x},${cursor.y}`) ?? []
      const next = options.find((item) => !used.has(item[2]))
      if (!next) break
      used.add(next[2])
      points.push({ ...next[1] })
      cursor = next[1]
    }
    if (points.length >= 2) paths.push(points)
  }
  return paths
}

function crossRegion(region: Region): Point[][] {
  const byRow = new Map<number, number[]>()
  for (const [x, y] of region.cells) {
    const row = byRow.get(y) ?? []
    row.push(x)
    byRow.set(y, row)
  }

  const bottoms: Point[][] = []
  const tops: Point[][] = []
  const rows = [...byRow.keys()].sort((a, b) => a - b)

  for (const y of rows) {
    const xs = (byRow.get(y) ?? []).sort((a, b) => a - b)
    let start = 0
    while (start < xs.length) {
      let end = start
      while (end + 1 < xs.length && xs[end + 1] === xs[end] + 1) end++
      const bottom: Point[] = []
      const top: Point[] = []
      for (let i = start; i <= end; i++) {
        const x = xs[i]
        bottom.push({ x: x + 0.18, y: y + 0.18 }, { x: x + 0.82, y: y + 0.82 })
      }
      for (let i = end; i >= start; i--) {
        const x = xs[i]
        top.push({ x: x + 0.82, y: y + 0.18 }, { x: x + 0.18, y: y + 0.82 })
      }
      bottoms.push(bottom)
      tops.push(top)
      start = end + 1
    }
  }

  return [...bottoms, ...tops]
}

function addSegments(
  paths: ThreadPath[],
  colorIndex: number,
  segments: Point[][],
  kind: ThreadPath['kind'],
  maxCells: number,
  minCells: number,
) {
  for (const segment of segments) {
    pushPath(paths, colorIndex, finalize(segment, maxCells, minCells), kind)
  }
}

export function digitizePattern(pattern: EmbroideryPattern, settings: Settings): ThreadPath[] {
  const mm = cellMm(settings.aidaCount)
  const maxCells = Math.max(1.1, settings.maxStitchMm / mm)
  const minCells = Math.max(0.12, 0.35 / mm)
  const spacing = Math.max(0.14, 0.38 / (mm * Math.max(0.55, settings.density)))
  const paths: ThreadPath[] = []

  for (let colorIndex = 0; colorIndex < pattern.palette.length; colorIndex++) {
    const regions = regionsForColor(pattern, colorIndex).sort(
      (a, b) => b.cells.length - a.cells.length,
    )

    for (const region of regions) {
      const useSatin =
        settings.style === 'saten' || (settings.style === 'real' && isNarrow(region))
      const useFill =
        settings.style === 'relleno' || (settings.style === 'real' && !useSatin)
      const useCross = settings.style === 'cruz'
      const useOutline = settings.style === 'contorno' || settings.style === 'real'

      if (useCross) {
        addSegments(paths, colorIndex, crossRegion(region), 'cross', maxCells, minCells)
        continue
      }

      if (useSatin) {
        if (settings.underlay) {
          addSegments(
            paths,
            colorIndex,
            fillRegion(region, settings.fillAngle + 90, spacing * 2.4, 0.28),
            'underlay',
            maxCells,
            minCells,
          )
        }
        addSegments(paths, colorIndex, satinRegion(region, spacing, 0.12), 'satin', maxCells, 0.08)
      } else if (useFill) {
        if (settings.underlay) {
          addSegments(
            paths,
            colorIndex,
            fillRegion(region, settings.fillAngle + 90, spacing * 2.2, 0.22),
            'underlay',
            maxCells,
            minCells,
          )
        }
        addSegments(
          paths,
          colorIndex,
          fillRegion(region, settings.fillAngle, spacing, 0.1),
          'fill',
          maxCells,
          minCells,
        )
      }

      if (useOutline) {
        addSegments(paths, colorIndex, outlineRegion(region), 'outline', maxCells, 0.08)
      }
    }
  }

  return paths
}

export function stitchLengthMm(paths: ThreadPath[], aidaCount: number) {
  const mm = cellMm(aidaCount)
  let length = 0
  for (const path of paths) {
    for (let i = 1; i < path.points.length; i++) {
      length += dist(path.points[i - 1], path.points[i]) * mm
    }
  }
  return length
}

export function machineWarnings(paths: ThreadPath[], settings: Settings) {
  const mm = cellMm(settings.aidaCount)
  const notes: string[] = []
  let longSatin = 0
  for (const path of paths) {
    if (path.kind !== 'satin') continue
    for (let i = 1; i < path.points.length; i++) {
      const len = dist(path.points[i - 1], path.points[i]) * mm
      if (len > 10) longSatin += 1
    }
  }
  if (longSatin > 0) {
    notes.push(`${longSatin} puntadas satén de más de 10 mm: baja el ancho o usa relleno.`)
  }
  if (settings.gridWidth > 120 && settings.density > 1.2) {
    notes.push('Densidad alta en una grilla grande: el DST puede tardar mucho en máquina.')
  }
  return notes
}
