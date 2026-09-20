import { mixHex } from './color'
import { visiblePaths } from './stitches'
import type { EmbroideryPattern, FabricKind, StitchStyle, ThreadPath } from './types'

function hash(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}

function cellSize(pattern: EmbroideryPattern, canvasWidth: number, canvasHeight: number) {
  const pad = Math.min(canvasWidth, canvasHeight) * 0.08
  return Math.min((canvasWidth - pad) / pattern.width, (canvasHeight - pad) / pattern.height)
}

function origin(
  pattern: EmbroideryPattern,
  canvasWidth: number,
  canvasHeight: number,
  size: number,
) {
  return {
    x: (canvasWidth - pattern.width * size) / 2,
    y: (canvasHeight - pattern.height * size) / 2,
  }
}

function paintAida(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  pattern: EmbroideryPattern,
  size: number,
) {
  const width = pattern.width * size
  const height = pattern.height * size
  const cloth = ctx.createLinearGradient(ox, oy, ox + width, oy + height)
  cloth.addColorStop(0, '#f3e6c4')
  cloth.addColorStop(0.45, '#ead6ae')
  cloth.addColorStop(1, '#e0c698')
  ctx.fillStyle = cloth
  ctx.fillRect(ox - size * 0.4, oy - size * 0.4, width + size * 0.8, height + size * 0.8)

  ctx.save()
  ctx.strokeStyle = 'rgba(120, 88, 42, 0.16)'
  ctx.lineWidth = Math.max(0.6, size * 0.04)
  for (let x = 0; x <= pattern.width; x++) {
    ctx.beginPath()
    ctx.moveTo(ox + x * size, oy)
    ctx.lineTo(ox + x * size, oy + height)
    ctx.stroke()
  }
  for (let y = 0; y <= pattern.height; y++) {
    ctx.beginPath()
    ctx.moveTo(ox, oy + y * size)
    ctx.lineTo(ox + width, oy + y * size)
    ctx.stroke()
  }
  ctx.restore()

  if (size < 7) return
  const hole = Math.max(0.7, size * 0.11)
  ctx.fillStyle = 'rgba(72, 48, 22, 0.38)'
  for (let y = 0; y <= pattern.height; y++) {
    for (let x = 0; x <= pattern.width; x++) {
      ctx.beginPath()
      ctx.arc(ox + x * size, oy + y * size, hole, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function paintLinen(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const base = ctx.createLinearGradient(0, 0, width, height)
  base.addColorStop(0, '#efe3c8')
  base.addColorStop(0.5, '#e6d5b2')
  base.addColorStop(1, '#decaa4')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, width, height)

  ctx.save()
  ctx.globalAlpha = 0.1
  ctx.strokeStyle = '#7a6238'
  ctx.lineWidth = 1
  const step = 3
  for (let x = 0; x <= width; x += step) {
    ctx.beginPath()
    ctx.moveTo(x + 0.5, 0)
    ctx.lineTo(x + 0.5, height)
    ctx.stroke()
  }
  for (let y = 0; y <= height; y += step) {
    ctx.beginPath()
    ctx.moveTo(0, y + 0.5)
    ctx.lineTo(width, y + 0.5)
    ctx.stroke()
  }
  ctx.restore()

  const speckles = Math.floor((width * height) / 280)
  for (let i = 0; i < speckles; i++) {
    const x = (hash(i, 3) * width) | 0
    const y = (hash(i, 9) * height) | 0
    ctx.fillStyle = `rgba(90, 64, 28, ${0.03 + hash(i, 11) * 0.05})`
    ctx.fillRect(x, y, 1, 1)
  }
}

function paintHoop(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const cx = width / 2
  const cy = height / 2
  const radius = Math.min(width, height) * 0.492
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, width, height)
  ctx.arc(cx, cy, radius, 0, Math.PI * 2, true)
  ctx.fillStyle = 'rgba(22, 14, 9, 0.55)'
  ctx.fill('evenodd')

  const ring = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius)
  ring.addColorStop(0, '#d8b56a')
  ring.addColorStop(0.35, '#8a5a2b')
  ring.addColorStop(0.7, '#c8964a')
  ring.addColorStop(1, '#5c3516')
  ctx.lineWidth = Math.max(14, radius * 0.07)
  ctx.strokeStyle = ring
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.stroke()

  ctx.lineWidth = Math.max(3, radius * 0.012)
  ctx.strokeStyle = 'rgba(255, 230, 180, 0.35)'
  ctx.beginPath()
  ctx.arc(cx, cy, radius - ctx.lineWidth * 2.2, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function strokeThread(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number,
) {
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const ox = Math.cos(angle + Math.PI / 2) * width
  const oy = Math.sin(angle + Math.PI / 2) * width

  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  ctx.strokeStyle = 'rgba(32, 16, 8, 0.24)'
  ctx.lineWidth = width * 1.22
  ctx.beginPath()
  ctx.moveTo(x1 + width * 0.16, y1 + width * 0.26)
  ctx.lineTo(x2 + width * 0.16, y2 + width * 0.26)
  ctx.stroke()

  ctx.strokeStyle = mixHex(color, '#140c08', 0.28)
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()

  ctx.strokeStyle = color
  ctx.lineWidth = width * 0.7
  ctx.beginPath()
  ctx.moveTo(x1 - ox * 0.08, y1 - oy * 0.08)
  ctx.lineTo(x2 - ox * 0.08, y2 - oy * 0.08)
  ctx.stroke()

  ctx.strokeStyle = mixHex(color, '#fff4dc', 0.4)
  ctx.lineWidth = Math.max(0.6, width * 0.2)
  ctx.beginPath()
  ctx.moveTo(x1 + ox * 0.18, y1 + oy * 0.18)
  ctx.lineTo(x2 + ox * 0.18, y2 + oy * 0.18)
  ctx.stroke()
}

function widthForKind(kind: ThreadPath['kind'], size: number) {
  if (kind === 'outline') return Math.max(1.1, size * 0.26)
  if (kind === 'satin') return Math.max(1.2, size * 0.3)
  if (kind === 'cross') return Math.max(1.25, size * 0.32)
  if (kind === 'underlay') return Math.max(0.7, size * 0.12)
  return Math.max(1.05, size * 0.22)
}

function pathSegments(paths: ThreadPath[], progress: number) {
  const total = paths.reduce((sum, path) => sum + Math.max(0, path.points.length - 1), 0)
  const visible = Math.floor(total * Math.min(1, Math.max(0, progress)))
  const out: ThreadPath[] = []
  let seen = 0
  for (const path of paths) {
    const segs = Math.max(0, path.points.length - 1)
    if (seen >= visible) break
    if (seen + segs <= visible) {
      out.push(path)
      seen += segs
      continue
    }
    const keep = visible - seen + 1
    out.push({ ...path, points: path.points.slice(0, keep) })
    break
  }
  return out
}

export function renderEmbroidery(
  ctx: CanvasRenderingContext2D,
  pattern: EmbroideryPattern,
  paths: ThreadPath[],
  style: StitchStyle,
  width: number,
  height: number,
  options: { fabric?: FabricKind; progress?: number; showHoop?: boolean } = {},
) {
  const fabric = options.fabric ?? 'aida'
  const progress = options.progress ?? 1
  ctx.clearRect(0, 0, width, height)
  paintLinen(ctx, width, height)

  if (pattern.palette.length === 0) {
    if (options.showHoop !== false) paintHoop(ctx, width, height)
    return
  }

  const size = cellSize(pattern, width, height)
  const { x, y } = origin(pattern, width, height, size)
  if (fabric === 'aida') paintAida(ctx, x, y, pattern, size)

  const usable = pathSegments(visiblePaths(paths, false), progress)
  for (const path of usable) {
    const color = pattern.palette[path.colorIndex]?.hex
    if (!color) continue
    const strokeWidth = widthForKind(path.kind ?? (style === 'cruz' ? 'cross' : 'fill'), size)
    for (let i = 1; i < path.points.length; i++) {
      const a = path.points[i - 1]
      const b = path.points[i]
      strokeThread(ctx, x + a.x * size, y + a.y * size, x + b.x * size, y + b.y * size, color, strokeWidth)
    }
  }

  if (options.showHoop !== false) paintHoop(ctx, width, height)
}

export function renderSource(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  width: number,
  height: number,
) {
  ctx.clearRect(0, 0, width, height)
  paintLinen(ctx, width, height)
  const scale = Math.min(width / sourceWidth, height / sourceHeight) * 0.86
  const dw = sourceWidth * scale
  const dh = sourceHeight * scale
  ctx.drawImage(image, (width - dw) / 2, (height - dh) / 2, dw, dh)
  paintHoop(ctx, width, height)
}

export function exportPreviewPng(
  pattern: EmbroideryPattern,
  paths: ThreadPath[],
  style: StitchStyle,
  scale = 16,
  fabric: FabricKind = 'aida',
) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(420, pattern.width * scale)
  canvas.height = Math.max(420, pattern.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo exportar el PNG')
  renderEmbroidery(ctx, pattern, paths, style, canvas.width, canvas.height, {
    fabric,
    progress: 1,
    showHoop: true,
  })
  return canvas
}
