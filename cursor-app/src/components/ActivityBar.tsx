import { useStore } from '../state/store'
import type { SidebarView } from '../types'
import { ChatIcon, ExtensionsIcon, FilesIcon, GearIcon, GitIcon, SearchIcon } from './icons'

const VIEWS: { id: SidebarView; icon: JSX.Element; title: string }[] = [
  { id: 'explorer', icon: <FilesIcon />, title: 'Explorer (Ctrl+Shift+E)' },
  { id: 'search', icon: <SearchIcon />, title: 'Search (Ctrl+Shift+F)' },
  { id: 'git', icon: <GitIcon />, title: 'Source Control' },
  { id: 'extensions', icon: <ExtensionsIcon />, title: 'Extensions' },
]

export function ActivityBar() {
  const {
    sidebarView, setSidebarView, sidebarVisible, setSidebarVisible,
    chatVisible, setChatVisible, setSettingsOpen,
  } = useStore()

  return (
    <div className="activity-bar">
      {VIEWS.map((v) => (
        <button
          key={v.id}
          title={v.title}
          className={`activity-item ${sidebarVisible && sidebarView === v.id ? 'active' : ''}`}
          onClick={() => {
            if (sidebarVisible && sidebarView === v.id) {
              setSidebarVisible(false)
            } else {
              setSidebarView(v.id)
              setSidebarVisible(true)
            }
          }}
        >
          {v.icon}
        </button>
      ))}
      <div className="activity-spacer" />
      <button
        title="AI Chat (Ctrl+L)"
        className={`activity-item ${chatVisible ? 'active' : ''}`}
        onClick={() => setChatVisible(!chatVisible)}
      >
        <ChatIcon />
      </button>
      <button title="Settings" className="activity-item" onClick={() => setSettingsOpen(true)}>
        <GearIcon />
      </button>
    </div>
  )
}
