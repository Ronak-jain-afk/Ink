# Ink — Agent Instructions

## What this is

A greenfield terminal-native Markdown workspace app (editor + preview + Git + AI). No code written yet. The authoritative specs are in `docs/`.

## Source of truth

| File | What it defines |
|---|---|
| `docs/prd.md` | Full product spec — 19 modules, behaviors, edge cases, data ownership |
| `docs/development-plan.md` | 8-phase build order with dependency graph and task breakdown |

Read these before starting any implementation work. The PRD is the canonical reference for *what* to build and *why*. The dev plan is the *order* to build in.

## Planned stack

- **Runtime:** Bun
- **UI framework:** `@opentui/core` (OpenTUI — Zig-native terminal UI, TypeScript bindings)
- **Language:** TypeScript (strict mode)
- **Optional:** `@opentui/react` or `@opentui/solid` reconcilers (not yet decided)

No dependencies installed yet. Phase 0 of the dev plan starts with `bun init && bun add @opentui/core`.

## Module structure convention

Each module under `src/modules/<name>/`:
- `index.ts` — public API + registration
- `types.ts` — types/interfaces
- `components/` — OpenTUI components
- `store.ts` — module state

## Key constraints from PRD

- **Keyboard-first, mouse-optional.** Every action needs a keyboard path; the reverse is not required.
- **AI edits are always reviewable diffs.** Never silently replace text.
- **Session restore is non-negotiable.** Closing and reopening in the same folder must restore tabs, splits, cursor, scroll.
- **Performance targets:** startup near-instant, typing imperceptibly lag-free, memory scales with open tabs not workspace size.

## Commands (to be defined during Phase 0)

No build/test/lint tooling configured yet. When adding it, prefer:
- `bun test` for testing (Bun's built-in runner)
- `bun run typecheck` for `tsc --noEmit`
- Standard `tsconfig.json` with `strict: true`

## Verify before acting

- `bun install` if `bun.lock` is missing or deps changed
- Check `docs/` before implementing something — the specs may already define the expected behavior in detail
- When a PRD section and user request conflict, the PRD wins unless the user explicitly overrides it
