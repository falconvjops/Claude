# CLAUDE.md

This file provides guidance for AI assistants (Claude Code and similar tools) working in this repository.

## Repository Overview

**Name:** Claude
**Description:** Everything Claude.
**Owner:** falconvjops
**Primary branch:** `master`

This is a general-purpose repository focused on Claude-related work. As the repository grows, this file should be updated to reflect the actual structure and conventions.

## Repository Structure

```
Claude/
├── CLAUDE.md        # This file — AI assistant guidance
└── README.md        # Project overview
```

As files and directories are added, document them here with a brief description of their purpose.

## Development Workflow

### Branching

- Main branch: `master`
- Feature/task branches follow the pattern: `claude/<description>-<session-id>`
- Always develop on the designated feature branch, never directly on `master`

### Making Changes

1. Ensure you are on the correct feature branch before making any edits
2. Make focused, minimal changes — only what is directly requested
3. Commit with clear, descriptive messages that explain the *why*, not just the *what*
4. Push with: `git push -u origin <branch-name>`

### Commit Message Style

```
<type>: <short summary>

<optional body explaining context or motivation>
```

Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

Example:
```
docs: add CLAUDE.md with project conventions

Establishes baseline guidance for AI assistants working in this
repository, covering structure, workflow, and coding conventions.
```

### Git Operations

- Always push to the branch you are working on — never force-push or rebase published commits without explicit permission
- Do not skip pre-commit hooks (`--no-verify`)
- Prefer creating new commits over amending existing ones

## Coding Conventions

As code is added to this repository, document language-specific conventions here. General principles to follow until then:

- **Simplicity first:** Write the minimum code needed. Avoid over-engineering, premature abstractions, and unnecessary features.
- **No unnecessary files:** Prefer editing existing files over creating new ones.
- **No speculative additions:** Do not add error handling, fallbacks, or features for hypothetical future requirements.
- **Security:** Avoid introducing vulnerabilities (XSS, SQL injection, command injection, etc.). Validate at system boundaries only.
- **No backward-compat shims:** Remove unused code completely rather than commenting it out or aliasing it.

## Workflow Orchestration

### 1. Plan Mode Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy

- Use subagents liberally to keep the main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop

- After ANY correction from the user: update `tasks/lessons.md`
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project context

### 4. Verification Before Done

- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Working with AI Assistants

### Before Making Changes

- Read files before editing them — understand existing code first
- For broad exploration, use codebase search tools before jumping to edits
- When requirements are ambiguous, ask for clarification before implementing

### Scope of Changes

- Only make changes that are directly requested or clearly necessary
- Do not add docstrings, comments, or type annotations to code you didn't change
- Do not refactor surrounding code while fixing a bug
- Three similar lines is better than a premature abstraction

### Risky Operations

Always confirm with the user before:
- Deleting files or branches
- Force-pushing
- Modifying CI/CD configuration
- Any action visible to others (pushing, creating PRs, posting to external services)

## Updating This File

This file should be updated whenever:
- New directories or significant files are added to the repository
- Language/framework choices are made
- Testing, linting, or build tooling is introduced
- Coding conventions are established or changed

Keep this file accurate and concise — it is a living document.
