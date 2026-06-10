import * as monaco from 'monaco-editor'
import { loader } from '@monaco-editor/react'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    switch (label) {
      case 'json':
        return new jsonWorker()
      case 'css':
      case 'scss':
      case 'less':
        return new cssWorker()
      case 'html':
      case 'handlebars':
      case 'razor':
        return new htmlWorker()
      case 'typescript':
      case 'javascript':
        return new tsWorker()
      default:
        return new editorWorker()
    }
  },
}

monaco.editor.defineTheme('cursor-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'c678dd' },
    { token: 'string', foreground: '98c379' },
    { token: 'number', foreground: 'd19a66' },
    { token: 'type', foreground: 'e5c07b' },
    { token: 'function', foreground: '61afef' },
  ],
  colors: {
    'editor.background': '#1a1a1a',
    'editor.foreground': '#d4d4d4',
    'editor.lineHighlightBackground': '#222222',
    'editorLineNumber.foreground': '#4b4b4b',
    'editorLineNumber.activeForeground': '#9b9b9b',
    'editorCursor.foreground': '#d4d4d4',
    'editor.selectionBackground': '#264f78',
    'editorIndentGuide.background1': '#2a2a2a',
    'editorWidget.background': '#202020',
    'editorWidget.border': '#3c3c3c',
    'editorSuggestWidget.background': '#202020',
    'editorGhostText.foreground': '#6e6e6e',
  },
})

// Don't red-squiggle the sample project: the virtual workspace has no real
// module resolution, so semantic errors would be noise.
monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: true,
  noSyntaxValidation: false,
})
monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: true,
  noSyntaxValidation: false,
})

loader.config({ monaco })

export { monaco }
