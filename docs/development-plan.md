# Ink — Development Plan

**Based on:** `docs/prd.md` (Product Specification & Technical Design Document)
**Framework:** OpenTUI (`@opentui/core`) — Zig-native terminal UI core with TypeScript bindings
**Runtime:** Bun (recommended by OpenTUI)
**Stack:** TypeScript + OpenTUI (React or Solid bindings optional)

---

## Architecture Overview

The PRD defines 19 modules. Their dependency graph determines build order:

```
Layer 0: Scaffold & Shell
  └─ Layer 1: Core Editor (Workspace + File Tree + Basic Editing)
       ├─ Layer 2: Preview & Styling (Rendering + Themes)
       │    ├─ Layer 3: Navigation (Search + Palette + Outline + Dashboard)
       │    │    ├─ Layer 4: Git Integration
       │    │    │    └─ Layer 5: AI System (Providers + Workspace + Slash Commands)
       │    │    │         └─ Layer 6: Modes & Export
       │    │    │              └─ Layer 7: Extensibility & Polish
```

Modules in the same layer can be built in parallel.

---

## Phase 0: Project Scaffolding & Foundation

**Goal:** Bootable app shell with OpenTUI rendering, layout engine, and module wiring.

### Tasks

- [ ] **0.1** Initialize Bun project: `bun init`, install `@opentui/core`
- [ ] **0.2** Set up TypeScript config, linting, formatting
- [ ] **0.3** Create application entry point with OpenTUI renderer (`createCliRenderer`)
- [ ] **0.4** Implement the **Module Registry** — a lightweight DI/event bus that all modules register into. Each module gets:
  - `init(context)` — called at startup
  - `destroy()` — called at shutdown
  - `key` — unique module identifier
- [ ] **0.5** Implement **App Shell** — the top-level component tree:
  - StatusBar region (bottom)
  - Sidebar region (left, collapsible)
  - MainContent region (center, tabbed + splittable)
  - Overlay layer (command palette, modals)
- [ ] **0.6** Implement **Focus Manager** — tracks which pane/region is active, routes keyboard input
- [ ] **0.7** Implement **Event Bus** — typed pub/sub for cross-module communication (tab opened, file changed, mode switched, Git state updated)
- [ ] **0.8** Implement **Terminal Capability Detection** — detect true color, Unicode, image protocol support (used by rendering fallbacks in Phase 2)
- [ ] **0.9** Create `AGENTS.md` with project conventions (see end of this document)

**Deliverable:** App boots, renders an empty shell with status bar, responds to Ctrl+C/Ctrl+Q, passes focus between regions.

---

## Phase 1: Core Editor Experience

**Goal:** Open files, edit them, navigate the file tree, persist session state.

### Dependencies
- Phase 0 (shell, focus, event bus)

### Tasks

#### Module 4.1 — Markdown Workspace
- [ ] **1.1** Implement **File I/O** — read/write files with:
  - UTF-8 detection and encoding detection
  - LF/CRLF detection and preservation
  - Large-file mode threshold config
- [ ] **1.2** Implement **Tab Management** — open/close/reorder tabs per file
- [ ] **1.3** Implement **Split Panes** — vertical/horizontal split of the editor area, each holding a tab group
- [ ] **1.4** Implement **Text Editing** — a textarea/input component with:
  - Cursor movement, selection, clipboard (if terminal supports)
  - Per-tab undo/redo stack (character-level, separate from Git)
  - Autosave on typing-pause debounce (content-driven, not interval)
- [ ] **1.5** Implement **Breadcrumb Trail** — `workspace root → subfolder → filename → current heading` above editor
- [ ] **1.6** Implement **Frontmatter Collapse** — detect YAML frontmatter, render with subtle visual distinction, collapse toggle
- [ ] **1.7** Implement **Word Statistics** — live word/char count, estimated reading time in status bar
- [ ] **1.8** Implement **Session Persistence** — save/restore:
  - Open tabs, split layout tree
  - Per-file cursor position and scroll
  - Workspace layout preferences

