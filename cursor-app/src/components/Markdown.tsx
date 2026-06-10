import { Fragment, useMemo, useState, type ReactNode } from 'react'

interface CodeBlock {
  type: 'code'
  lang: string
  path?: string
  code: string
}

interface TextBlock {
  type: 'text'
  text: string
}

type Block = CodeBlock | TextBlock

/** Split markdown into text and fenced code blocks. Fence info may carry `path=...`. */
function parseBlocks(markdown: string): Block[] {
  const blocks: Block[] = []
  const fence = /```([^\n]*)\n([\s\S]*?)(?:```|$)/g
  let last = 0
  let match: RegExpExecArray | null
  while ((match = fence.exec(markdown)) !== null) {
    if (match.index > last) blocks.push({ type: 'text', text: markdown.slice(last, match.index) })
    const info = match[1].trim()
    const pathMatch = info.match(/path=(\S+)/)
    blocks.push({
      type: 'code',
      lang: info.split(/\s+/)[0] || '',
      path: pathMatch?.[1],
      code: match[2].replace(/\n$/, ''),
    })
    last = fence.lastIndex
  }
  if (last < markdown.length) blocks.push({ type: 'text', text: markdown.slice(last) })
  return blocks
}

/** Minimal safe inline rendering: `code`, **bold**. Everything is text nodes - no HTML injection. */
function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return <code key={i}>{part.slice(1, -1)}</code>
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}

function TextChunk({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="md-text">
      {lines.map((line, i) => {
        const heading = line.match(/^(#{1,4})\s+(.*)/)
        if (heading) {
          return (
            <div key={i} className={`md-h md-h${heading[1].length}`}>
              {renderInline(heading[2])}
            </div>
          )
        }
        const bullet = line.match(/^\s*[-*]\s+(.*)/)
        if (bullet) {
          return (
            <div key={i} className="md-li">
              <span className="md-bullet">•</span> {renderInline(bullet[1])}
            </div>
          )
        }
        if (!line.trim()) return <div key={i} className="md-gap" />
        return <div key={i}>{renderInline(line)}</div>
      })}
    </div>
  )
}

function CodeChunk({
  block,
  onApply,
}: {
  block: CodeBlock
  onApply?: (path: string | undefined, code: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const [applied, setApplied] = useState(false)
  return (
    <div className="md-code">
      <div className="md-code-header">
        <span className="md-code-lang">{block.path ?? block.lang ?? 'code'}</span>
        <span className="md-code-actions">
          <button
            onClick={() => {
              void navigator.clipboard.writeText(block.code)
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            }}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
          {onApply && (
            <button
              className="md-apply"
              onClick={() => {
                onApply(block.path, block.code)
                setApplied(true)
                setTimeout(() => setApplied(false), 1500)
              }}
            >
              {applied ? 'Applied ✓' : 'Apply'}
            </button>
          )}
        </span>
      </div>
      <pre>{block.code}</pre>
    </div>
  )
}

export function Markdown({
  content,
  onApply,
}: {
  content: string
  onApply?: (path: string | undefined, code: string) => void
}) {
  const blocks = useMemo(() => parseBlocks(content), [content])
  return (
    <div className="markdown">
      {blocks.map((b, i) =>
        b.type === 'text' ? (
          <TextChunk key={i} text={b.text} />
        ) : (
          <CodeChunk key={i} block={b} onApply={onApply} />
        ),
      )}
    </div>
  )
}
