import { buildThreadPaths } from './stitches'
import type { EmbroideryPattern, Settings, ThreadPath } from './types'

type Flag = 'stitch' | 'jump' | 'color' | 'end'

function bit(n: number) {
  return 1 << n
}

function encodeRecord(x: number, y: number, flags: Flag) {
  y = -y
  let b0 = 0
  let b1 = 0
  let b2 = 0

  if (flags === 'jump') b2 += bit(7)
  if (flags === 'stitch' || flags === 'jump') {
    b2 += bit(0)
    b2 += bit(1)
    if (x > 40) {
      b2 += bit(2)
      x -= 81
    }
    if (x < -40) {
      b2 += bit(3)
      x += 81
    }
    if (x > 13) {
      b1 += bit(2)
      x -= 27
    }
    if (x < -13) {
      b1 += bit(3)
      x += 27
    }
    if (x > 4) {
      b0 += bit(2)
      x -= 9
    }
    if (x < -4) {
      b0 += bit(3)
      x += 9
    }
    if (x > 1) {
      b1 += bit(0)
      x -= 3
    }
    if (x < -1) {
      b1 += bit(1)
      x += 3
    }
    if (x > 0) {
      b0 += bit(0)
      x -= 1
    }
    if (x < 0) {
      b0 += bit(1)
      x += 1
    }
    if (y > 40) {
      b2 += bit(5)
      y -= 81
    }
    if (y < -40) {
      b2 += bit(4)
      y += 81
    }
    if (y > 13) {
      b1 += bit(5)
      y -= 27
    }
    if (y < -13) {
      b1 += bit(4)
      y += 27
    }
    if (y > 4) {
      b0 += bit(5)
      y -= 9
    }
    if (y < -4) {
      b0 += bit(4)
      y += 9
    }
    if (y > 1) {
      b1 += bit(7)
      y -= 3
    }
    if (y < -1) {
      b1 += bit(6)
      y += 3
    }
    if (y > 0) {
      b0 += bit(7)
      y -= 1
    }
    if (y < 0) {
      b0 += bit(6)
      y += 1
    }
  } else if (flags === 'color') {
    b2 = 0b11000011
  } else {
    b2 = 0b11110011
  }

  return Uint8Array.from([b0, b1, b2])
}

function pad(value: string, width: number) {
  return value.length >= width ? value.slice(0, width) : value.padStart(width, ' ')
}

function splitDelta(dx: number, dy: number, flag: Flag, records: Uint8Array[]) {
  let remainX = dx
  let remainY = dy
  while (Math.abs(remainX) > 121 || Math.abs(remainY) > 121) {
    const scale = 121 / Math.max(Math.abs(remainX), Math.abs(remainY))
    const mx = Math.round(remainX * scale)
    const my = Math.round(remainY * scale)
    records.push(encodeRecord(mx, my, 'jump'))
    remainX -= mx
    remainY -= my
  }
  records.push(encodeRecord(remainX, remainY, flag))
}

export function buildDstFile(
  pattern: EmbroideryPattern,
  settings: Settings,
  paths?: ThreadPath[],
  label = 'HILOGRAMA',
) {
  const threadPaths = paths ?? buildThreadPaths(pattern, settings.style)
  const unit = Math.max(8, Math.round(254 / settings.aidaCount))
  const records: Uint8Array[] = []
  let cx = 0
  let cy = 0
  let minX = 0
  let maxX = 0
  let minY = 0
  let maxY = 0
  let colorChanges = 0

  const toMachine = (x: number, y: number) => ({
    x: Math.round((x - pattern.width / 2) * unit),
    y: Math.round((y - pattern.height / 2) * unit),
  })

  const goTo = (x: number, y: number, flag: Flag) => {
    splitDelta(x - cx, y - cy, flag, records)
    cx = x
    cy = y
    minX = Math.min(minX, cx)
    maxX = Math.max(maxX, cx)
    minY = Math.min(minY, cy)
    maxY = Math.max(maxY, cy)
  }

  let lastColor = -1
  for (const path of threadPaths) {
    if (path.points.length === 0) continue
    if (lastColor !== -1 && path.colorIndex !== lastColor) {
      records.push(encodeRecord(0, 0, 'color'))
      colorChanges += 1
    }
    lastColor = path.colorIndex
    const start = toMachine(path.points[0].x, path.points[0].y)
    goTo(start.x, start.y, 'jump')
    for (let i = 1; i < path.points.length; i++) {
      const next = toMachine(path.points[i].x, path.points[i].y)
      goTo(next.x, next.y, 'stitch')
    }
  }
  records.push(encodeRecord(0, 0, 'end'))

  const name = pad(label.replace(/[^\w-]+/g, '').slice(0, 16) || 'HILOGRAMA', 16)
  const headerLines = [
    `LA:${name}\r`,
    `ST:${String(records.length).padStart(7, ' ')}\r`,
    `CO:${String(colorChanges).padStart(3, ' ')}\r`,
    `+X:${String(Math.abs(maxX)).padStart(5, ' ')}\r`,
    `-X:${String(Math.abs(minX)).padStart(5, ' ')}\r`,
    `+Y:${String(Math.abs(maxY)).padStart(5, ' ')}\r`,
    `-Y:${String(Math.abs(minY)).padStart(5, ' ')}\r`,
    `AX:${cx >= 0 ? '+' : '-'}${String(Math.abs(cx)).padStart(5, ' ')}\r`,
    `AY:${-cy >= 0 ? '+' : '-'}${String(Math.abs(-cy)).padStart(5, ' ')}\r`,
    `MX:+${pad('0', 5)}\r`,
    `MY:+${pad('0', 5)}\r`,
    `PD:******\r`,
  ]
  const header = new Uint8Array(512)
  header.fill(0x20)
  const text = new TextEncoder().encode(headerLines.join(''))
  header.set(text.slice(0, 511))
  header[Math.min(text.length, 511)] = 0x1a

  const body = new Uint8Array(records.reduce((sum, rec) => sum + rec.length, 0))
  let offset = 0
  for (const rec of records) {
    body.set(rec, offset)
    offset += rec.length
  }

  const file = new Uint8Array(header.length + body.length)
  file.set(header, 0)
  file.set(body, header.length)
  return file
}