#### Module 4.3 — Workspace Management
- [ ] **1.9** Implement **File Explorer** — sidebar tree with:
  - Expand/collapse folders
  - Create, rename, delete, move files/folders
  - Hidden file toggle (dotfiles)
  - Favorites/pinned items at top
- [ ] **1.10** Implement **Recent Projects** — global list across sessions
- [ ] **1.11** Implement **Workspace Settings** — per-project config overrides (`ink.json` or similar)
- [ ] **1.12** Implement **Multi-root Workspace** support

**Deliverable:** User can open a folder, browse files, open in tabs, edit text, split panes, close and reopen to find everything restored.

---

## Phase 2: Preview & Styling

**Goal:** Live Markdown preview rendering, theme system, visual polish.

### Dependencies
- Phase 1 (editor buffers)

### Tasks

#### Module 4.2 — Markdown Rendering
- [ ] **2.1** Implement **Markdown Parser** — convert MD to a renderable AST
  - Headings (H1-H6 with visual hierarchy)
  - Tables with column alignment
  - Task lists with checkbox glyphs
  - Nested lists
  - Fenced code blocks with syntax highlighting
  - Inline formatting (bold, italic, code, strikethrough)
  - Blockquotes and callout/admonition blocks (note, warning, tip)
  - Hyperlinks (visually distinct, openable via shortcut)
  - Images (inline if terminal supports, placeholder fallback)
  - Horizontal rules, emoji shortcodes
  - Footnotes with jump-to-reference
  - Math notation (best-effort)
- [ ] **2.2** Implement **Live Preview Pane** — side-by-side with editor
  - Re-renders on autosave debounce cadence
  - Scroll sync with editor (keyed to nearest heading, not line number)
- [ ] **2.3** Implement **Rendering Cache** — per-file, incremental (only re-render changed regions)
- [ ] **2.4** Implement **Mermaid Diagram** — detect fenced mermaid blocks, render as ASCII/box-drawing or show "open in browser" fallback
- [ ] **2.5** Implement **Rendering Fallback Tier System** — use terminal capability from Phase 0 to choose rendering fidelity

#### Module 4.16 — Themes
- [ ] **2.6** Define **Semantic Color Tokens** — the full palette:
  - Focus state, Git status colors
  - Callout/admonition colors
  - Syntax highlighting colors
  - Diff add/remove colors
  - Editor foreground/background, line numbers, selection
- [ ] **2.7** Ship **Dark Theme** (default) — verified against minimum contrast ratios
- [ ] **2.8** Ship **Light Theme**
- [ ] **2.9** Implement **Custom Theme Loading** — token-based JSON/YAML definition
- [ ] **2.10** Implement **Syntax Theme Layer** — separate from UI theme, for code block highlighting
- [ ] **2.11** Implement **Capability-tiered Palette** — true color definition auto-derives 256-color and ANSI fallbacks
- [ ] **2.12** Implement **Live Theme Preview** in Settings

**Deliverable:** Editor + live preview side-by-side, themes toggleable, code blocks highlighted.

---

## Phase 3: Navigation & Discovery

**Goal:** Find anything fast, execute any action from a palette, navigate by structure.

### Dependencies
- Phase 1 (files open into editor)
- Phase 2 (headings exist in rendered output)

### Tasks

#### Module 4.5 — Command Palette
- [ ] **3.1** Implement **Palette Overlay** — text input + live-filtered action list
  - Fuzzy match across label + category
  - Groups: File, Edit, Navigation, Search, View, Git, AI, Workspace, Export, Plugins, Preferences
  - Show keybinding alongside each action
  - Recently-used weighting
- [ ] **3.2** Implement **Context Awareness** — actions appear/disappear based on active pane and state
- [ ] **3.3** Implement **Inline Input Steps** — actions needing follow-up input (e.g., rename) stay in palette
- [ ] **3.4** Implement **Action Registry** — every module registers commands here

