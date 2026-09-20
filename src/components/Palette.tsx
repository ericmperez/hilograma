import { machineWarnings, stitchLengthMm } from '../lib/digitize'
import { physicalSizeCm, totalStitches } from '../lib/process'
import { stitchCount } from '../lib/stitches'
import type { EmbroideryPattern, Settings, ThreadPath } from '../lib/types'

interface PaletteProps {
  pattern: EmbroideryPattern | null
  settings: Settings
  paths: ThreadPath[]
}

export function Palette({ pattern, settings, paths }: PaletteProps) {
  if (!pattern || pattern.palette.length === 0) {
    return (
      <section className="panel">
        <header className="panel-head">
          <span className="kicker">03</span>
          <h2>Hilos DMC</h2>
        </header>
        <p className="muted">
          Sube una imagen y aquí aparecerán los ovillos equivalentes, con código DMC y
          cantidad de celdas.
        </p>
      </section>
    )
  }

  const size = physicalSizeCm(pattern, settings.aidaCount)
  const cells = totalStitches(pattern)
  const lengthM = stitchLengthMm(paths, settings.aidaCount) / 1000
  const minutes = Math.max(1, Math.round(stitchCount(paths) / 620))
  const notes = machineWarnings(paths, settings)

  return (
    <section className="panel">
      <header className="panel-head">
        <span className="kicker">03</span>
        <h2>Hilos DMC</h2>
      </header>

      <div className="stats">
        <div>
          <b>{pattern.palette.length}</b>
          <span>colores</span>
        </div>
        <div>
          <b>{cells.toLocaleString('es')}</b>
          <span>celdas</span>
        </div>
        <div>
          <b>{stitchCount(paths).toLocaleString('es')}</b>
          <span>puntadas</span>
        </div>
        <div>
          <b>
            {size.width}×{size.height}
          </b>
          <span>cm en el aro</span>
        </div>
        <div>
          <b>{lengthM.toFixed(1)} m</b>
          <span>hilo aprox.</span>
        </div>
        <div>
          <b>{minutes} min</b>
          <span>a 620 ppm</span>
        </div>
      </div>

      {notes.length > 0 && (
        <ul className="warn-list">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}

      <ul className="thread-list">
        {pattern.palette.map((color, index) => (
          <li key={color.code}>
            <span className="thread-bobbin" style={{ background: color.hex }} />
            <div>
              <strong>DMC {color.code}</strong>
              <small>
                {color.name} · {pattern.counts[index]} celdas
              </small>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
