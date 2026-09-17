import { mixHex } from './color'
import type { EmbroideryPattern, StitchStyle, ThreadPath } from './types'

function hash(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
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
  const ox = Math.cos(angle + Math.PI / 2) * width * 0.16
  const oy = Math.sin(angle + Math.PI / 2) * width * 0.16

  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  ctx.strokeStyle = mixHex(color, '#1a120c', 0.28)
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()

  ctx.strokeStyle = color
  ctx.lineWidth = width * 0.72
  ctx.beginPath()
  ctx.moveTo(x1 - ox * 0.15, y1 - oy * 0.15)
  ctx.lineTo(x2 - ox * 0.15, y2 - oy * 0.15)
  ctx.stroke()

  ctx.strokeStyle = mixHex(color, '#fff6ea', 0.42)
  ctx.lineWidth = width * 0.22
  ctx.beginPath()
  ctx.moveTo(x1 + ox, y1 + oy)
  ctx.lineTo(x2 + ox, y2 + oy)
  ctx.stroke()
}

function paintLinen(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const base = ctx.createLinearGradient(0, 0, width, height)
  base.addColorStop(0, '#efe3c8')
  base.addColorStop(0.5, '#e6d5b2')
  base.addColorStop(1, '#decaa4')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, width, height)

  ctx.save()
  ctx.globalAlpha = 0.09
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

function cellSize(pattern: EmbroideryPattern, canvasWidth: number, canvasHeight: number) {
  return Math.min(canvasWidth / pattern.width, canvasHeight / pattern.height)
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

function drawCrossStitches(
  ctx: CanvasRenderingContext2D,
  pattern: EmbroideryPattern,
  ox: number,
  oy: number,
  size: number,
) {
  const width = Math.max(1.15, size * 0.3)
  for (let y = 0; y < pattern.height; y++) {
    for (let x = 0; x < pattern.width; x++) {
      const index = pattern.cells[y][x]
      if (index == null) continue
      const color = pattern.palette[index].hex
      const jx = (hash(x, y) - 0.5) * size * 0.06
      const jy = (hash(y, x) - 0.5) * size * 0.06
      const x0 = ox + x * size + size * 0.16 + jx
      const y0 = oy + y * size + size * 0.16 + jy
      const x1 = ox + x * size + size * 0.84 + jx
      const y1 = oy + y * size + size * 0.84 + jy
      strokeThread(ctx, x0, y0, x1, y1, color, width)
      strokeThread(ctx, x1, y0, x0, y1, color, width)
    }
  }
}

function drawPaths(
  ctx: CanvasRenderingContext2D,
  pattern: EmbroideryPattern,
  paths: ThreadPath[],
  ox: number,
  oy: number,
  size: number,
  widthFactor: number,
) {
  const width = Math.max(1.05, size * widthFactor)
  for (const path of paths) {
    const color = pattern.palette[path.colorIndex].hex
    for (let i = 1; i < path.points.length; i++) {
      const a = path.points[i - 1]
      const b = path.points[i]
      strokeThread(
        ctx,
        ox + a.x * size,
        oy + a.y * size,
        ox + b.x * size,
        oy + b.y * size,
        color,
        width,
      )
    }
  }
}

export function renderEmbroidery(
  ctx: CanvasRenderingContext2D,
  pattern: EmbroideryPattern,
  paths: ThreadPath[],
  style: StitchStyle,
  width: number,
  height: number,
) {
  ctx.clearRect(0, 0, width, height)
  paintLinen(ctx, width, height)

  if (pattern.palette.length === 0) return

  const size = cellSize(pattern, width, height)
  const { x, y } = origin(pattern, width, height, size)

  if (style === 'cruz') {
    drawCrossStitches(ctx, pattern, x, y, size)
    return
  }

  const widthFactor = style === 'contorno' ? 0.22 : style === 'saten' ? 0.2 : 0.18
  drawPaths(ctx, pattern, paths, x, y, size, widthFactor)
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
  const scale = Math.min(width / sourceWidth, height / sourceHeight)
  const dw = sourceWidth * scale
  const dh = sourceHeight * scale
  ctx.drawImage(image, (width - dw) / 2, (height - dh) / 2, dw, dh)
}

export function exportPreviewPng(
  pattern: EmbroideryPattern,
  paths: ThreadPath[],
  style: StitchStyle,
  scale = 14,
) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(320, pattern.width * scale)
  canvas.height = Math.max(320, pattern.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo exportar el PNG')
  renderEmbroidery(ctx, pattern, paths, style, canvas.width, canvas.height)
  return canvas
}
