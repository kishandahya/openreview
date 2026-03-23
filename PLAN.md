# OpenReview: Local AI Code Review Tool

## What We're Building

A local-first, open-source code review tool that combines the best of **Devin Review** (semantic diffs, bug detection, auto-fix), **gstack /review** (two-pass checklist, fix-first heuristic, scope drift), and **Codex CLI** (structured JSON findings, pass/fail gate). User runs `openreview <pr-url>`, a web UI opens with an interactive review experience.

## Visual Reference — Devin Review UI (from live screenshots)

Screenshots captured from `app.devin.ai/review/facebook/react/pull/36125` and `devinreview.com/sst/opencode/pull/18609`:

### Reference Screenshots (in `docs/screenshots/`)

**React PR (facebook/react/pull/36125):**
- `devin-full-layout.png` — Full 3-column layout at 1920x1080
- `devin-sidebar.png` — Right sidebar: 6 bugs, 5 flags, checks 11/12
- `devin-bug-detail.png` — Bug detail overlay with explanation + suggested fix
- `devin-bug-clicked.png` — Full view after clicking bug (diff scrolled + detail open)
- `devin-filetree.png` — Left sidebar: semantic sections with numbered groups
- `devin-chat-tab.png` — Chat tab with greeting, suggested prompts, input bar

**OpenCode PR (sst/opencode/pull/18609 — "multi-agent team coordination"):**
- `opencode-full-layout.png` — Full layout: 32 files, +2043 lines, folder tree view
- `opencode-after-analysis.png` — Analysis in progress with activity log in sidebar

### Layout: 3-Column Dark Theme
- **Left sidebar (~15%)**: Semantic file grouping ("View as sections" mode) OR folder tree
  - Numbered sections: "1. Add isCallbackFunction heuristic..." (2 files +139 -2)
  - "2. Add function name prefixes to error messages" (4 files +5 -5)
  - "3. Miscellaneous: documentation and example files" (8 files +583)
  - Each section: title, file count, green/red line counts, "Read explanation" link
  - Toggle between "View as sections" (semantic) and "Folder view" (tree)
- **Center (~55%)**: PR description + code diffs
  - PR header: status badge (Open), repo/PR#, title, branch labels, tabs (Description | Discussion 3 | Commits 1)
  - "Devin's AI analysis" collapsible section with inline summary
  - Standard GitHub-style unified diff with syntax highlighting
  - "Add a comment" buttons on every diff line (left gutter)
  - "Expand comment" buttons for collapsed review comments
  - Diff settings button, "Mark all as viewed" button, per-file collapse/copy/checkbox
- **Right sidebar (~30%)**: Two tabs — "Info" and "Chat"

### Info Tab (Analysis Results)
- **"6 Potential bugs"** — expandable section with bug icon (orange/red)
  - Each finding: title, "Bug" tag (green), file:line reference
  - Example: "isCallbackFunction heuristic suppresses legitimate ref-access-in-render errors — Bug ValidateNoRefAccessInRender.ts:546"
  - Example: "Changed error message breaks production error code 85 in codes.json — Bug ReactBaseClasses.js:63"
  - "Copy all" button per section
- **"5 Flags"** — separate expandable section (different from bugs)
- **Clicking a bug** → scrolls diff to relevant code AND opens inline detail panel:
  - "Potential Bug R546-551" header with line range
  - "Devin" avatar + detailed explanation paragraph
  - Code references as clickable links (e.g., `ValidateNoRefAccessInRender.ts:184-269`)
  - Inline code formatting for identifiers (`isCallbackFunction`, `readRefEffect`, etc.)
  - "Example of suppressed error (previously caught)" — collapsible example
  - "Suggested fix" — code block with fix suggestion
- **Checks**: "11/12" with green/red progress bar
- **Other**: Vercel status (red dot = failing)
- **Reviewers**: "No reviewers"
- **Assignees**: "No assignees"
- **Labels**: "1" → "CLA Signed" badge

### Chat Tab
- "New chat" button + "+" for multiple chat threads
- Initial message: "Hey! I'm Devin. I've reviewed this PR and I'm ready to help. Ask me about the changes, or request edits directly."
- **Suggested prompts** at bottom: "Fix bugs", "Summarize changes", "Explain architecture"
- Input: "Ask anything about this PR..." with send button
- Full height chat panel

