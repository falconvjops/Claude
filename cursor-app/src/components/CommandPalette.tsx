import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../state/store'

interface PaletteItem {
  id: string
  label: string
  detail?: string
  action: () => void
}

export function CommandPalette() {
  const store = useStore()
  const {
    paletteMode, setPaletteMode, files, openFile, createFile,
    setSidebarView, setSidebarVisible, setTerminalVisible, terminalVisible,
    setChatVisible, chatVisible, setSettingsOpen, resetWorkspace, setChatMessages,
  } = store
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (paletteMode) {
      setQuery('')
      setSelected(0)
      // focus after render
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [paletteMode])

  const items = useMemo<PaletteItem[]>(() => {
    if (paletteMode === 'files') {
      return files.map((f) => ({
        id: f.path,
        label: f.path.split('/').pop() ?? f.path,
        detail: f.path,
        action: () => openFile(f.path),
      }))
    }
    return [
      {
        id: 'new-file',
        label: 'File: New File…',
        action: () => {
          const path = window.prompt('New file path:')
          if (path) createFile(path)
        },
      },
      { id: 'open-file', label: 'Go to File…', detail: 'Ctrl+P', action: () => setTimeout(() => setPaletteMode('files'), 0) },
      { id: 'toggle-terminal', label: `View: ${terminalVisible ? 'Hide' : 'Show'} Terminal`, detail: 'Ctrl+`', action: () => setTerminalVisible(!terminalVisible) },
      { id: 'toggle-chat', label: `View: ${chatVisible ? 'Hide' : 'Show'} AI Chat`, detail: 'Ctrl+L', action: () => setChatVisible(!chatVisible) },
      { id: 'show-explorer', label: 'View: Show Explorer', detail: 'Ctrl+Shift+E', action: () => { setSidebarView('explorer'); setSidebarVisible(true) } },
      { id: 'show-search', label: 'View: Show Search', detail: 'Ctrl+Shift+F', action: () => { setSidebarView('search'); setSidebarVisible(true) } },
      { id: 'clear-chat', label: 'Chat: New Chat', action: () => setChatMessages([]) },
      { id: 'settings', label: 'Preferences: Open Settings', action: () => setSettingsOpen(true) },
      {
        id: 'reset-workspace',
        label: 'Workspace: Reset to Sample Project',
        action: () => window.confirm('Reset workspace to the sample project?') && resetWorkspace(),
      },
    ]
  }, [
    paletteMode, files, openFile, createFile, setPaletteMode, terminalVisible,
    setTerminalVisible, chatVisible, setChatVisible, setSidebarView, setSidebarVisible,
    setChatMessages, setSettingsOpen, resetWorkspace,
  ])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    if (!q) return items
    return items.filter(
      (i) => i.label.toLowerCase().includes(q) || i.detail?.toLowerCase().includes(q),
    )
  }, [items, query])

  if (!paletteMode) return null

  const pick = (item: PaletteItem) => {
    setPaletteMode(null)
    item.action()
  }

  return (
    <div className="modal-backdrop palette-backdrop" onMouseDown={() => setPaletteMode(null)}>
      <div className="palette" onMouseDown={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          placeholder={paletteMode === 'files' ? 'Search files by name…' : 'Type a command…'}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSelected(0)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setPaletteMode(null)
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setSelected((s) => Math.min(s + 1, filtered.length - 1))
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault()
              setSelected((s) => Math.max(s - 1, 0))
            }
            if (e.key === 'Enter' && filtered[selected]) pick(filtered[selected])
          }}
        />
        <div className="palette-list">
          {filtered.length === 0 && <div className="palette-empty">No matches</div>}
          {filtered.slice(0, 50).map((item, i) => (
            <div
              key={item.id}
              className={`palette-item ${i === selected ? 'selected' : ''}`}
              onMouseEnter={() => setSelected(i)}
              onClick={() => pick(item)}
            >
              <span>{item.label}</span>
              {item.detail && <span className="palette-detail">{item.detail}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
