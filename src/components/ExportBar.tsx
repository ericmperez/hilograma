import { buildDstFile } from '../lib/exportDst'
import {
  downloadBlob,
  downloadDataUrl,
  patternChartHtml,
  patternSvg,
  threadListText,
} from '../lib/exportFiles'
import { exportPreviewPng } from '../lib/render'
import type { EmbroideryPattern, Settings, ThreadPath } from '../lib/types'

interface ExportBarProps {
  pattern: EmbroideryPattern | null
  paths: ThreadPath[]
  settings: Settings
  showOriginal: boolean
  onToggleOriginal: () => void
}

export function ExportBar({
  pattern,
  paths,
  settings,
  showOriginal,
  onToggleOriginal,
}: ExportBarProps) {
  const disabled = !pattern || pattern.palette.length === 0

  function exportPng() {
    if (!pattern) return
    const canvas = exportPreviewPng(pattern, paths, settings.style, 16, settings.fabric)
    downloadDataUrl(canvas.toDataURL('image/png'), 'hilograma-bordado.png')
  }

  function exportSvg() {
    if (!pattern) return
    const svg = patternSvg(pattern, paths, settings.style)
    downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), 'hilograma-bordado.svg')
  }

  function exportDst() {
    if (!pattern) return
    const bytes = buildDstFile(pattern, settings, paths)
    downloadBlob(new Blob([bytes], { type: 'application/octet-stream' }), 'hilograma.dst')
  }

  function exportChart() {
    if (!pattern) return
    const html = patternChartHtml(pattern, settings, paths)
    downloadBlob(new Blob([html], { type: 'text/html' }), 'hilograma-carta.html')
  }

  function exportList() {
    if (!pattern) return
    downloadBlob(new Blob([threadListText(pattern, settings)], { type: 'text/plain' }), 'hilograma-hilos.txt')
  }

  return (
    <div className="export-bar">
      <button type="button" className="ghost-btn" onClick={onToggleOriginal} disabled={!pattern}>
        {showOriginal ? 'Ver bordado' : 'Ver foto'}
      </button>
      <div className="export-group">
        <button type="button" onClick={exportPng} disabled={disabled}>
          PNG
        </button>
        <button type="button" onClick={exportSvg} disabled={disabled}>
          SVG
        </button>
        <button type="button" onClick={exportChart} disabled={disabled}>
          Carta
        </button>
        <button type="button" onClick={exportList} disabled={disabled}>
          Hilos
        </button>
        <button type="button" className="primary" onClick={exportDst} disabled={disabled}>
          Máquina DST
        </button>
      </div>
    </div>
  )
}
