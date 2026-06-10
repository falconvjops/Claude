import type { VFile } from '../types'

export const SAMPLE_PROJECT: VFile[] = [
  {
    path: 'README.md',
    content: `# demo-project

A sample workspace to explore this Cursor replica.

## Features to try

- **Chat** (right panel): ask questions about your code, use \`@\` to attach files.
- **Cmd/Ctrl+K** in the editor: describe an edit, review the diff, accept or reject.
- **Tab autocomplete**: AI ghost-text suggestions as you type (needs an API key).
- **Ctrl+P**: quick-open files. **Ctrl+Shift+P**: command palette.
- **Ctrl+Shift+F**: search across all files.
- **Terminal** (bottom panel): \`ls\`, \`cat\`, \`cd\`, \`pwd\`, \`echo\`, \`clear\`, \`help\`.

Set your Anthropic API key in Settings (gear icon, bottom-left) to enable AI features.
Without a key, the AI features run in demo mode.
`,
  },
  {
    path: 'src/index.ts',
    content: `import { fibonacci } from './math'
import { greet } from './utils/greet'

function main() {
  console.log(greet('world'))
  for (let i = 0; i < 10; i++) {
    console.log(\`fib(\${i}) = \${fibonacci(i)}\`)
  }
}

main()
`,
  },
  {
    path: 'src/math.ts',
    content: `/** Naive recursive fibonacci - try asking the AI to memoize it! */
export function fibonacci(n: number): number {
  if (n <= 1) return n
  return fibonacci(n - 1) + fibonacci(n - 2)
}

export function factorial(n: number): number {
  return n <= 1 ? 1 : n * factorial(n - 1)
}
`,
  },
  {
    path: 'src/utils/greet.ts',
    content: `export function greet(name: string): string {
  return \`Hello, \${name}!\`
}
`,
  },
  {
    path: 'src/server.py',
    content: `from http.server import BaseHTTPRequestHandler, HTTPServer
import json


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"status": "ok"}).encode())


def run(port: int = 8000) -> None:
    server = HTTPServer(("", port), Handler)
    print(f"Listening on :{port}")
    server.serve_forever()


if __name__ == "__main__":
    run()
`,
  },
  {
    path: 'styles/app.css',
    content: `:root {
  --bg: #1e1e1e;
  --fg: #d4d4d4;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: system-ui, sans-serif;
}
`,
  },
  {
    path: 'package.json',
    content: `{
  "name": "demo-project",
  "version": "1.0.0",
  "scripts": {
    "start": "ts-node src/index.ts"
  }
}
`,
  },
]
