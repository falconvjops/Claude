import { useEffect, useRef, useState } from 'react'
import { useStore } from '../state/store'
import { CloseIcon } from './icons'

interface TermLine {
  text: string
  kind: 'input' | 'output' | 'error'
}

function normalize(cwd: string, target: string): string {
  const parts = (target.startsWith('/') ? target : `${cwd}/${target}`)
    .split('/')
    .filter((p) => p && p !== '.')
  const out: string[] = []
  for (const p of parts) {
    if (p === '..') out.pop()
    else out.push(p)
  }
  return out.join('/')
}

export function TerminalPanel() {
  const { files, setTerminalVisible, resetWorkspace } = useStore()
  const [lines, setLines] = useState<TermLine[]>([
    { text: 'cursor-replica shell — type "help" for commands', kind: 'output' },
  ])
  const [input, setInput] = useState('')
  const [cwd, setCwd] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [histIdx, setHistIdx] = useState(-1)
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight })
  }, [lines])

  function dirsIn(path: string): { dirs: string[]; fileNames: string[] } {
    const prefix = path ? path + '/' : ''
    const dirs = new Set<string>()
    const fileNames: string[] = []
    for (const f of files) {
      if (!f.path.startsWith(prefix)) continue
      const rest = f.path.slice(prefix.length)
      const slash = rest.indexOf('/')
      if (slash === -1) fileNames.push(rest)
      else dirs.add(rest.slice(0, slash))
    }
    return { dirs: [...dirs].sort(), fileNames: fileNames.sort() }
  }

  function run(command: string) {
    const out: TermLine[] = [{ text: `${cwd || '~'} $ ${command}`, kind: 'input' }]
    const [cmd, ...args] = command.trim().split(/\s+/)
    const arg = args.join(' ')
    switch (cmd) {
      case '':
        break
      case 'help':
        out.push({
          text: 'commands: ls, cat <file>, cd <dir>, pwd, echo <text>, clear, reset, help',
          kind: 'output',
        })
        break
      case 'ls': {
        const target = arg ? normalize(cwd, arg) : cwd
        const { dirs, fileNames } = dirsIn(target)
        if (!dirs.length && !fileNames.length && target) {
          out.push({ text: `ls: ${arg || target}: no such directory`, kind: 'error' })
        } else {
          out.push({
            text: [...dirs.map((d) => d + '/'), ...fileNames].join('  ') || '(empty)',
            kind: 'output',
          })
        }
        break
      }
      case 'cat': {
        if (!arg) {
          out.push({ text: 'usage: cat <file>', kind: 'error' })
          break
        }
        const path = normalize(cwd, arg)
        const f = files.find((x) => x.path === path)
        if (f) out.push({ text: f.content, kind: 'output' })
        else out.push({ text: `cat: ${arg}: no such file`, kind: 'error' })
        break
      }
      case 'cd': {
        if (!arg || arg === '/' || arg === '~') {
          setCwd('')
          break
        }
        const path = normalize(cwd, arg)
        const exists = files.some((f) => f.path.startsWith(path + '/'))
        if (exists) setCwd(path)
        else out.push({ text: `cd: ${arg}: no such directory`, kind: 'error' })
        break
      }
      case 'pwd':
        out.push({ text: '/' + cwd, kind: 'output' })
        break
      case 'echo':
        out.push({ text: arg, kind: 'output' })
        break
      case 'clear':
        setLines([])
        return
      case 'reset':
        resetWorkspace()
        out.push({ text: 'workspace reset to sample project', kind: 'output' })
        break
      default:
        out.push({ text: `${cmd}: command not found (this is a simulated shell — try "help")`, kind: 'error' })
    }
    setLines((prev) => [...prev, ...out])
  }

  return (
    <div className="terminal-panel" onClick={() => inputRef.current?.focus()}>
      <div className="terminal-header">
        <span className="terminal-tab">TERMINAL</span>
        <button title="Close" onClick={() => setTerminalVisible(false)}>
          <CloseIcon size={12} />
        </button>
      </div>
      <div className="terminal-body" ref={bodyRef}>
        {lines.map((l, i) => (
          <pre key={i} className={`term-line ${l.kind}`}>{l.text}</pre>
        ))}
        <div className="term-prompt">
          <span className="term-cwd">{cwd || '~'} $</span>
          <input
            ref={inputRef}
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                run(input)
                if (input.trim()) setHistory((h) => [...h, input])
                setHistIdx(-1)
                setInput('')
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                const idx = histIdx === -1 ? history.length - 1 : Math.max(0, histIdx - 1)
                if (history[idx] !== undefined) {
                  setHistIdx(idx)
                  setInput(history[idx])
                }
              }
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                if (histIdx === -1) return
                const idx = histIdx + 1
                if (idx >= history.length) {
                  setHistIdx(-1)
                  setInput('')
                } else {
                  setHistIdx(idx)
                  setInput(history[idx])
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
