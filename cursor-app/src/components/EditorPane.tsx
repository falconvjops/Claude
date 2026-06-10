import { useCallback, useEffect, useRef, useState } from 'react'
import Editor, { DiffEditor } from '@monaco-editor/react'
import { monaco } from '../monacoSetup'
import { useStore } from '../state/store'
import { languageForPath } from '../fs/fileSystem'
import { autocomplete, inlineEdit } from '../ai/client'
import { CloseIcon, SparkleIcon } from './icons'

type IStandaloneCodeEditor = Parameters<NonNullable<Parameters<typeof Editor>[0]['onMount']>>[0]

interface CmdKState {
  selection: InstanceType<typeof monaco.Range>
  selectedText: string
  wholeFile: boolean
}

interface PendingEdit {
  path: string
  original: string
  modified: string
}

export function EditorPane() {
  const store = useStore()
  const {
    openTabs, activePath, getFile, writeFile, closeTab, setActivePath,
    settings, setCursorPos, pendingReveal, consumeReveal,
  } = store

  const editorRef = useRef<IStandaloneCodeEditor | null>(null)
  const [cmdK, setCmdK] = useState<CmdKState | null>(null)
  const [cmdKInput, setCmdKInput] = useState('')
  const [cmdKBusy, setCmdKBusy] = useState(false)
  const [cmdKError, setCmdKError] = useState('')
  const [pendingEdit, setPendingEdit] = useState<PendingEdit | null>(null)

  // Refs so the (once-registered) Monaco providers and commands always see fresh state
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const activePathRef = useRef(activePath)
  activePathRef.current = activePath
  const cmdKAbort = useRef<AbortController | null>(null)

  const file = activePath ? getFile(activePath) : undefined

  const openCmdK = useCallback(() => {
    const editor = editorRef.current
    if (!editor || !activePathRef.current) return
    const model = editor.getModel()
    if (!model) return
    const sel = editor.getSelection()
    const hasSelection = sel && !sel.isEmpty()
    const range = hasSelection ? monaco.Range.lift(sel) : model.getFullModelRange()
    setCmdK({
      selection: range,
      selectedText: model.getValueInRange(range),
      wholeFile: !hasSelection,
    })
    setCmdKInput('')
    setCmdKError('')
  }, [])

  const submitCmdK = useCallback(async () => {
    const path = activePathRef.current
    const state = cmdK
    if (!state || !path || !cmdKInput.trim() || cmdKBusy) return
    setCmdKBusy(true)
    setCmdKError('')
    cmdKAbort.current = new AbortController()
    try {
      const rewritten = await inlineEdit({
        settings: settingsRef.current,
        code: state.selectedText,
        instruction: cmdKInput.trim(),
        language: languageForPath(path),
        filePath: path,
        signal: cmdKAbort.current.signal,
      })
      const model = editorRef.current?.getModel()
      const original = model ? model.getValue() : (getFile(path)?.content ?? '')
      let modified: string
      if (state.wholeFile || !model) {
        modified = rewritten
      } else {
        const before = model.getOffsetAt(state.selection.getStartPosition())
        const after = model.getOffsetAt(state.selection.getEndPosition())
        modified = original.slice(0, before) + rewritten + original.slice(after)
      }
      setPendingEdit({ path, original, modified })
      setCmdK(null)
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setCmdKError(err instanceof Error ? err.message : String(err))
      }
    } finally {
      setCmdKBusy(false)
    }
  }, [cmdK, cmdKInput, cmdKBusy, getFile])

  const handleMount = useCallback(
    (editor: IStandaloneCodeEditor) => {
      editorRef.current = editor
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => openCmdK())
      editor.onDidChangeCursorPosition((e) => {
        setCursorPos({ line: e.position.lineNumber, col: e.position.column })
      })
      editor.focus()
    },
    [openCmdK, setCursorPos],
  )

  // AI ghost-text completions (registered once, reads live state via refs)
  useEffect(() => {
    const disposable = monaco.languages.registerInlineCompletionsProvider('*', {
      provideInlineCompletions: async (model, position, _context, token) => {
        const s = settingsRef.current
        const path = activePathRef.current
        if (!s.autocompleteEnabled || !s.apiKey || !path) return { items: [] }
        // Debounce: wait out rapid typing before paying for a request
        await new Promise((r) => setTimeout(r, 450))
        if (token.isCancellationRequested) return { items: [] }
        const offset = model.getOffsetAt(position)
        const value = model.getValue()
        const abort = new AbortController()
        token.onCancellationRequested(() => abort.abort())
        try {
          const text = await autocomplete({
            settings: s,
            prefix: value.slice(0, offset),
            suffix: value.slice(offset),
            language: languageForPath(path),
            filePath: path,
            signal: abort.signal,
          })
          if (!text.trim() || token.isCancellationRequested) return { items: [] }
          return {
            items: [
              {
                insertText: text,
                range: new monaco.Range(
                  position.lineNumber, position.column,
                  position.lineNumber, position.column,
                ),
              },
            ],
          }
        } catch {
          return { items: [] }
        }
      },
      freeInlineCompletions: () => {},
    })
    return () => disposable.dispose()
  }, [])

  // Reveal a line requested by search results / palette
  useEffect(() => {
    if (!pendingReveal || pendingReveal.path !== activePath) return
    const editor = editorRef.current
    if (!editor) return
    editor.revealLineInCenter(pendingReveal.line)
    editor.setPosition({ lineNumber: pendingReveal.line, column: 1 })
    editor.focus()
    consumeReveal()
  }, [pendingReveal, activePath, consumeReveal])

  return (
    <div className="editor-pane">
      <div className="tab-bar">
        {openTabs.map((path) => (
          <div
            key={path}
            className={`tab ${path === activePath ? 'active' : ''}`}
            onClick={() => setActivePath(path)}
          >
            <span className="tab-name">{path.split('/').pop()}</span>
            <button
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation()
                closeTab(path)
              }}
            >
              <CloseIcon size={12} />
            </button>
          </div>
        ))}
      </div>

      <div className="editor-host">
        {file && activePath ? (
          <Editor
            path={activePath}
            language={languageForPath(activePath)}
            value={file.content}
            theme="cursor-dark"
            onMount={handleMount}
            onChange={(value) => writeFile(activePath, value ?? '')}
            options={{
              fontSize: 13.5,
              fontFamily: "'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
              minimap: { enabled: true, renderCharacters: false },
              automaticLayout: true,
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              inlineSuggest: { enabled: true },
              padding: { top: 8 },
              renderLineHighlight: 'all',
            }}
          />
        ) : (
          <div className="editor-welcome">
            <div className="welcome-logo">⌘</div>
            <div className="welcome-rows">
              <div><kbd>Ctrl</kbd>+<kbd>P</kbd> Open file</div>
              <div><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> Command palette</div>
              <div><kbd>Ctrl</kbd>+<kbd>K</kbd> AI inline edit</div>
              <div><kbd>Ctrl</kbd>+<kbd>L</kbd> Toggle AI chat</div>
              <div><kbd>Ctrl</kbd>+<kbd>`</kbd> Terminal</div>
            </div>
          </div>
        )}

        {cmdK && (
          <div className="cmdk-overlay">
            <div className="cmdk-box">
              <span className="cmdk-icon"><SparkleIcon /></span>
              <input
                autoFocus
                placeholder={
                  cmdK.wholeFile
                    ? 'Edit file… (e.g. "add error handling")'
                    : 'Edit selection… (e.g. "memoize this function")'
                }
                value={cmdKInput}
                disabled={cmdKBusy}
                onChange={(e) => setCmdKInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void submitCmdK()
                  if (e.key === 'Escape') {
                    cmdKAbort.current?.abort()
                    setCmdK(null)
                  }
                }}
              />
              {cmdKBusy ? (
                <span className="cmdk-status">Generating…</span>
              ) : (
                <span className="cmdk-hint">↵ submit · esc cancel</span>
              )}
            </div>
            {cmdKError && <div className="cmdk-error">{cmdKError}</div>}
          </div>
        )}
      </div>

      {pendingEdit && (
        <div className="modal-backdrop">
          <div className="diff-modal">
            <div className="diff-modal-header">
              <span>
                <SparkleIcon size={14} /> Review AI edit — {pendingEdit.path}
              </span>
              <span className="diff-modal-actions">
                <button className="btn-accept" onClick={() => {
                  writeFile(pendingEdit.path, pendingEdit.modified)
                  setPendingEdit(null)
                }}>
                  Accept ✓
                </button>
                <button className="btn-reject" onClick={() => setPendingEdit(null)}>
                  Reject ✕
                </button>
              </span>
            </div>
            <div className="diff-modal-body">
              <DiffEditor
                original={pendingEdit.original}
                modified={pendingEdit.modified}
                language={languageForPath(pendingEdit.path)}
                theme="cursor-dark"
                options={{
                  readOnly: true,
                  renderSideBySide: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  automaticLayout: true,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
