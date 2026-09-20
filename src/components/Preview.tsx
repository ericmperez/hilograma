import { useEffect, useRef, useState } from 'react'
import { renderEmbroidery, renderSource } from '../lib/render'
import { stitchCount } from '../lib/stitches'
import type { EmbroideryPattern, FabricKind, StitchStyle, ThreadPath } from '../lib/types'

interface PreviewProps {
  image: HTMLImageElement | null
  pattern: EmbroideryPattern | null
  paths: ThreadPath[]
  style: StitchStyle
  fabric: FabricKind
  showOriginal: boolean
  busy: boolean
  error?: string | null
}

export function Preview({
  image,
  pattern,
  paths,
  style,
  fabric,
  showOriginal,
  busy,
  error,
}: PreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(1)

  useEffect(() => {
    setPlaying(false)
    setProgress(1)
  }, [pattern, style, paths])

  useEffect(() => {
    if (!playing) return
    const total = Math.max(1, stitchCount(paths))
    const started = performance.now()
    const duration = Math.min(28000, Math.max(4200, total * 4.2))
    let frame = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / duration)
      setProgress(t)
      if (t < 1) frame = requestAnimationFrame(tick)
      else setPlaying(false)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, paths])

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
        renderEmbroidery(ctx, pattern, paths, style, canvas.width, canvas.height, {
          fabric,
          progress,
          showHoop: true,
        })
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
  }, [image, pattern, paths, style, fabric, showOriginal, progress])

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
        {error && <div className="stage-busy">{error}</div>}
        {pattern && pattern.palette.length > 0 && !showOriginal && (
          <div className="sew-bar">
            <button
              type="button"
              onClick={() => {
                setProgress(0)
                setPlaying(true)
              }}
            >
              {playing ? 'Bordando…' : 'Ver cómo se borde'}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={progress}
              onChange={(event) => {
                setPlaying(false)
                setProgress(Number(event.target.value))
              }}
            />
          </div>
        )}
      </div>
    </section>
  )
}
