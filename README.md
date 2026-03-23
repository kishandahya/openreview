# OpenReview

AI-powered code review for GitHub pull requests. Devin Review-style 3-column dark UI with semantic file grouping, bug detection, auto-fix suggestions, and chat.

## Quick Start

```bash
# Install
bun install

# Start dev server (backend + frontend)
bun run dev

# Or use the CLI
bun run packages/cli/bin/openreview.ts https://github.com/owner/repo/pull/123
```

## Environment Variables

```bash
# LLM Provider (choose one)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# GitHub (optional, for private repos)
GITHUB_TOKEN=ghp_...
```

## Architecture

```
packages/
  core/     — Review engine: types, pipeline, LLM, GitHub fetcher
  server/   — Hono API server with SSE streaming
  web/      — SolidJS frontend (Devin-style 3-column dark UI)
  cli/      — CLI entry point (openreview <pr-url>)
  plugin/   — opencode plugin wrapper (opencode-review)
```

### As an opencode Plugin

Install in your opencode config:

```jsonc
{
  "plugin": ["opencode-review"]
}
```

Or drop `packages/plugin/src/index.ts` into `.opencode/tool/review.ts`.

### Standalone CLI

```bash
# Interactive (opens browser)
openreview https://github.com/facebook/react/pull/36125

# Headless (JSON output, CI-friendly)
openreview --headless https://github.com/facebook/react/pull/36125
```

## Review Pipeline

1. **Context** — Fetch PR metadata + file diffs via GitHub API
2. **Copy/Move** — Detect renamed/copied files via Jaccard similarity
3. **Semantic** — LLM groups files by logical purpose
4. **Bugs** — 2-pass detection (critical + informational)
5. **Fix** — Auto-generate fix suggestions for high-confidence findings
6. **Drift** — Check if changes match PR description
7. **Summary** — Pass/fail verdict with confidence score

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/review | Start review |
| GET | /api/review/:id | Get session state |
| GET | /api/review/:id/stream | SSE pipeline events |
| POST | /api/review/:id/chat | Send chat message |
| GET | /api/review/:id/chat/stream | Chat response stream |
| PATCH | /api/review/:id/findings/:fid | Toggle finding resolved |
| GET | /api/review/:id/export | Export JSON or Markdown |
