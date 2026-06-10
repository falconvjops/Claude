# Task: Build a Cursor app replica

A web-based replica of the Cursor AI code editor, built with Vite + React + TypeScript +
Monaco, living in `cursor-app/`. AI features call the Anthropic Messages API from the
browser (official `@anthropic-ai/sdk`, streaming, `claude-opus-4-8` default) with a mock
fallback when no API key is configured.

## Plan

- [x] Scaffold Vite + React + TS app in `cursor-app/` (npm install, Monaco bundled locally)
- [x] Core editor shell: title bar, activity bar, sidebar, editor tabs, status bar (Cursor dark theme)
- [x] Virtual file system (sample project, persisted to localStorage) + file explorer with create/rename/delete
- [x] Monaco editor with tabs, language detection, per-file models
- [x] AI chat panel (right side): Agent/Ask modes, model selector, streaming responses, @file context mentions, apply code blocks to editor
- [x] Cmd+K inline edit: prompt bar in editor, AI rewrite with accept/reject diff (Monaco DiffEditor)
- [x] Tab autocomplete: ghost-text suggestions (claude-haiku-4-5, debounced, cancellable)
- [x] Command palette (Ctrl+Shift+P) and quick file open (Ctrl+P)
- [x] Global search (Ctrl+Shift+F)
- [x] Integrated terminal panel (simulated shell: ls/cat/cd/pwd/echo/clear/reset/help)
- [x] Settings panel: API key, model selection, autocomplete toggle
- [x] Verify: `npm run build` passes (tsc strict + vite), production build serves
- [x] Commit and push to `claude/cursor-app-replica-sma9v7`

## Review

- App lives entirely in `cursor-app/`; no backend — the Anthropic SDK runs in the
  browser with `dangerouslyAllowBrowser` and the user's own key (localStorage only).
- Verified: `tsc -b` strict type-check clean, `vite build` succeeds, production
  preview serves index + bundle (HTTP 200). A headless-browser render check was not
  possible (browser downloads blocked by the sandbox network policy).
- Demo mode keeps every flow exercisable without an API key: chat streams a canned
  explanation, Cmd+K returns the original code annotated with the instruction.
- Markdown in chat is rendered with a minimal hand-rolled parser using React text
  nodes only (no innerHTML) to avoid XSS from model output.
- Monaco is bundled from npm (workers via Vite `?worker`) so the app works offline —
  no CDN dependency.
