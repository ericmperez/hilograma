import { useEffect, useRef } from 'react'
import { renderEmbroidery, renderSource } from '../lib/render'
import type { EmbroideryPattern, StitchStyle, ThreadPath } from '../lib/types'

interface PreviewProps {
  image: HTMLImageElement | null
  pattern: EmbroideryPattern | null
  paths: ThreadPath[]
  style: StitchStyle
  showOriginal: boolean
  busy: boolean
}

export function Preview({ image, pattern, paths, style, showOriginal, busy }: PreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const paint = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const frame = canvas.parentElement
      const cssWidth = Math.max(frame?.clientWidth || 0, 320)
      const cssHeight = Math.max(frame?.clientHeight || 0, 480)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(320, Math.floor(cssWidth * dpr))
      canvas.height = Math.max(320, Math.floor(cssHeight * dpr))
      canvas.style.width = `${cssWidth}px`
      canvas.style.height = `${cssHeight}px`

      if (showOriginal && image) {
        renderSource(ctx, image, image.naturalWidth, image.naturalHeight, canvas.width, canvas.height)
        return
      }

      if (pattern) {
        renderEmbroidery(ctx, pattern, paths, style, canvas.width, canvas.height)
        return
      }

      renderEmbroidery(
        ctx,
        { width: 8, height: 8, cells: [], palette: [], counts: [] },
        [],
        'cruz',
        canvas.width,
        canvas.height,
      )
    }

    paint()
    const observer = new ResizeObserver(paint)
    if (canvas.parentElement) observer.observe(canvas.parentElement)
    return () => observer.disconnect()
  }, [image, pattern, paths, style, showOriginal])

  return (
    <section className="stage">
      <div className="fabric">
        <canvas ref={canvasRef} />
        {!image && (
          <div className="stage-empty">
            <p>El aro está vacío</p>
            <span>Carga una foto o prueba el motivo folk</span>
          </div>
        )}
        {busy && <div className="stage-busy">Hilvanando…</div>}
      </div>
    </section>
  )
}
