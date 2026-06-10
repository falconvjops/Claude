import { useStore } from '../state/store'

export function TitleBar() {
  const { setPaletteMode } = useStore()
  return (
    <div className="titlebar">
      <div className="titlebar-dots">
        <span className="dot red" />
        <span className="dot yellow" />
        <span className="dot green" />
      </div>
      <button className="titlebar-search" onClick={() => setPaletteMode('files')}>
        demo-project — Cursor
      </button>
      <div className="titlebar-right" />
    </div>
  )
}