#### Module 4.4 — Search System
- [ ] **3.5** Implement **Fuzzy File Search** — rank by match quality + recency
- [ ] **3.6** Implement **Full-text Content Search** — rank by match density + file modification recency
- [ ] **3.7** Implement **Heading Search** — search within document structure
- [ ] **3.8** Implement **Symbol Search** — frontmatter fields, named anchors
- [ ] **3.9** Implement **Regex Search** — with inline syntax validation
- [ ] **3.10** Implement **Search Filters** — scope by file type, folder, exclude patterns (auto-respect `.gitignore` etc.)
- [ ] **3.11** Implement **Search Replace** — single-file and multi-file with preview-before-apply
- [ ] **3.12** Implement **Background Indexing** — async, non-blocking
- [ ] **3.13** Implement **Search History** — per-workspace

#### Module 4.12 — Dashboard
- [ ] **3.14** Implement **Startup Dashboard** — sections:
  - Recent projects
  - Pinned workspaces
  - Recent files (across workspaces)
  - Git status summary
  - Quick actions (new project, open folder, clone)
- [ ] **3.15** Implement **Section Collapse/Reorder** per user preference
- [ ] **3.16** Implement **"Home" Action** — return to dashboard mid-session

#### Outline Panel (part of 4.1)
- [ ] **3.17** Implement **Outline Panel** — live heading hierarchy (H1-H6) for active file
  - Click/navigate to jump cursor to heading
  - Updates as user types new headings

**Deliverable:** User can fuzzy-search any file, search content across workspace, execute any command from palette, navigate by headings, land on a useful startup screen.

---

## Phase 4: Git Integration

**Goal:** Full Git workflow without leaving the terminal.

### Dependencies
- Phase 1 (file tree needs Git status badges)
- Phase 3 (Git commands register in palette)

### Tasks

#### Module 4.6 — Git Integration
- [ ] **4.1** Implement **Git Detection** — auto-detect when workspace is inside a Git repo
- [ ] **4.2** Implement **Status Bar Indicator** — branch name, ahead/behind, dirty/clean
- [ ] **4.3** Implement **File Status Badges** — in File Explorer and tabs (modified, new, staged, deleted)
- [ ] **4.4** Implement **Staging/Unstaging** — per-file and per-hunk
- [ ] **4.5** Implement **Diff Viewer** — side-by-side and inline modes, word-level highlighting
- [ ] **4.6** Implement **Commit Composer** — subject + body with character-count guide
- [ ] **4.7** Implement **Branch Management** — create, switch, rename, delete; searchable branch list
- [ ] **4.8** Implement **Push/Pull/Fetch/Merge/Rebase** — with progress feedback
- [ ] **4.9** Implement **Conflict Viewer** — three-way structured view (ours/theirs/base)
- [ ] **4.10** Implement **Blame** — per-line or per-selection, commit/author/date
- [ ] **4.11** Implement **Commit History** — scrollable, searchable log with per-commit diff view
- [ ] **4.12** Implement **Reactive Updates** — Git state refreshes on external changes (separate terminal `git` commands)
- [ ] **4.13** Register all Git actions in Command Palette

**Deliverable:** Full Git workflow — status, stage, diff, commit, branch, push/pull, conflict resolution.

---

## Phase 5: AI Integration

**Goal:** Workspace-aware AI assistant with multiple provider support and structured slash commands.

### Dependencies
- Phase 1 (active file/selection context)
- Phase 3 (command palette registration)
- Phase 4 (Git diff context for `/commit` and `/review`)

### Tasks

#### Module 4.8 — AI Providers
- [ ] **5.1** Implement **Provider Abstraction** — unified interface with methods:
  - `chat(messages, model, options)` → stream or complete response
  - `listModels()` → available models
  - `validate()` → check credentials/connectivity
- [ ] **5.2** Implement **OpenAI Provider**
- [ ] **5.3** Implement **Anthropic Provider**
- [ ] **5.4** Implement **Ollama Provider** (local)
- [ ] **5.5** Implement **LM Studio Provider** (local)
- [ ] **5.6** Implement **OpenRouter Provider**
- [ ] **5.7** Implement **Provider Fallback/Error Handling** — clear error messages, one-step provider switch
- [ ] **5.8** Implement **Secure Credential Storage** — OS-level keychain where available
- [ ] **5.9** Implement **Model Selection UX** — live model listing + capability indicators

