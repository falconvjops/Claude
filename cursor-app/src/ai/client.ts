import Anthropic from '@anthropic-ai/sdk'
import type { ChatMessage, ChatMode, Settings, VFile } from '../types'
import {
  AGENT_SYSTEM,
  ASK_SYSTEM,
  autocompleteSystem,
  fileContextBlock,
  inlineEditSystem,
} from './prompts'

function makeClient(apiKey: string): Anthropic {
  // Browser-side usage: the key is the user's own, entered in Settings and kept in
  // localStorage. The SDK requires this explicit opt-in for browser environments.
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
}

function toApiMessages(messages: ChatMessage[], files: VFile[]): Anthropic.MessageParam[] {
  return messages.map((m) => {
    if (m.role === 'user' && m.attachments?.length) {
      const blocks = m.attachments
        .map((path) => {
          const f = files.find((x) => x.path === path)
          return f ? fileContextBlock(f.path, f.content) : null
        })
        .filter(Boolean)
        .join('\n\n')
      return { role: 'user' as const, content: `${blocks}\n\n${m.content}` }
    }
    return { role: m.role, content: m.content }
  })
}

const DEMO_CHAT_REPLY = `**Demo mode** - no API key is configured.

I can't reach the Claude API yet, so here's what you're missing out on:

- Ask questions about any file (attach files with \`@\`)
- In **Agent** mode I propose complete file edits you can apply with one click
- **Cmd/Ctrl+K** in the editor rewrites selected code from an instruction
- **Tab** autocomplete suggests code as you type

To enable all of this, open **Settings** (gear icon in the bottom-left) and paste an
Anthropic API key. Keys are stored only in your browser's localStorage and requests go
directly to the Anthropic API.`

async function streamMock(text: string, onText: (chunk: string) => void): Promise<void> {
  const words = text.split(/(?<=\s)/)
  for (const w of words) {
    onText(w)
    await new Promise((r) => setTimeout(r, 12))
  }
}

export interface StreamChatOptions {
  settings: Settings
  mode: ChatMode
  messages: ChatMessage[]
  files: VFile[]
  onText: (chunk: string) => void
  signal?: AbortSignal
}

export async function streamChat(opts: StreamChatOptions): Promise<void> {
  const { settings, mode, messages, files, onText, signal } = opts
  if (!settings.apiKey) {
    await streamMock(DEMO_CHAT_REPLY, onText)
    return
  }
  const client = makeClient(settings.apiKey)
  const stream = client.messages.stream(
    {
      model: settings.model,
      max_tokens: 16000,
      system: mode === 'agent' ? AGENT_SYSTEM : ASK_SYSTEM,
      messages: toApiMessages(messages, files),
    },
    { signal },
  )
  stream.on('text', onText)
  await stream.finalMessage()
}

export interface InlineEditOptions {
  settings: Settings
  code: string
  instruction: string
  language: string
  filePath: string
  signal?: AbortSignal
}

export async function inlineEdit(opts: InlineEditOptions): Promise<string> {
  const { settings, code, instruction, language, filePath, signal } = opts
  if (!settings.apiKey) {
    return `// Demo mode: set an API key in Settings to enable AI edits.\n// Instruction was: ${instruction}\n${code}`
  }
  const client = makeClient(settings.apiKey)
  const stream = client.messages.stream(
    {
      model: settings.model,
      max_tokens: 16000,
      system: inlineEditSystem(language, filePath),
      messages: [
        {
          role: 'user',
          content: `Instruction: ${instruction}\n\nCode to rewrite:\n${code}`,
        },
      ],
    },
    { signal },
  )
  const message = await stream.finalMessage()
  let text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
  // Strip accidental markdown fences despite the system prompt
  text = text.replace(/^```[^\n]*\n/, '').replace(/\n```\s*$/, '')
  return text
}

export interface AutocompleteOptions {
  settings: Settings
  prefix: string
  suffix: string
  language: string
  filePath: string
  signal?: AbortSignal
}

export async function autocomplete(opts: AutocompleteOptions): Promise<string> {
  const { settings, prefix, suffix, language, filePath, signal } = opts
  if (!settings.apiKey) return ''
  const client = makeClient(settings.apiKey)
  // Haiku for ghost text: completion is latency-sensitive and simple
  const response = await client.messages.create(
    {
      model: 'claude-haiku-4-5',
      max_tokens: 256,
      system: autocompleteSystem(language, filePath),
      messages: [
        {
          role: 'user',
          content: `<before_cursor>\n${prefix.slice(-3000)}\n</before_cursor>\n<after_cursor>\n${suffix.slice(0, 1000)}\n</after_cursor>`,
        },
      ],
    },
    { signal },
  )
  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
}
