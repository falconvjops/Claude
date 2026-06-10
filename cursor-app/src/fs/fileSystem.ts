import type { VFile, SearchResult } from '../types'
import { SAMPLE_PROJECT } from './sampleProject'

const STORAGE_KEY = 'cursor-replica-fs'

export function loadFiles(): VFile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as VFile[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // corrupted storage -> reseed
  }
  return SAMPLE_PROJECT.map((f) => ({ ...f }))
}

export function persistFiles(files: VFile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files))
  } catch {
    // storage full or unavailable - editing still works in-memory
  }
}

export function resetFiles(): VFile[] {
  const files = SAMPLE_PROJECT.map((f) => ({ ...f }))
  persistFiles(files)
  return files
}

export function languageForPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    json: 'json',
    css: 'css',
    scss: 'scss',
    html: 'html',
    md: 'markdown',
    py: 'python',
    rs: 'rust',
    go: 'go',
    java: 'java',
    c: 'c',
    h: 'c',
    cpp: 'cpp',
    sh: 'shell',
    yml: 'yaml',
    yaml: 'yaml',
    sql: 'sql',
    xml: 'xml',
    toml: 'ini',
  }
  return map[ext] ?? 'plaintext'
}

export interface TreeNode {
  name: string
  path: string
  isDir: boolean
  children: TreeNode[]
}

/** Build a directory tree from flat file paths, dirs first then alphabetical. */
export function buildTree(files: VFile[]): TreeNode[] {
  const root: TreeNode = { name: '', path: '', isDir: true, children: [] }
  for (const file of files) {
    const parts = file.path.split('/')
    let node = root
    for (let i = 0; i < parts.length; i++) {
      const isLeaf = i === parts.length - 1
      const childPath = parts.slice(0, i + 1).join('/')
      let child = node.children.find((c) => c.path === childPath)
      if (!child) {
        child = { name: parts[i], path: childPath, isDir: !isLeaf, children: [] }
        node.children.push(child)
      }
      node = child
    }
  }
  const sort = (nodes: TreeNode[]) => {
    nodes.sort((a, b) =>
      a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1,
    )
    nodes.forEach((n) => sort(n.children))
  }
  sort(root.children)
  return root.children
}

export function searchFiles(files: VFile[], query: string): SearchResult[] {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  const results: SearchResult[] = []
  for (const file of files) {
    const lines = file.content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(q)) {
        results.push({ path: file.path, line: i + 1, preview: lines[i].trim().slice(0, 120) })
        if (results.length >= 200) return results
      }
    }
  }
  return results
}
