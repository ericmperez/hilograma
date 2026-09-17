export interface Rgb {
  r: number
  g: number
  b: number
}

export interface Lab {
  l: number
  a: number
  b: number
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function hexToRgb(hex: string): Rgb {
  const raw = hex.replace('#', '')
  return {
    r: parseInt(raw.slice(0, 2), 16),
    g: parseInt(raw.slice(2, 4), 16),
    b: parseInt(raw.slice(4, 6), 16),
  }
}

export function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) =>
    clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

export function mixHex(hex: string, other: string, amount: number): string {
  const a = hexToRgb(hex)
  const b = hexToRgb(other)
  return rgbToHex(
    a.r + (b.r - a.r) * amount,
    a.g + (b.g - a.g) * amount,
    a.b + (b.b - a.b) * amount,
  )
}

export function luminance(r: number, g: number, b: number): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

export function saturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b) / 255
  const min = Math.min(r, g, b) / 255
  if (max === 0) return 0
  return (max - min) / max
}

function pivotRgb(channel: number): number {
  const c = channel / 255
  return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92
}

function pivotXyz(channel: number): number {
  return channel > 0.008856 ? Math.cbrt(channel) : (7.787 * channel + 16 / 116)
}

export function rgbToLab(r: number, g: number, b: number): Lab {
  const R = pivotRgb(r)
  const G = pivotRgb(g)
  const B = pivotRgb(b)
  const x = pivotXyz((R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047)
  const y = pivotXyz(R * 0.2126 + G * 0.7152 + B * 0.0722)
  const z = pivotXyz((R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883)
  return {
    l: 116 * y - 16,
    a: 500 * (x - y),
    b: 200 * (y - z),
  }
}

export function labDistance(a: Lab, b: Lab): number {
  const dl = a.l - b.l
  const da = a.a - b.a
  const db = a.b - b.b
  return dl * dl + da * da + db * db
}

export function applyTone(
  r: number,
  g: number,
  b: number,
  brightness: number,
  contrast: number,
): Rgb {
  const bright = brightness / 100
  const c = contrast / 100
  const factor = (259 * (c * 255 + 255)) / (255 * (259 - c * 255))
  const tone = (v: number) =>
    clamp(factor * (v - 128) + 128 + bright * 255, 0, 255)
  return { r: tone(r), g: tone(g), b: tone(b) }
}
