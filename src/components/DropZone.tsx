interface DropZoneProps {
  image: HTMLImageElement | null
  onFile: (file: File) => void
  onSample: () => void
}

export function DropZone({ image, onFile, onSample }: DropZoneProps) {
  function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    onFile(file)
  }

  return (
    <section className="panel">
      <header className="panel-head">
        <span className="kicker">01</span>
        <h2>Imagen</h2>
      </header>
      <label
        className={`dropzone ${image ? 'has-image' : ''}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          handleFiles(event.dataTransfer.files)
        }}
      >
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => handleFiles(event.target.files)}
        />
        {image ? (
          <img src={image.src} alt="Imagen de origen" />
        ) : (
          <div className="dropzone-empty">
            <strong>Suelta una foto</strong>
            <span>o haz clic para elegirla</span>
          </div>
        )}
      </label>
      <button type="button" className="ghost-btn" onClick={onSample}>
        Usar motivo de ejemplo
      </button>
    </section>
  )
}
