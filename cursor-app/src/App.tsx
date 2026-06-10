import { useEffect } from 'react'
import { useStore } from './state/store'
import { TitleBar } from './components/TitleBar'
import { ActivityBar } from './components/ActivityBar'
import { Sidebar } from './components/Sidebar'
import { EditorPane } from './components/EditorPane'
import { ChatPanel } from './components/ChatPanel'
import { TerminalPanel } from './components/TerminalPanel'
import { StatusBar } from './components/StatusBar'
import { CommandPalette } from './components/CommandPalette'
import { SettingsModal } from './components/SettingsModal'

export default function App() {
  const {
    sidebarVisible, setSidebarVisible, terminalVisible, setTerminalVisible,
    chatVisible, setChatVisible, setSidebarView, setPaletteMode, paletteMode,
  } = useStore()

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return
      const key = e.key.toLowerCase()
      if (e.shiftKey && key === 'p') {
        e.preventDefault()
        setPaletteMode('commands')
      } else if (!e.shiftKey && key === 'p') {
        e.preventDefault()
        setPaletteMode('files')
      } else if (e.shiftKey && key === 'f') {
        e.preventDefault()
        setSidebarView('search')
        setSidebarVisible(true)
      } else if (e.shiftKey && key === 'e') {
        e.preventDefault()
        setSidebarView('explorer')
        setSidebarVisible(true)
      } else if (key === '`' || (!e.shiftKey && key === 'j')) {
        e.preventDefault()
        setTerminalVisible(!terminalVisible)
      } else if (!e.shiftKey && key === 'b') {
        e.preventDefault()
        setSidebarVisible(!sidebarVisible)
      } else if (!e.shiftKey && key === 'l') {
        e.preventDefault()
        setChatVisible(!chatVisible)
      } else if (key === 'escape' && paletteMode) {
        setPaletteMode(null)
      }
    }
    window.addEventListener('keydown', onKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true })
  }, [
    sidebarVisible, setSidebarVisible, terminalVisible, setTerminalVisible,
    chatVisible, setChatVisible, setSidebarView, setPaletteMode, paletteMode,
  ])

  return (
    <div className="app">
      <TitleBar />
      <div className="app-body">
        <ActivityBar />
        {sidebarVisible && <Sidebar />}
        <div className="center-column">
          <EditorPane />
          {terminalVisible && <TerminalPanel />}
        </div>
        {chatVisible && <ChatPanel />}
      </div>
      <StatusBar />
      <CommandPalette />
      <SettingsModal />
    </div>
  )
}