#### Module 4.7 — AI Workspace
- [ ] **5.10** Implement **AI Panel** — conversation view with:
  - Context display (what files/selection were included)
  - Provider/model indicator
  - Streaming response rendering
- [ ] **5.11** Implement **Context Assembly** — build request context from:
  - Active file content
  - Selected text
  - Recently visited files
  - Workspace structure (when relevant)
  - Git diff (when requested)
- [ ] **5.12** Implement **Diff Review UX** — AI-proposed edits shown as diffs against current content: accept, reject, revise
- [ ] **5.13** Implement **Selected-text Actions** — rewrite, summarize, explain, translate inline
- [ ] **5.14** Implement **Multi-file Understanding** — assemble multi-file context within token limits
- [ ] **5.15** Implement **Progress & Cancellation** — long-running operations show progress, are cancellable
- [ ] **5.16** Implement **Conversation History** — per-workspace persistence

#### Module 4.9 — Slash Commands
- [ ] **5.17** Implement **Slash Command Registry** — extensible list
- [ ] **5.18** Implement **`/rewrite`** — rewrite selection with optional style/goal
- [ ] **5.19** Implement **`/summarize`** — summarize file, selection, or folder
- [ ] **5.20** Implement **`/explain`** — explain selection in plain language
- [ ] **5.21** Implement **`/translate`** — translate selection to target language
- [ ] **5.22** Implement **`/table`** — convert loose text to Markdown table
- [ ] **5.23** Implement **`/diagram`** — generate Mermaid diagram from description
- [ ] **5.24** Implement **`/commit`** — propose commit message from staged changes
- [ ] **5.25** Implement **`/review`** — structured document review with actionable feedback
- [ ] **5.26** Implement **`/todo`** — scan for TODO markers and open action items
- [ ] **5.27** Implement **`/continue`** — propose continuation of current document

**Deliverable:** User can chat with AI about their workspace, invoke slash commands, review and accept/reject AI edits. Multiple providers supported.

---

## Phase 6: Workspace Modes & Export

**Goal:** Task-optimized layouts, document export.

### Dependencies
- Phase 2 (preview rendering used by export)
- Phase 4 (Git mode needs Git panel)
- Phase 5 (AI mode needs AI panel)

### Tasks

#### Module 4.11 — Workspace Modes
- [ ] **6.1** Implement **Mode Switching** — via command palette and keybinding, non-destructive (restores prior panel state)
- [ ] **6.2** Implement **Writing Mode** — sidebar minimized, editor+preview maximized, word count prominent
- [ ] **6.3** Implement **Research Mode** — multi-pane with reference files + search prominent
- [ ] **6.4** Implement **AI Mode** — AI panel primary alongside document
- [ ] **6.5** Implement **Review Mode** — diff-centric layout with feedback alongside document
- [ ] **6.6** Implement **Git Mode** — Git panel primary, editor secondary
- [ ] **6.7** Implement **Presentation Mode** — chrome-minimized full-screen preview
- [ ] **6.8** Implement **Distraction-Free Mode** — everything hidden except editor
- [ ] **6.9** Implement **Per-workspace Default Mode**

#### Module 4.14 — Export System
- [ ] **6.10** Implement **Export Preview** — summary of what will be generated before writing
- [ ] **6.11** Implement **Markdown Export** — normalized/cleaned output
- [ ] **6.12** Implement **HTML Export** — standalone styled rendering
- [ ] **6.13** Implement **PDF Export** — print-ready output
- [ ] **6.14** Implement **Static Site Export** — multi-file folder → navigable static site
- [ ] **6.15** Implement **Print-friendly Export** — adjusted margins, page breaks
- [ ] **6.16** Implement **Project Archive Export** — compressed workspace archive
- [ ] **6.17** Implement **Progress & Cancellation** for long-running exports
- [ ] **6.18** Implement **Ignore-pattern Respect** — exports respect same excludes as search

#### Module 4.15 — Settings (UI)
- [ ] **6.19** Implement **Settings Panel** — organized categories with fuzzy search
- [ ] **6.20** Implement **Live Settings Application** — changes apply without restart where possible
- [ ] **6.21** Implement **Global vs Per-workspace Override Distinction**

