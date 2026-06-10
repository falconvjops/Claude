# Cursor App Replica

A web-based replica of the [Cursor](https://cursor.com) AI code editor, built with
React, TypeScript, Vite, and Monaco. AI features are powered by the Anthropic API
(official `@anthropic-ai/sdk`, called directly from the browser with streaming).

![stack](https://img.shields.io/badge/stack-React%20%2B%20TS%20%2B%20Vite%20%2B%20Monaco-blue)

## Run it

```sh
cd cursor-app
npm install
npm run dev      # http://localhost:5173
```

Production build: `npm run build` (output in `dist/`, serve with `npm run preview`).

## Features

| Feature | How to use |
| --- | --- |
| **AI Chat** (Agent / Ask modes) | Right panel, or `Ctrl+L`. Streaming responses, model selector. |
| **@ file mentions** | Type `@` in the chat composer to attach workspace files as context. |
| **Apply code blocks** | In Agent mode the AI emits complete files (` ```ts path=src/x.ts `); click **Apply** to write them into the workspace. |
| **Cmd/Ctrl+K inline edit** | Select code (or nothing for the whole file), press `Ctrl+K`, describe the edit, review the side-by-side diff, Accept/Reject. |
| **Tab autocomplete** | AI ghost-text suggestions while typing (uses `claude-haiku-4-5` for latency; toggle in Settings). |
| **File explorer** | Create, rename, delete files. Workspace persists to localStorage. |
| **Quick open** | `Ctrl+P` |
| **Command palette** | `Ctrl+Shift+P` |
| **Global search** | `Ctrl+Shift+F`, results jump to file:line. |
| **Integrated terminal** | `` Ctrl+` `` — simulated shell over the virtual workspace (`ls`, `cat`, `cd`, `pwd`, `echo`, `clear`, `reset`, `help`). |
| **Editor** | Monaco with a Cursor-style dark theme, tabs, minimap, per-file undo stacks. |

## AI setup

Open **Settings** (gear icon in the activity bar or the status bar entry) and paste an
Anthropic API key. The key is stored only in your browser's localStorage and requests
go directly from your browser to the Anthropic API (`dangerouslyAllowBrowser` — your
key never touches any server of ours, because there is no server).

- Default chat model: `claude-opus-4-8` (switchable to `claude-sonnet-4-6` / `claude-haiku-4-5`)
- Without a key, AI features run in a demo mode that explains what they would do.

## Architecture

```
src/
├── ai/            Anthropic client wrapper (chat streaming, inline edit, autocomplete) + prompts
├── fs/            Virtual file system (localStorage), sample project, tree/search helpers
├── state/         Single React context store (files, tabs, panels, settings, chat)
├── components/    TitleBar, ActivityBar, Sidebar, EditorPane, ChatPanel,
│                  TerminalPanel, StatusBar, CommandPalette, SettingsModal, Markdown
└── monacoSetup.ts Bundled Monaco workers + "cursor-dark" theme
```

Everything runs client-side; there is no backend.
