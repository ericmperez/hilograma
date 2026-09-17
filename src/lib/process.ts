import { applyTone, luminance, rgbToLab, saturation, type Lab } from './color'
import { nearestUnusedDmc } from './dmc'
import type { DmcColor, EmbroideryPattern, Settings } from './types'

interface SampledCell {
  r: number
  g: number
  b: number
  empty: boolean
}

function fitGrid(width: number, height: number, gridWidth: number) {
  const longSide = Math.max(width, height)
  const scale = gridWidth / longSide
  return {
    width: Math.max(8, Math.round(width * scale)),
    height: Math.max(8, Math.round(height * scale)),
  }
}

function sampleImage(
  image: CanvasImageSource,
  destWidth: number,
  destHeight: number,
  settings: Settings,
): SampledCell[][] {
  const canvas = document.createElement('canvas')
  canvas.width = destWidth
  canvas.height = destHeight
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('No se pudo crear el canvas de muestreo')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, 0, 0, destWidth, destHeight)
  const data = ctx.getImageData(0, 0, destWidth, destHeight).data
  const cells: SampledCell[][] = []

  for (let y = 0; y < destHeight; y++) {
    const row: SampledCell[] = []
    for (let x = 0; x < destWidth; x++) {
      const i = (y * destWidth + x) * 4
      const toned = applyTone(data[i], data[i + 1], data[i + 2], settings.brightness, settings.contrast)
      const alpha = data[i + 3] / 255
      const lum = luminance(toned.r, toned.g, toned.b)
      const sat = saturation(toned.r, toned.g, toned.b)
      const empty =
        alpha < 0.12 ||
        (settings.ignoreLightBackground &&
          lum >= settings.backgroundThreshold &&
          sat < 0.18)
      row.push({ ...toned, empty })
    }
    cells.push(row)
  }
  return cells
}

function kmeans(points: Lab[], k: number, iterations = 9): Lab[] {
  const unique = Math.min(k, points.length)
  const centroids: Lab[] = []
  const used = new Set<number>()
  while (centroids.length < unique) {
    const index = Math.floor((centroids.length * 97 + 13) % points.length)
    const jitter = (index * 53) % points.length
    if (used.has(jitter)) {
      const fallback = points[centroids.length % points.length]
      centroids.push({ ...fallback })
      used.add(centroids.length)
      continue
    }
    used.add(jitter)
    centroids.push({ ...points[jitter] })
  }

  const assign = new Array<number>(points.length).fill(0)
  for (let iter = 0; iter < iterations; iter++) {
    const sums = centroids.map(() => ({ l: 0, a: 0, b: 0, n: 0 }))
    for (let i = 0; i < points.length; i++) {
      let best = 0
      let bestDist = Infinity
      for (let c = 0; c < centroids.length; c++) {
        const dl = points[i].l - centroids[c].l
        const da = points[i].a - centroids[c].a
        const db = points[i].b - centroids[c].b
        const dist = dl * dl + da * da + db * db
        if (dist < bestDist) {
          bestDist = dist
          best = c
        }
      }
      assign[i] = best
      sums[best].l += points[i].l
      sums[best].a += points[i].a
      sums[best].b += points[i].b
      sums[best].n += 1
    }
    for (let c = 0; c < centroids.length; c++) {
      if (sums[c].n === 0) {
        centroids[c] = { ...points[(c * 17 + iter * 31) % points.length] }
        continue
      }
      centroids[c] = {
        l: sums[c].l / sums[c].n,
        a: sums[c].a / sums[c].n,
        b: sums[c].b / sums[c].n,
      }
    }
  }
  return centroids
}

function labToApproxRgb(lab: Lab) {
  const y = (lab.l + 16) / 116
  const x = lab.a / 500 + y
  const z = y - lab.b / 200
  const pivot = (t: number) => {
    const t3 = t * t * t
    return t3 > 0.008856 ? t3 : (t - 16 / 116) / 7.787
  }
  let X = pivot(x) * 0.95047
  let Y = pivot(y)
  let Z = pivot(z) * 1.08883
  const toRgb = (c: number) => {
    const v = c > 0.0031308 ? 1.055 * c ** (1 / 2.4) - 0.055 : 12.92 * c
    return Math.min(255, Math.max(0, v * 255))
  }
  return {
    r: toRgb(X * 3.2406 + Y * -1.5372 + Z * -0.4986),
    g: toRgb(X * -0.9689 + Y * 1.8758 + Z * 0.0415),
    b: toRgb(X * 0.0557 + Y * -0.204 + Z * 1.057),
  }
}

export function imageToPattern(
  image: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  settings: Settings,
): EmbroideryPattern {
  const { width, height } = fitGrid(sourceWidth, sourceHeight, settings.gridWidth)
  const sampled = sampleImage(image, width, height, settings)
  const live: { x: number; y: number; lab: Lab }[] = []

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = sampled[y][x]
      if (cell.empty) continue
      live.push({ x, y, lab: rgbToLab(cell.r, cell.g, cell.b) })
    }
  }

  const cells: (number | null)[][] = Array.from({ length: height }, () =>
    Array<number | null>(width).fill(null),
  )

  if (live.length === 0) {
    return { width, height, cells, palette: [], counts: [] }
  }

  const k = Math.max(1, Math.min(settings.colorCount, live.length))
  const centroids = kmeans(
    live.map((p) => p.lab),
    k,
  )
  const used = new Set<string>()
  const palette: DmcColor[] = centroids.map((centroid) => {
    const rgb = labToApproxRgb(centroid)
    const dmc = nearestUnusedDmc(rgb.r, rgb.g, rgb.b, used)
    used.add(dmc.code)
    return dmc
  })

  const counts = Array(palette.length).fill(0)
  for (const point of live) {
    let best = 0
    let bestDist = Infinity
    for (let c = 0; c < centroids.length; c++) {
      const dl = point.lab.l - centroids[c].l
      const da = point.lab.a - centroids[c].a
      const db = point.lab.b - centroids[c].b
      const dist = dl * dl + da * da + db * db
      if (dist < bestDist) {
        bestDist = dist
        best = c
      }
    }
    cells[point.y][point.x] = best
    counts[best] += 1
  }

  return { width, height, cells, palette, counts }
}

export function physicalSizeCm(pattern: EmbroideryPattern, aidaCount: number) {
  const inchW = pattern.width / aidaCount
  const inchH = pattern.height / aidaCount
  return {
    width: +(inchW * 2.54).toFixed(1),
    height: +(inchH * 2.54).toFixed(1),
  }
}

export function totalStitches(pattern: EmbroideryPattern) {
  return pattern.counts.reduce((sum, n) => sum + n, 0)
}