**Deliverable:** Task-specific layouts, document export in multiple formats, full settings UI.

---

## Phase 7: Polish & Extensibility

**Goal:** Plugin system, full keybinding remapping, accessibility, performance, quality.

### Tasks

#### Module 4.17 — Keybindings
- [ ] **7.1** Define **Default Keybinding Set** — VS Code-influenced, terminal-respectful
- [ ] **7.2** Implement **Full Remapping** — through Settings UI
- [ ] **7.3** Implement **Conflict Detection** — warn on binding collision, require confirmation to override
- [ ] **7.4** Implement **Keybinding Export/Import**
- [ ] **7.5** Implement **Cheat-sheet Overlay** — contextual, filtered to current focus/mode

#### Module 4.13 — Plugin System
- [ ] **7.6** Design **Plugin API** — extension points:
  - Register panels/views
  - Register command palette entries
  - Register slash commands
  - Register export formats
  - Register AI providers
- [ ] **7.7** Implement **Plugin Loader** — discover, load, and sandbox plugins
- [ ] **7.8** Implement **Plugin Management UI** — in Settings: list, enable, disable, remove
- [ ] **7.9** Implement **Permission System** — what data/actions a plugin can access
- [ ] **7.10** Build **Reference Plugin** (e.g., Kanban board or Terminal panel) to validate the API

#### Performance & Quality
- [ ] **7.11** Profile and optimize **startup time** — lazy loading, minimal initial import
- [ ] **7.12** Profile and optimize **typing latency** — keystroke-to-render
- [ ] **7.13** Profile and optimize **memory** — verify it scales with open tabs, not workspace size
- [ ] **7.14** Implement **Window Resize Handling** — responsive re-layout, graceful degradation below threshold
- [ ] **7.15** Implement **Accessibility** — contrast ratios, reduced-motion mode, screen-reader compatibility
- [ ] **7.16** **Testing** — core paths covered (file I/O, search, Git operations, AI context assembly)

**Deliverable:** Extensible via plugins, fully remappable keys, performant and accessible.

---

## Quick Reference: Module ↔ Phase Mapping

| Module (PRD §) | Phase | Key Dependencies |
|---|---|---|
| §4.1 Markdown Workspace | 1 | Phase 0 |
| §4.2 Markdown Rendering | 2 | Phase 1 |
| §4.3 Workspace Management | 1 | Phase 0 |
| §4.4 Search System | 3 | Phase 1 |
| §4.5 Command Palette | 3 | Phase 1, Phase 2 |
| §4.6 Git Integration | 4 | Phase 1, Phase 3 |
| §4.7 AI Workspace | 5 | Phase 1, Phase 3, Phase 4 |
| §4.8 AI Providers | 5 | Phase 0 (registry) |
| §4.9 Slash Commands | 5 | Phase 5 (AI Workspace) |
| §4.10 Terminal Experience | 0 | Phase 0 (shell) |
| §4.11 Workspace Modes | 6 | Phase 2, Phase 4, Phase 5 |
| §4.12 Dashboard | 3 | Phase 1, Phase 4 |
| §4.13 Plugin System | 7 | Everything |
| §4.14 Export System | 6 | Phase 2 |
| §4.15 Settings | 6 | Everything (but UI is Phase 6) |
| §4.16 Themes | 2 | Phase 0 (rendering) |
| §4.17 Keybindings | 7 | Phase 3 (palette) |
| §4.18 Performance | 7 (ongoing) | Everything |
| §4.19 UX Journeys | End-to-end validation | All phases |

---

## Convention Notes for AI Agents

- **Language:** TypeScript (strict mode)
- **Runtime:** Bun
- **UI Framework:** `@opentui/core` (OpenTUI)
- **Module Structure:** Each module lives in `src/modules/<name>/` with:
  - `index.ts` — public API and registration
  - `types.ts` — types and interfaces
  - `components/` — OpenTUI components
  - `store.ts` — module state (Zustand or similar)
- **Event Bus:** Typed events in `src/events.ts`
- **Testing:** Bun's built-in test runner
- **Code Style:** No comments unless explaining a non-obvious decision; `ponytail:` prefix for deliberate simplifications
