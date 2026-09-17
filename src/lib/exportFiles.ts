import { physicalSizeCm, totalStitches } from './process'
import { stitchCount } from './stitches'
import type { EmbroideryPattern, Settings, ThreadPath } from './types'

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}

const SYMBOLS = '●▲■◆✚★○△□◇✕✚✶✸+x#@*%&ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function patternSvg(pattern: EmbroideryPattern, paths: ThreadPath[], style: Settings['style']) {
  const cell = 12
  const width = pattern.width * cell
  const height = pattern.height * cell
  const groups = pattern.palette.map((color, index) => {
    const d: string[] = []
    if (style === 'cruz') {
      for (let y = 0; y < pattern.height; y++) {
        for (let x = 0; x < pattern.width; x++) {
          if (pattern.cells[y][x] !== index) continue
          const x0 = x * cell + 2
          const y0 = y * cell + 2
          const x1 = x * cell + cell - 2
          const y1 = y * cell + cell - 2
          d.push(`M${x0} ${y0} L${x1} ${y1} M${x1} ${y0} L${x0} ${y1}`)
        }
      }
    } else {
      for (const path of paths) {
        if (path.colorIndex !== index || path.points.length === 0) continue
        d.push(
          path.points
            .map((point, i) => `${i === 0 ? 'M' : 'L'}${point.x * cell} ${point.y * cell}`)
            .join(' '),
        )
      }
    }
    return `<path d="${d.join(' ')}" fill="none" stroke="${color.hex}" stroke-width="${style === 'cruz' ? 2.4 : 1.8}" stroke-linecap="round" stroke-linejoin="round"/>`
  })

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#efe3c8"/>
  ${groups.join('\n  ')}
</svg>`
}

export function threadListText(pattern: EmbroideryPattern, settings: Settings) {
  const size = physicalSizeCm(pattern, settings.aidaCount)
  const lines = [
    'Hilograma — lista de hilos DMC',
    `Tamaño: ${size.width} × ${size.height} cm en Aida ${settings.aidaCount}`,
    `Celdas: ${pattern.width} × ${pattern.height}`,
    `Puntadas de color: ${totalStitches(pattern)}`,
    '',
    'Código  Nombre                         Celdas',
    '----------------------------------------------',
    ...pattern.palette.map((color, i) => {
      const name = color.name.padEnd(30, ' ')
      const code = color.code.padEnd(6, ' ')
      return `${code}  ${name} ${String(pattern.counts[i]).padStart(6, ' ')}`
    }),
  ]
  return lines.join('\n')
}

export function patternChartHtml(
  pattern: EmbroideryPattern,
  settings: Settings,
  paths: ThreadPath[],
) {
  const size = physicalSizeCm(pattern, settings.aidaCount)
  const rows = pattern.cells
    .map(
      (row) =>
        `<tr>${row
          .map((cell) => {
            if (cell == null) return `<td class="empty"></td>`
            const symbol = SYMBOLS[cell % SYMBOLS.length]
            const color = pattern.palette[cell]
            return `<td title="DMC ${color.code}" style="color:${color.hex}">${symbol}</td>`
          })
          .join('')}</tr>`,
    )
    .join('')

  const legend = pattern.palette
    .map((color, i) => {
      const symbol = SYMBOLS[i % SYMBOLS.length]
      return `<li><span class="swatch" style="background:${color.hex}"></span><b>${symbol}</b> DMC ${color.code} — ${color.name} <em>${pattern.counts[i]} celdas</em></li>`
    })
    .join('')

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <title>Carta de patrón — Hilograma</title>
  <style>
    body { font-family: Georgia, serif; background: #f7f1e6; color: #241c14; margin: 32px; }
    h1 { font-size: 28px; margin: 0 0 4px; }
    p { margin: 0 0 18px; color: #5a4d3e; }
    table { border-collapse: collapse; background: #efe3c8; }
    td { width: 14px; height: 14px; border: 1px solid rgba(90,70,40,0.18); text-align: center; font-size: 10px; font-weight: 700; }
    td.empty { background: transparent; }
    ul { columns: 2; padding: 0; list-style: none; }
    li { margin: 0 0 8px; break-inside: avoid; }
    .swatch { display: inline-block; width: 14px; height: 14px; border-radius: 3px; margin-right: 8px; vertical-align: middle; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.15); }
    em { color: #7a6a58; font-style: normal; }
  </style>
</head>
<body>
  <h1>Carta de patrón</h1>
  <p>${pattern.width} × ${pattern.height} puntadas · ${size.width} × ${size.height} cm en Aida ${settings.aidaCount} · ${stitchCount(paths)} recorridos de hilo</p>
  <table>${rows}</table>
  <h2>Hilos</h2>
  <ul>${legend}</ul>
</body>
</html>`
}
