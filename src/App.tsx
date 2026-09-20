import { useEffect, useMemo, useState } from 'react'
import { Controls } from './components/Controls'
import { DropZone } from './components/DropZone'
import { ExportBar } from './components/ExportBar'
import { Palette } from './components/Palette'
import { Preview } from './components/Preview'
import { imageToPattern } from './lib/process'
import { canvasToImage, createSampleImage } from './lib/sample'
import { buildThreadPaths } from './lib/stitches'
import { DEFAULT_SETTINGS, type EmbroideryPattern, type Settings } from './lib/types'

export default function App() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [pattern, setPattern] = useState<EmbroideryPattern | null>(null)
  const [busy, setBusy] = useState(false)
  const [showOriginal, setShowOriginal] = useState(false)

  function loadFile(file: File) {
    const url = URL.createObjectURL(file)
    const next = new Image()
    next.onload = () => {
      setImage(next)
      setShowOriginal(false)
    }
    next.src = url
  }

  async function loadSample() {
    const canvas = createSampleImage()
    const next = await canvasToImage(canvas)
    setImage(next)
    setShowOriginal(false)
  }

  useEffect(() => {
    void loadSample()
  }, [])

  useEffect(() => {
    if (!image) return
    setBusy(true)
    const handle = window.setTimeout(() => {
      const next = imageToPattern(image, image.naturalWidth, image.naturalHeight, settings)
      setPattern(next)
      setBusy(false)
    }, 60)
    return () => window.clearTimeout(handle)
  }, [image, settings])

  const paths = useMemo(
    () => (pattern ? buildThreadPaths(pattern, settings) : []),
    [pattern, settings],
  )

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="mark" aria-hidden="true">
            ✕
          </span>
          <div>
            <h1>Hilograma</h1>
            <p>De la foto al aro</p>
          </div>
        </div>
        <ExportBar
          pattern={pattern}
          paths={paths}
          settings={settings}
          showOriginal={showOriginal}
          onToggleOriginal={() => setShowOriginal((value) => !value)}
        />
      </header>

      <main className="studio">
        <aside className="rail">
          <DropZone image={image} onFile={loadFile} onSample={loadSample} />
          <Controls
            settings={settings}
            onChange={(patch) => setSettings((current) => ({ ...current, ...patch }))}
          />
        </aside>
        <Preview
          image={image}
          pattern={pattern}
          paths={paths}
          style={settings.style}
          fabric={settings.fabric}
          showOriginal={showOriginal}
          busy={busy}
        />
        <aside className="rail">
          <Palette pattern={pattern} settings={settings} paths={paths} />
        </aside>
      </main>
    </div>
  )
}
