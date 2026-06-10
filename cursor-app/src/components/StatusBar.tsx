import { useStore } from '../state/store'
import { languageForPath } from '../fs/fileSystem'
import { BranchIcon, SparkleIcon, TerminalIcon } from './icons'

export function StatusBar() {
  const { activePath, cursorPos, settings, terminalVisible, setTerminalVisible, setSettingsOpen } =
    useStore()
  return (
    <div className="status-bar">
      <div className="status-left">
        <span className="status-item">
          <BranchIcon /> main
        </span>
        <span className="status-item">0 ⊗ 0 ⚠</span>
        <button
          className={`status-item clickable ${terminalVisible ? 'on' : ''}`}
          onClick={() => setTerminalVisible(!terminalVisible)}
          title="Toggle terminal (Ctrl+`)"
        >
          <TerminalIcon size={13} />
        </button>
      </div>
      <div className="status-right">
        {activePath && (
          <>
            <span className="status-item">
              Ln {cursorPos.line}, Col {cursorPos.col}
            </span>
            <span className="status-item">UTF-8</span>
            <span className="status-item">{languageForPath(activePath)}</span>
          </>
        )}
        <button
          className="status-item clickable"
          onClick={() => setSettingsOpen(true)}
          title="AI settings"
        >
          <SparkleIcon size={12} /> {settings.apiKey ? settings.model : 'demo mode'}
        </button>
      </div>
    </div>
  )
}