### Key Design Patterns Observed
1. **Dark theme** — near-black background (#0d1117-ish), dark gray panels, green accent (#10b981)
2. **Semantic grouping is the default view** — not alphabetical file list
3. **Bug findings are first-class UI** — not buried in comments
4. **Click-to-navigate** — clicking a finding scrolls diff + opens detail
5. **Suggested fix inline** — not in a separate modal
6. **"Ask Devin anything about this PR"** — persistent bottom bar (always visible)
7. **Tabs not panels** — Info/Chat are tab-switched, not split-panel (simpler)
8. **Progress is activity-log style** — "Read ReactTaint.js", "Reported bugs", "Found flags", "Done" → "View results"
9. **No severity colors on the cards** — just "Bug" tag. Simple.
10. **File tree shows line count diffs** — `+107 -1` in green/red next to each file

## Tech Stack

- **Runtime**: Bun
- **Backend**: Hono (HTTP server)
- **Frontend**: React 19 + Vite + TailwindCSS v4 + Radix UI primitives
- **LLM**: Vercel AI SDK (multi-provider: OpenAI, Anthropic, Google, Ollama, OpenRouter)
- **GitHub**: Octokit for PR fetching
- **Diff parsing**: parse-diff
- **Syntax highlighting**: Shiki
- **State management**: Zustand
- **Structured output**: Zod schemas + AI SDK `generateObject`
- **Streaming**: Server-Sent Events (SSE)

## Project Structure

```
openreview/
├── package.json                 # Bun workspace root
├── bunfig.toml
├── tsconfig.json
├── .env.example
│
├── packages/
│   ├── cli/                     # CLI entry point (@openreview/cli)
│   │   ├── src/
│   │   │   ├── index.ts         # Start server, open browser
│   │   │   ├── args.ts          # Arg parsing (pr-url, --port, --headless, --model)
│   │   │   └── config.ts        # Load ~/.openreview/config.toml
│   │   └── bin/openreview.ts    # Shebang entry
│   │
│   ├── core/                    # Core review logic (@openreview/core)
│   │   └── src/
│   │       ├── types/           # Shared types (review, diff, pr, pipeline)
│   │       ├── pr/              # GitHub PR fetcher + local diff parser
│   │       ├── pipeline/        # Review pipeline orchestrator + phases
│   │       │   └── phases/      # semantic-org, bug-detection, auto-fix, scope-drift, summary
│   │       ├── llm/             # LLM provider + prompts + Zod schemas
│   │       ├── instructions/    # REVIEW.md / AGENTS.md loader
│   │       └── session/         # In-memory session store
│   │
│   ├── server/                  # HTTP API (@openreview/server)
│   │   └── src/
│   │       ├── index.ts         # Hono app factory
│   │       ├── routes/          # review, stream (SSE), chat, findings, export
│   │       └── middleware/      # cors, error, logger
│   │
│   └── web/                     # React frontend (@openreview/web)
│       └── src/
│           ├── components/
│           │   ├── layout/      # ReviewLayout (3-panel resizable), Header, StatusBar
│           │   ├── diff/        # DiffViewer, SemanticGroup, DiffFile, DiffHunk, DiffLine
│           │   ├── sidebar/     # AnalysisSidebar, FindingCard, Verdict, ScopeAnalysis
│           │   ├── chat/        # ChatPanel, ChatMessage, ChatInput
│           │   └── common/      # SeverityBadge, PriorityBadge, ConfidenceBar, CodeBlock
│           ├── hooks/           # useReviewStream (SSE), useChat, useReviewSession
│           ├── stores/          # Zustand: review state + UI state
│           └── lib/             # API client, SSE helper, syntax highlighting
```

## Review Pipeline (6 Phases)

```
Input: PR URL or local diff
  │
  ▼
Phase 0: Context Loading (no LLM)
  • Fetch PR data via Octokit (files, diff, metadata)
  • Load instruction files (REVIEW.md, AGENTS.md, CLAUDE.md, etc.)
  • Parse and normalize unified diff
  │
  ▼
Phase 1: Copy/Move Detection (heuristic + lightweight LLM)
  • Compare deleted+added files for similarity (>60% = move, >80% = copy)
  • Clean display instead of confusing delete+insert diffs
  │
  ▼
Phase 2: Semantic Organization (LLM generateObject)
  • Group changed files by logical purpose (not alphabetical)
  • Order groups by importance, explain each group
  • Output: SemanticGroup[] with title, description, file list
  │
  ▼
Phase 3: Bug Detection - Two Pass (LLM generateObject)
  • Pass 1 (Critical): logic errors, security, data loss, crashes, race conditions
  • Pass 2 (Informational): style, naming, test gaps, performance
  • Adversarial intensity scales by diff size (gstack approach)
  • Output: Finding[] with severity (severe/non-severe/investigate/informational),
    priority (P0-P3), confidence score (0-1), code location
  │
  ▼
Phase 4: Auto-Fix Generation (LLM generateObject, conditional)
  • For findings with confidence > 0.7, generate fix suggestions
  • Classify: mechanical (auto-applicable) vs judgment call (ask user)
  • Fix-First heuristic from gstack
  │
  ▼
Phase 5: Scope Drift Detection (LLM generateObject)
  • Compare PR title/description intent vs actual changes
  • Flag out-of-scope modifications
  │
  ▼
Phase 6: Summary & Verdict (LLM generateObject)
  • Aggregate findings → pass/fail gate (Codex style)
  • Overall confidence score, human-readable summary
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/review | Start review (prUrl or localDiff) |
| GET | /api/review/:id | Get session state |
| GET | /api/review/:id/stream | SSE: pipeline progress, findings, groups |
| POST | /api/review/:id/chat | Send chat message |
| GET | /api/review/:id/chat/stream | SSE: chat response |
| PATCH | /api/review/:id/findings/:fid | Resolve/unresolve finding |
| GET | /api/review/:id/export | Export as JSON or Markdown |

## Web UI Layout (Matches Devin Review)

```
┌──────────────────────────────────────────────────────────────────┐
│  OpenReview   Home  Review  Docs                      [Settings] │
├─────────┬──────────────────────────────────┬─────────────────────┤
│ File    │  PR #36125                        │  [Info] [Chat]      │
│ Nav     │  ┌──────────────────────────────┐ │  ┌─────────────────┐│
│         │  │ ● Open  repo/org PR #N       │ │  │ 6 Potential bugs││
│ [Sect]  │  │ Fix: description...          │ │  │ ────────────────││
│ [Tree]  │  │ branch ← main               │ │  │ 🐛 Bug title    ││
│         │  │ [Desc] [Discussion] [Commits]│ │  │    Bug file:ln  ││
│ 1. Core │  ├──────────────────────────────┤ │  │ 🐛 Bug title    ││
│  file.ts│  │ Devin's AI analysis ▼        │ │  │    Bug file:ln  ││
│  +10 -2 │  │ Summary paragraph...         │ │  │ ...             ││
│         │  ├──────────────────────────────┤ │  │                 ││
│ 2. Tests│  │ ─── file-a.ts ──────── ✓ □  │ │  │ 5 Flags ▶       ││
│  test.ts│  │  184 │ + new code line       │ │  │                 ││
│  +5 -3  │  │  185 │ + new code line       │ │  │ Checks 11/12   ││
│         │  │  186 │   context line        │ │  │ ████████████░░  ││
│ 3. Misc │  │  187 │ - removed line        │ │  │                 ││
│  doc.md │  │  ...                         │ │  │ Reviewers       ││
│  +200   │  │ ─── file-b.ts ──────── ✓ □  │ │  │ Labels: CLA     ││
│         │  │  ...                         │ │  └─────────────────┘│
├─────────┴──────────────────────────────────┴─────────────────────┤
│  🔍 Ask anything about this PR...                           [→]  │
└──────────────────────────────────────────────────────────────────┘
```

- **Left panel (~15%)**: Semantic file grouping (default) OR folder tree — toggle between views
- **Center panel (~55%)**: PR header + description + unified diffs with syntax highlighting
- **Right panel (~30%)**: Tab-switched Info/Chat (NOT split — one at a time, like Devin)
- **Bottom bar**: Persistent "Ask anything about this PR..." input (always visible, like Devin)
- **Key change from original plan**: Info/Chat are TABS not split panels. Simpler. Matches Devin.

## What We Learned from Devin (Plan Refinements)

1. **Tab-switch, not split-panel** — Devin's right sidebar is Info OR Chat, not both at once. Simpler.
2. **Persistent bottom chat bar** — "Ask anything about this PR..." is always visible regardless of tab. Smart UX.
3. **Semantic sections default** — File tree is secondary. The AI-grouped "sections" view is default.
4. **Bug detail is inline overlay** — Clicking a bug opens a detail panel OVER the sidebar, not a modal.
5. **Suggested fix inline with bug** — Fix suggestions appear inside the bug detail, not separately.
6. **Activity log for progress** — "Read ReactTaint.js... Reported bugs... Done" beats a progress bar.
7. **"Flags" separate from "Bugs"** — Two distinct categories, not one big list.
8. **No severity badges** — Devin doesn't use P0/P1/red/orange. Just "Bug" tag + description. Simple.

## Where We Go Beyond Devin (gstack + Codex additions)

1. **Two-pass adversarial review** (gstack) — Pass 1 critical, Pass 2 informational. Devin seems single-pass.
2. **Scope drift detection** (gstack) — "This file doesn't match the PR description." Devin doesn't have this.
3. **Pass/fail verdict gate** (Codex) — Structured JSON with `overall_correctness: pass/fail`. CI-friendly.
4. **Headless mode** — `openreview --headless <url>` → JSON output + exit code. For CI/CD pipelines.
5. **Multi-provider LLM** — Devin is locked to their model. We support OpenAI/Anthropic/Ollama/OpenRouter.
6. **Instruction file loading** — REVIEW.md, AGENTS.md, CLAUDE.md loaded as system context.
7. **Confidence scores** — 0-1 per finding. Devin doesn't show confidence.
8. **Local-first** — No cloud dependency. Runs on your machine with your API keys.

## Key Design Decisions

1. **SSE over WebSockets** - simpler, unidirectional streaming; chat uses POST + SSE response
2. **In-memory sessions** - local single-user tool, no database needed
3. **Sequential pipeline** - phases depend on earlier results; bug detection passes can parallelize
4. **Vercel AI SDK** - handles multi-provider, structured output (Zod), streaming out of the box
5. **Shiki** - VSCode-quality syntax highlighting, acceptable for local tool
6. **Zustand** - fine-grained subscriptions avoid re-render cascades from async SSE updates
7. **Tab-switch sidebar** (NEW) - Info/Chat as tabs, not split panels. Matches Devin's simpler UX.
8. **Persistent chat bar** (NEW) - Always-visible bottom input, regardless of active tab.

## Build Order (Implementation Phases)

### Phase A: Foundation
1. Scaffold Bun workspace monorepo with all packages
2. Define all types in `@openreview/core/types/`
3. Implement LLM provider wrapper (OpenAI + Anthropic)
4. Basic Hono server skeleton
5. Scaffold Vite + React + Tailwind app

### Phase B: PR Fetching + Diff Parsing
6. GitHub PR fetcher (Octokit)
7. Unified diff parser
8. Local git diff support
9. Wire up POST /api/review

### Phase C: Review Pipeline
10. Pipeline orchestrator with event emission
11. Phases 1-6 (semantic org, bug detection, auto-fix, scope drift, summary)
12. SSE streaming from pipeline events to API
13. Instruction file loading

### Phase D: Frontend
14. Three-panel resizable layout
15. Diff viewer with semantic groups + Shiki highlighting
16. Analysis sidebar (findings, filters, verdict)
17. SSE hook + Zustand stores
18. Connect to backend

### Phase E: Chat + CLI + Polish
19. Chat API + frontend panel
20. CLI entry point with arg parsing
21. Headless/CI mode (JSON output, exit code)
22. Config file support
23. Error handling, loading states, polish

## Verification Plan

1. **Unit tests**: Pipeline phases produce valid Zod-conforming output
2. **Integration test**: `openreview https://github.com/some/repo/pull/1` → server starts, web UI loads, review completes
3. **Manual test**: Review a real PR, verify semantic grouping makes sense, findings are actionable
4. **Headless test**: `openreview --headless <pr-url>` → JSON output, correct exit code
5. **Multi-provider test**: Switch between OpenAI/Anthropic/Ollama via config

## OpenCode PR Observations (sst/opencode/pull/18609)

Devin Review on a large OpenCode PR (32 files, +2043/-35 lines — "multi-agent team coordination"):

### What we confirmed
- **Folder tree is default for large PRs** — "View as sections" button was disabled while analysis was still running. Folder tree shows immediately, semantic sections appear after analysis completes.
- **Analysis takes time on large diffs** — "Devin's AI analysis: Generating..." with activity log in right sidebar showing progress: "Read inject.ts", "Reported findings", etc. This matches our pipeline approach.
- **Discussion tab shows bot comments** — GitHub Actions bot comments (contributing guidelines, duplicate PR detection) rendered inline in Discussion tab. We should render PR comments too.
- **Closed PR state** — "Closed" badge shown (red), diff still fully reviewable. Status doesn't block review.
- **Nested folder tree** — Deep nesting displayed clearly: `packages/opencode/src/team/index.ts +306` with collapsible folder hierarchy. Green `+N` / red `-N` line counts on every file.

### New insight for our implementation
- **Analysis loading state is critical UX** — Devin shows the activity log ("Read file X... Reported bugs... Done") as real-time updates while analysis runs. We need our SSE stream to emit per-file progress events, not just final results. This keeps users engaged during the 30-60s analysis window.

## Immediate Next Steps (Post-Approval)

1. Copy all screenshots from `/tmp/` to `docs/screenshots/` in the repo
2. Copy this plan to `PLAN.md` in the repo root
3. Add remote `origin` pointing to `https://github.com/kishandahya/openreview`
4. Commit everything and push to remote
5. Copy plan content to clipboard
6. Begin Phase A: Foundation (scaffold monorepo)
