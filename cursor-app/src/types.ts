export interface VFile {
  path: string
  content: string
}

export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
  /** Files attached as context via @-mentions (user messages only) */
  attachments?: string[]
}

export type ChatMode = 'agent' | 'ask'

export interface Settings {
  apiKey: string
  model: string
  autocompleteEnabled: boolean
}

export const MODELS = [
  'claude-opus-4-8',
  'claude-sonnet-4-6',
  'claude-haiku-4-5',
] as const

export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  model: 'claude-opus-4-8',
  autocompleteEnabled: true,
}

export type SidebarView = 'explorer' | 'search' | 'git' | 'extensions'

export interface SearchResult {
  path: string
  line: number
  preview: string
}
