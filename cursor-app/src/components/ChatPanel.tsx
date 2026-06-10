import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../state/store'
import { streamChat } from '../ai/client'
import { MODELS, type ChatMessage } from '../types'
import { Markdown } from './Markdown'
import { CloseIcon, SendIcon, SparkleIcon, StopIcon } from './icons'

export function ChatPanel() {
  const {
    files, activePath, openFile, writeFile, settings, updateSettings,
    chatMessages, setChatMessages, chatMode, setChatMode, setChatVisible,
  } = useStore()

  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState<string[]>([])
  const [streaming, setStreaming] = useState(false)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [chatMessages])

  const mentionMatches = useMemo(() => {
    if (mentionQuery === null) return []
    const q = mentionQuery.toLowerCase()
    return files
      .filter((f) => f.path.toLowerCase().includes(q) && !attachments.includes(f.path))
      .slice(0, 8)
  }, [mentionQuery, files, attachments])

  function handleInputChange(value: string) {
    setInput(value)
    const m = value.match(/@([\w./-]*)$/)
    setMentionQuery(m ? m[1] : null)
  }

  function pickMention(path: string) {
    setAttachments((a) => [...a, path])
    setInput((v) => v.replace(/@[\w./-]*$/, ''))
    setMentionQuery(null)
    inputRef.current?.focus()
  }

  async function send() {
    const text = input.trim()
    if (!text || streaming) return
    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      attachments: attachments.length ? [...attachments] : undefined,
    }
    const history = [...chatMessages, userMsg]
    setChatMessages([...history, { role: 'assistant', content: '' }])
    setInput('')
    setAttachments([])
    setMentionQuery(null)
    setStreaming(true)
    abortRef.current = new AbortController()
    try {
      await streamChat({
        settings,
        mode: chatMode,
        messages: history,
        files,
        signal: abortRef.current.signal,
        onText: (chunk) => {
          setChatMessages((prev) => {
            const next = [...prev]
            const last = next[next.length - 1]
            next[next.length - 1] = { ...last, content: last.content + chunk }
            return next
          })
        },
      })
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === 'AbortError'
      if (!aborted) {
        const msg = err instanceof Error ? err.message : String(err)
        setChatMessages((prev) => {
          const next = [...prev]
          const last = next[next.length - 1]
          next[next.length - 1] = {
            ...last,
            content: `${last.content}\n\n**Error:** ${msg}`,
          }
          return next
        })
      }
    } finally {
      setStreaming(false)
    }
  }

  function applyBlock(path: string | undefined, code: string) {
    const target = path ?? activePath
    if (!target) return
    writeFile(target, code.endsWith('\n') ? code : code + '\n')
    openFile(target)
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <span className="chat-title">
          <SparkleIcon size={14} /> Chat
        </span>
        <span className="chat-header-actions">
          <button title="New chat" onClick={() => setChatMessages([])}>＋</button>
          <button title="Close" onClick={() => setChatVisible(false)}>
            <CloseIcon size={13} />
          </button>
        </span>
      </div>

      <div className="chat-messages" ref={scrollRef}>
        {chatMessages.length === 0 && (
          <div className="chat-empty">
            <SparkleIcon size={28} />
            <p>Ask anything about your code.</p>
            <p className="chat-empty-hint">
              Use <code>@</code> to attach files. Switch between <b>Agent</b> (proposes file
              edits you can apply) and <b>Ask</b> (answers questions).
            </p>
          </div>
        )}
        {chatMessages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role}`}>
            <div className="chat-msg-role">{m.role === 'user' ? 'You' : 'Cursor'}</div>
            {m.attachments && (
              <div className="chat-attachments">
                {m.attachments.map((a) => (
                  <span key={a} className="chip">@{a}</span>
                ))}
              </div>
            )}
            {m.role === 'assistant' ? (
              <Markdown content={m.content} onApply={applyBlock} />
            ) : (
              <div className="chat-user-text">{m.content}</div>
            )}
            {m.role === 'assistant' && !m.content && streaming && i === chatMessages.length - 1 && (
              <div className="chat-thinking">Thinking…</div>
            )}
          </div>
        ))}
      </div>

      <div className="chat-composer">
        {attachments.length > 0 && (
          <div className="chat-attachments composer-chips">
            {attachments.map((a) => (
              <span key={a} className="chip">
                @{a}
                <button onClick={() => setAttachments((x) => x.filter((p) => p !== a))}>×</button>
              </span>
            ))}
          </div>
        )}
        {mentionQuery !== null && mentionMatches.length > 0 && (
          <div className="mention-popup">
            {mentionMatches.map((f) => (
              <div key={f.path} className="mention-item" onMouseDown={() => pickMention(f.path)}>
                {f.path}
              </div>
            ))}
          </div>
        )}
        <textarea
          ref={inputRef}
          rows={3}
          placeholder={chatMode === 'agent' ? 'Plan, build, or fix anything… (@ to add files)' : 'Ask about your code… (@ to add files)'}
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && mentionQuery === null) {
              e.preventDefault()
              void send()
            }
            if (e.key === 'Enter' && mentionQuery !== null && mentionMatches.length > 0) {
              e.preventDefault()
              pickMention(mentionMatches[0].path)
            }
            if (e.key === 'Escape') setMentionQuery(null)
          }}
        />
        <div className="chat-composer-bar">
          <div className="composer-left">
            <select
              className="mode-select"
              value={chatMode}
              onChange={(e) => setChatMode(e.target.value as 'agent' | 'ask')}
            >
              <option value="agent">∞ Agent</option>
              <option value="ask">? Ask</option>
            </select>
            <select
              className="model-select"
              value={settings.model}
              onChange={(e) => updateSettings({ model: e.target.value })}
            >
              {MODELS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          {streaming ? (
            <button className="send-btn stop" title="Stop" onClick={() => abortRef.current?.abort()}>
              <StopIcon size={14} />
            </button>
          ) : (
            <button className="send-btn" title="Send (Enter)" onClick={() => void send()}>
              <SendIcon size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
