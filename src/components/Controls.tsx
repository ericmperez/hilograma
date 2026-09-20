import type { Settings, StitchStyle } from '../lib/types'

const STYLES: { id: StitchStyle; name: string; hint: string }[] = [
  { id: 'real', name: 'Real', hint: 'Satén, tatami y borde' },
  { id: 'cruz', name: 'Cruz', hint: 'Punto de cruz clásico' },
  { id: 'saten', name: 'Satén', hint: 'Cubierta paralela' },
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

      <div className="style-grid style-grid-5">
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

      <label className="slider">
        <span>
          Densidad <b>{settings.density.toFixed(2)}</b>
        </span>
        <input
          type="range"
          min={0.55}
          max={1.6}
          step={0.05}
          value={settings.density}
          onChange={(event) => onChange({ density: Number(event.target.value) })}
        />
      </label>

      <label className="slider">
        <span>
          Ángulo de relleno <b>{settings.fillAngle}°</b>
        </span>
        <input
          type="range"
          min={0}
          max={170}
          step={5}
          value={settings.fillAngle}
          onChange={(event) => onChange({ fillAngle: Number(event.target.value) })}
        />
      </label>

      <label className="slider">
        <span>
          Puntada máxima <b>{settings.maxStitchMm.toFixed(1)} mm</b>
        </span>
        <input
          type="range"
          min={3}
          max={8}
          step={0.5}
          value={settings.maxStitchMm}
          onChange={(event) => onChange({ maxStitchMm: Number(event.target.value) })}
        />
      </label>

      <label className="check">
        <input
          type="checkbox"
          checked={settings.underlay}
          onChange={(event) => onChange({ underlay: event.target.checked })}
        />
        Bajo-puntada (underlay)
      </label>

      <div className="fabric-toggle">
        <span>Tela</span>
        <div>
          <button
            type="button"
            className={settings.fabric === 'aida' ? 'active' : ''}
            onClick={() => onChange({ fabric: 'aida' })}
          >
            Aida
          </button>
          <button
            type="button"
            className={settings.fabric === 'lino' ? 'active' : ''}
            onClick={() => onChange({ fabric: 'lino' })}
          >
            Lino
          </button>
        </div>
      </div>
    </section>
  )
}
