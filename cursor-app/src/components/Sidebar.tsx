import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { buildTree, searchFiles, type TreeNode } from '../fs/fileSystem'
import { ChevronIcon, EditIcon, PlusIcon, TrashIcon } from './icons'

function FileEntry({ node, depth }: { node: TreeNode; depth: number }) {
  const { activePath, openFile, deleteFile, renameFile } = useStore()
  const [open, setOpen] = useState(true)
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(node.path)

  if (node.isDir) {
    return (
      <div>
        <div
          className="tree-row dir"
          style={{ paddingLeft: 8 + depth * 12 }}
          onClick={() => setOpen(!open)}
        >
          <ChevronIcon open={open} />
          <span className="tree-name">{node.name}</span>
        </div>
        {open && node.children.map((c) => <FileEntry key={c.path} node={c} depth={depth + 1} />)}
      </div>
    )
  }

  if (renaming) {
    return (
      <div className="tree-row" style={{ paddingLeft: 8 + depth * 12 + 18 }}>
        <input
          className="tree-rename-input"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setRenaming(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              renameFile(node.path, name)
              setRenaming(false)
            }
            if (e.key === 'Escape') setRenaming(false)
          }}
        />
      </div>
    )
  }

  return (
    <div
      className={`tree-row file ${activePath === node.path ? 'active' : ''}`}
      style={{ paddingLeft: 8 + depth * 12 + 18 }}
      onClick={() => openFile(node.path)}
    >
      <span className="tree-name">{node.name}</span>
      <span className="tree-actions" onClick={(e) => e.stopPropagation()}>
        <button
          title="Rename"
          onClick={() => {
            setName(node.path)
            setRenaming(true)
          }}
        >
          <EditIcon size={12} />
        </button>
        <button
          title="Delete"
          onClick={() => {
            if (window.confirm(`Delete ${node.path}?`)) deleteFile(node.path)
          }}
        >
          <TrashIcon size={12} />
        </button>
      </span>
    </div>
  )
}

function Explorer() {
  const { files, createFile, resetWorkspace } = useStore()
  const [creating, setCreating] = useState(false)
  const [newPath, setNewPath] = useState('')
  const tree = useMemo(() => buildTree(files), [files])

  return (
    <>
      <div className="sidebar-header">
        <span>EXPLORER</span>
        <span className="sidebar-header-actions">
          <button title="New File" onClick={() => setCreating(true)}>
            <PlusIcon size={14} />
          </button>
        </span>
      </div>
      <div className="sidebar-section-title">DEMO-PROJECT</div>
      <div className="tree">
        {creating && (
          <div className="tree-row" style={{ paddingLeft: 26 }}>
            <input
              className="tree-rename-input"
              autoFocus
              placeholder="path/to/file.ts"
              value={newPath}
              onChange={(e) => setNewPath(e.target.value)}
              onBlur={() => setCreating(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && createFile(newPath)) {
                  setCreating(false)
                  setNewPath('')
                }
                if (e.key === 'Escape') setCreating(false)
              }}
            />
          </div>
        )}
        {tree.map((n) => (
          <FileEntry key={n.path} node={n} depth={0} />
        ))}
      </div>
      <div className="sidebar-footer">
        <button onClick={() => window.confirm('Reset workspace to the sample project?') && resetWorkspace()}>
          Reset workspace
        </button>
      </div>
    </>
  )
}

function Search() {
  const { files, openFile } = useStore()
  const [query, setQuery] = useState('')
  const results = useMemo(() => searchFiles(files, query), [files, query])

  return (
    <>
      <div className="sidebar-header">
        <span>SEARCH</span>
      </div>
      <div className="search-box">
        <input
          autoFocus
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="search-results">
        {query && results.length === 0 && <div className="search-empty">No results</div>}
        {results.map((r, i) => (
          <div key={i} className="search-result" onClick={() => openFile(r.path, r.line)}>
            <div className="search-result-path">
              {r.path}:{r.line}
            </div>
            <div className="search-result-preview">{r.preview}</div>
          </div>
        ))}
      </div>
    </>
  )
}

function Placeholder({ title, message }: { title: string; message: string }) {
  return (
    <>
      <div className="sidebar-header">
        <span>{title}</span>
      </div>
      <div className="sidebar-placeholder">{message}</div>
    </>
  )
}

export function Sidebar() {
  const { sidebarView } = useStore()
  return (
    <div className="sidebar">
      {sidebarView === 'explorer' && <Explorer />}
      {sidebarView === 'search' && <Search />}
      {sidebarView === 'git' && (
        <Placeholder
          title="SOURCE CONTROL"
          message="This demo workspace is not a git repository."
        />
      )}
      {sidebarView === 'extensions' && (
        <Placeholder title="EXTENSIONS" message="Extensions are not available in this replica." />
      )}
    </div>
  )
}
