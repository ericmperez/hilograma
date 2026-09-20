function oval(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
  rotation = 0,
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function petalRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  count: number,
  radius: number,
  rx: number,
  ry: number,
  color: string,
  start = 0,
) {
  for (let i = 0; i < count; i++) {
    const angle = start + (i / count) * Math.PI * 2
    oval(ctx, x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, rx, ry, color, angle)
  }
}

function leaf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  length: number,
  width: number,
  color: string,
  rotation: number,
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.quadraticCurveTo(width, length * 0.45, 0, length)
  ctx.quadraticCurveTo(-width, length * 0.45, 0, 0)
  ctx.fill()
  ctx.restore()
}

export function createSampleImage(): HTMLCanvasElement {
  const size = 720
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear el motivo de ejemplo')

  ctx.fillStyle = '#F3E6C8'
  ctx.fillRect(0, 0, size, size)

  ctx.strokeStyle = '#C45A3A'
  ctx.lineWidth = 10
  ctx.strokeRect(28, 28, size - 56, size - 56)
  ctx.strokeStyle = '#2B4A6E'
  ctx.lineWidth = 4
  ctx.strokeRect(44, 44, size - 88, size - 88)

  const dots: Array<[number, number, string]> = [
    [80, 80, '#C41020'],
    [640, 80, '#187820'],
    [80, 640, '#2050A0'],
    [640, 640, '#C89818'],
  ]
  for (const [x, y, color] of dots) {
    oval(ctx, x, y, 16, 16, color)
  }

  leaf(ctx, 168, 430, 150, 46, '#3E5818', -0.9)
  leaf(ctx, 210, 450, 130, 38, '#508038', -0.35)
  leaf(ctx, 520, 200, 140, 40, '#386830', 0.7)
  leaf(ctx, 545, 250, 120, 34, '#6A7820', 1.15)

  oval(ctx, 360, 390, 86, 58, '#184888', 0.15)
  oval(ctx, 348, 382, 54, 34, '#2A68A8', 0.15)
  oval(ctx, 430, 340, 78, 30, '#C41020', -0.55)
  oval(ctx, 455, 318, 56, 18, '#F05010', -0.55)
  oval(ctx, 478, 300, 34, 12, '#F8B020', -0.55)
  oval(ctx, 292, 348, 48, 20, '#2050A0', 0.9)
  oval(ctx, 270, 322, 36, 14, '#68A0D8', 1.05)
  oval(ctx, 400, 430, 70, 22, '#102848', 0.35)
  oval(ctx, 348, 448, 22, 36, '#102848', 0.05)
  oval(ctx, 318, 478, 14, 28, '#102848', -0.4)
  oval(ctx, 392, 476, 14, 28, '#102848', 0.35)

  oval(ctx, 438, 368, 22, 18, '#F8E800')
  oval(ctx, 318, 372, 10, 10, '#FCFCFC')
  oval(ctx, 316, 372, 5, 5, '#000000')
  oval(ctx, 300, 390, 16, 8, '#E01020')

  petalRing(ctx, 188, 210, 8, 46, 22, 14, '#E01020')
  petalRing(ctx, 188, 210, 8, 28, 16, 10, '#F09050', 0.2)
  oval(ctx, 188, 210, 18, 18, '#F8D830')

  petalRing(ctx, 530, 500, 7, 40, 20, 13, '#D04664')
  petalRing(ctx, 530, 500, 7, 22, 13, 9, '#F0A0A8', 0.18)
  oval(ctx, 530, 500, 14, 14, '#F8CC40')

  petalRing(ctx, 250, 560, 6, 32, 16, 11, '#884098')
  oval(ctx, 250, 560, 12, 12, '#F8E868')

  petalRing(ctx, 560, 170, 6, 30, 15, 10, '#40B030')
  oval(ctx, 560, 170, 11, 11, '#F8B020')

  oval(ctx, 140, 500, 18, 18, '#149888')
  oval(ctx, 600, 360, 16, 16, '#C89818')
  oval(ctx, 430, 140, 14, 14, '#F05088')
  oval(ctx, 120, 300, 12, 12, '#3270B8')

  return canvas
}

export function canvasToImage(canvas: HTMLCanvasElement): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('No se pudo preparar la imagen'))
    image.src = canvas.toDataURL('image/png')
  })
}
