- Runtime: Bun
- Default branch: `devin-review-local`
- Run `bun install` from root to install all workspace dependencies
- Run `bun run typecheck` from any package directory to check types

## Style Guide

Follow the opencode AGENTS.md conventions:

- Single-word variable/function names where possible
- `const` over `let`. Use ternaries or early returns.
- No destructuring. Use dot notation.
- No `try/catch`. Use `.catch()` chains.
- No `any` type.
- No `else`. Prefer early returns.
- Functional array methods over for loops.
- Inline values used only once.

## Testing

- Run `bun run typecheck` from package directories
- Tests cannot run from repo root
