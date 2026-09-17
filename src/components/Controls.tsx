import type { Settings, StitchStyle } from '../lib/types'

const STYLES: { id: StitchStyle; name: string; hint: string }[] = [
  { id: 'cruz', name: 'Cruz', hint: 'Punto de cruz clásico' },
  { id: 'saten', name: 'Satén', hint: 'Zigzag denso' },
  { id: 'relleno', name: 'Relleno', hint: 'Puntada tatami' },
  { id: 'contorno', name: 'Contorno', hint: 'Solo siluetas' },
]

interface ControlsProps {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
}

export function Controls({ settings, onChange }: ControlsProps) {
  return (
    <section className="panel">
      <header className="panel-head">
        <span className="kicker">02</span>
        <h2>Puntada</h2>
      </header>

      <div className="style-grid">
        {STYLES.map((style) => (
          <button
            key={style.id}
            type="button"
            className={settings.style === style.id ? 'style-btn active' : 'style-btn'}
            onClick={() => onChange({ style: style.id })}
          >
            <span className={`style-icon style-${style.id}`} aria-hidden="true" />
            <strong>{style.name}</strong>
            <small>{style.hint}</small>
          </button>
        ))}
      </div>

      <label className="slider">
        <span>
          Ancho <b>{settings.gridWidth} puntadas</b>
        </span>
        <input
          type="range"
          min={32}
          max={140}
          value={settings.gridWidth}
          onChange={(event) => onChange({ gridWidth: Number(event.target.value) })}
        />
      </label>

      <label className="slider">
        <span>
          Colores de hilo <b>{settings.colorCount}</b>
        </span>
        <input
          type="range"
          min={3}
          max={22}
          value={settings.colorCount}
          onChange={(event) => onChange({ colorCount: Number(event.target.value) })}
        />
      </label>

      <label className="slider">
        <span>
          Tela Aida <b>{settings.aidaCount} ct</b>
        </span>
        <input
          type="range"
          min={11}
          max={18}
          step={1}
          value={settings.aidaCount}
          onChange={(event) => onChange({ aidaCount: Number(event.target.value) })}
        />
      </label>

      <label className="slider">
        <span>
          Contraste <b>{settings.contrast}</b>
        </span>
        <input
          type="range"
          min={-30}
          max={40}
          value={settings.contrast}
          onChange={(event) => onChange({ contrast: Number(event.target.value) })}
        />
      </label>

      <label className="slider">
        <span>
          Brillo <b>{settings.brightness}</b>
        </span>
        <input
          type="range"
          min={-30}
          max={30}
          value={settings.brightness}
          onChange={(event) => onChange({ brightness: Number(event.target.value) })}
        />
      </label>

      <label className="check">
        <input
          type="checkbox"
          checked={settings.ignoreLightBackground}
          onChange={(event) => onChange({ ignoreLightBackground: event.target.checked })}
        />
        Quitar fondo claro
      </label>
    </section>
  )
}
