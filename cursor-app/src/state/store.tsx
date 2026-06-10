import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { ChatMessage, ChatMode, Settings, SidebarView, VFile } from '../types'
import { DEFAULT_SETTINGS } from '../types'
import { loadFiles, persistFiles, resetFiles } from '../fs/fileSystem'

const SETTINGS_KEY = 'cursor-replica-settings'

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) }
  } catch {
    // fall through to defaults
  }
  return { ...DEFAULT_SETTINGS }
}

export interface Store {
  files: VFile[]
  getFile: (path: string) => VFile | undefined
  writeFile: (path: string, content: string) => void
  createFile: (path: string) => boolean
  deleteFile: (path: string) => void
  renameFile: (oldPath: string, newPath: string) => boolean
  resetWorkspace: () => void

  openTabs: string[]
  activePath: string | null
  openFile: (path: string, line?: number) => void
  closeTab: (path: string) => void
  setActivePath: (path: string) => void
  /** Line to reveal in the editor after opening (consumed once) */
  pendingReveal: { path: string; line: number } | null
  consumeReveal: () => void

  sidebarView: SidebarView
  setSidebarView: (v: SidebarView) => void
  sidebarVisible: boolean
  setSidebarVisible: (v: boolean) => void
  terminalVisible: boolean
  setTerminalVisible: (v: boolean) => void
  chatVisible: boolean
  setChatVisible: (v: boolean) => void
  settingsOpen: boolean
  setSettingsOpen: (v: boolean) => void
  paletteMode: 'commands' | 'files' | null
  setPaletteMode: (m: 'commands' | 'files' | null) => void

  settings: Settings
  updateSettings: (patch: Partial<Settings>) => void

  chatMessages: ChatMessage[]
  setChatMessages: (m: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void
  chatMode: ChatMode
  setChatMode: (m: ChatMode) => void

  cursorPos: { line: number; col: number }
  setCursorPos: (p: { line: number; col: number }) => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<VFile[]>(loadFiles)
  const [openTabs, setOpenTabs] = useState<string[]>(['README.md'])
  const [activePath, setActivePath] = useState<string | null>('README.md')
  const [pendingReveal, setPendingReveal] = useState<{ path: string; line: number } | null>(null)
  const [sidebarView, setSidebarView] = useState<SidebarView>('explorer')
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [terminalVisible, setTerminalVisible] = useState(false)
  const [chatVisible, setChatVisible] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [paletteMode, setPaletteMode] = useState<'commands' | 'files' | null>(null)
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatMode, setChatMode] = useState<ChatMode>('agent')
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 })

  const persistTimer = useRef<number | undefined>(undefined)
  useEffect(() => {
    window.clearTimeout(persistTimer.current)
    persistTimer.current = window.setTimeout(() => persistFiles(files), 300)
    return () => window.clearTimeout(persistTimer.current)
  }, [files])

  const getFile = useCallback(
    (path: string) => files.find((f) => f.path === path),
    [files],
  )

  const writeFile = useCallback((path: string, content: string) => {
    setFiles((prev) => {
      const idx = prev.findIndex((f) => f.path === path)
      if (idx === -1) return [...prev, { path, content }]
      const next = [...prev]
      next[idx] = { path, content }
      return next
    })
  }, [])

  const openFile = useCallback((path: string, line?: number) => {
    setOpenTabs((tabs) => (tabs.includes(path) ? tabs : [...tabs, path]))
    setActivePath(path)
    if (line) setPendingReveal({ path, line })
  }, [])

  const createFile = useCallback(
    (path: string): boolean => {
      const clean = path.trim().replace(/^\/+/, '')
      if (!clean || files.some((f) => f.path === clean)) return false
      setFiles((prev) => [...prev, { path: clean, content: '' }])
      openFile(clean)
      return true
    },
    [files, openFile],
  )

  const closeTab = useCallback((path: string) => {
    setOpenTabs((tabs) => {
      const next = tabs.filter((t) => t !== path)
      setActivePath((active) =>
        active === path ? (next.length ? next[next.length - 1] : null) : active,
      )
      return next
    })
  }, [])

  const deleteFile = useCallback(
    (path: string) => {
      setFiles((prev) => prev.filter((f) => f.path !== path))
      closeTab(path)
    },
    [closeTab],
  )

  const renameFile = useCallback(
    (oldPath: string, newPath: string): boolean => {
      const clean = newPath.trim().replace(/^\/+/, '')
      if (!clean || files.some((f) => f.path === clean)) return false
      setFiles((prev) =>
        prev.map((f) => (f.path === oldPath ? { ...f, path: clean } : f)),
      )
      setOpenTabs((tabs) => tabs.map((t) => (t === oldPath ? clean : t)))
      setActivePath((active) => (active === oldPath ? clean : active))
      return true
    },
    [files],
  )

  const resetWorkspace = useCallback(() => {
    setFiles(resetFiles())
    setOpenTabs(['README.md'])
    setActivePath('README.md')
  }, [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
      } catch {
        // non-fatal
      }
      return next
    })
  }, [])

  const consumeReveal = useCallback(() => setPendingReveal(null), [])

  const store = useMemo<Store>(
    () => ({
      files,
      getFile,
      writeFile,
      createFile,
      deleteFile,
      renameFile,
      resetWorkspace,
      openTabs,
      activePath,
      openFile,
      closeTab,
      setActivePath,
      pendingReveal,
      consumeReveal,
      sidebarView,
      setSidebarView,
      sidebarVisible,
      setSidebarVisible,
      terminalVisible,
      setTerminalVisible,
      chatVisible,
      setChatVisible,
      settingsOpen,
      setSettingsOpen,
      paletteMode,
      setPaletteMode,
      settings,
      updateSettings,
      chatMessages,
      setChatMessages,
      chatMode,
      setChatMode,
      cursorPos,
      setCursorPos,
    }),
    [
      files, getFile, writeFile, createFile, deleteFile, renameFile, resetWorkspace,
      openTabs, activePath, openFile, closeTab, pendingReveal, consumeReveal,
      sidebarView, sidebarVisible, terminalVisible, chatVisible, settingsOpen,
      paletteMode, settings, updateSettings, chatMessages, chatMode, cursorPos,
    ],
  )

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
