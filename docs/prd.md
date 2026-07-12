# Ink — Product Specification & Technical Design Document

**Tagline:** *A terminal-native workspace for thinking, writing, and coding.*

**Document type:** Combined Software Requirements Specification (SRS), Product Requirements Document (PRD), and Technical Design Specification
**Status:** Foundational design — pre-implementation
**Scope:** Product design, interaction design, information architecture, feature specification, workflows, and long-term vision. No source code, pseudocode, or implementation snippets are included by design.

---

## 0. Document Purpose and How to Read This Spec

This document exists to answer one question completely: **what is Ink, precisely, before a single line of implementation code is written?**

It is organized so that three different readers can each get what they need from it:

- A **product designer** reading top to bottom gets the vision, the user journeys, and the rationale behind every interaction decision.
- A **software architect** reading the module sections gets the boundaries between subsystems, the data each subsystem owns, and the contracts between them — without being told *how* to implement any of it.
- A **new contributor** joining the open-source project six months from now can use this as the canonical reference for "why does Ink behave this way" instead of reverse-engineering intent from code.

Each core module section follows the same internal shape: **Purpose → Experience → Behavior & Edge Cases → Data It Owns → Interactions With Other Modules → Future Enhancements.** This consistency is intentional — it lets a reader skim to the subsection they need instead of reading prose written in a different structure every time.

---

## 1. Core Vision

### 1.1 What Ink Is

Ink is a terminal-native workspace application, not a terminal-based text editor with extra features bolted on. The distinction matters architecturally and philosophically: a text editor's unit of concern is the file; a workspace's unit of concern is the *project* — the folder, its files, its Git history, its structure, and the developer's intent as they move through it.

Ink's job is to let a developer, researcher, or technical writer do everything they currently do by tabbing between an editor, a file tree sidebar, a Git GUI or CLI, a browser tab for search, and a separate AI chat window — inside one coherent terminal session, without breaking flow.

### 1.2 What Ink Is Not

To keep the product honest, it is worth being explicit about what Ink deliberately does not try to be:

- It is not a general-purpose note-taking app for casual daily journaling (that's Obsidian's territory, and Ink does not compete there).
- It is not a full IDE with language servers, debuggers, and build systems (that's VS Code's and Neovim's territory).
- It is not a chat-first AI tool where the workspace is incidental context (that's a generic AI chat client's territory).

Ink sits deliberately at the intersection of these three worlds, scoped specifically to **Markdown-centric technical work inside a project folder**: READMEs, docs, design specs, research notes, changelogs, RFCs, and the connective tissue of software projects — done with full awareness of the surrounding code and Git history, and with AI as a workspace-aware collaborator rather than a chatbot.

### 1.3 Design Philosophy Summary

Every feature decision in this document is filtered through the same set of values, listed here once so later sections can simply reference them:

1. **Keyboard-first, mouse-optional.** Every action reachable via mouse must have a keyboard path; the reverse is not required.
2. **Minimal context switching.** If a workflow would normally require leaving the terminal (checking Git status, searching docs, asking an AI a question), Ink should absorb it.
3. **Low cognitive load.** Information density is good; visual noise is not. Every panel earns its screen space.
4. **Fast and native-feeling.** Startup, typing, search, and navigation should never feel like they are waiting on anything.
5. **Extensible by design, not by accident.** The plugin system and provider abstractions are architected from day one, even though the initial release ships a fixed feature set.

---

## 2. UI Framework Foundation: OpenTUI

Ink is built on **OpenTUI**, and the entire interaction model is designed around what a component-based, split-pane, tab-capable, mouse-and-keyboard-aware terminal UI framework can provide. This section does not evaluate or compare frameworks — OpenTUI is a fixed foundation — but it does establish the design assumptions that the rest of this document relies on.

### 2.1 Assumed Capabilities

The product design in this document assumes OpenTUI provides:

- A component tree with reusable, composable widgets (panels, lists, trees, text areas, modals, status bars).
- A flexible layout engine supporting split panes (horizontal and vertical), resizable dividers, and tabbed containers.
- A focus-management system that tracks which pane/component is "active" and routes keyboard input accordingly.
- Mouse event support (click, drag, scroll, hover) layered on top of keyboard-first design, not replacing it.
- Scrollable viewports with virtualization for large content (so a 10,000-line file or a 5,000-entry search result list doesn't degrade rendering performance).
- A theming layer that exposes colors, borders, and typography-equivalent styling (bold, dim, italic, underline) as tokens rather than hardcoded values.
- Modal/overlay rendering (for command palette, dialogs, confirmation prompts) that can render above the main layout without disrupting underlying pane state.

### 2.2 Design Implications

Because OpenTUI is component-based, Ink's UI is specified in this document as a **tree of named regions** (e.g., "Sidebar," "Editor Tab Strip," "Status Bar," "Command Palette Overlay") rather than as pixel-level mockups. Every core module below maps to one or more of these regions, and the Terminal Experience section (Section 13) defines how regions compose into full-screen layouts across the different Workspace Modes (Section 14).

---

## 3. Overall Product Positioning

Ink is positioned as occupying the overlap of five existing tools' strengths, translated into a single terminal-native experience:

| Reference Tool | What Ink Borrows | What Ink Deliberately Leaves Behind |
|---|---|---|
| VS Code | Command palette, tabbed multi-file editing, split panes, integrated search | Full extension marketplace complexity, language-server-driven IntelliSense |
| Obsidian | Markdown-first authoring, backlink-style navigation, outline/TOC navigation | Graph view, casual daily-note-taking focus, plugin sprawl |
| Claude Code / OpenCode | Workspace-aware AI that understands multi-file context, slash commands | Code-generation-first framing (Ink's AI is writing/docs-first, not code-first) |
| NotebookLM | Multi-source synthesis, summarization, research-assistant framing | Consumer-facing simplicity; Ink stays developer-grade |
| Lazygit | Fast, keyboard-driven, native-feeling Git operations without leaving the terminal | Lazygit's Git-only scope — in Ink, Git is one module among many |

This table is a positioning aid, not a feature checklist — no section below should be read as "clone feature X from tool Y." Each module is designed on its own terms for Ink's specific user base.

### 3.1 Target Users

Ink is designed for people who already live in a terminal and think in Markdown: software developers, open-source maintainers, students working through technical coursework, researchers writing papers and notes alongside code, DevOps engineers documenting infrastructure, and documentation teams maintaining large docs repositories.

It is explicitly **not** designed for casual personal note-taking, non-technical users, or anyone who would be better served by a GUI-first app. This scoping decision protects the product from feature bloat aimed at a mismatched audience.

---

## 4. Core Module Specifications

Each module below is a self-contained subsystem. Where a module needs data or state from another module, that dependency is called out explicitly in the "Interactions With Other Modules" subsection so the eventual architecture has clear seams.

---

### 4.1 Module: Markdown Workspace

**Purpose:** The Markdown Workspace is the editing core of Ink — the multi-file, multi-tab, multi-pane authoring surface where the actual writing happens.

**Experience:**

A user opens Ink inside a project folder and is placed into a workspace view with a persistent sidebar (file tree) and a main editing area. Files open as tabs across the top of the editing area, similar to a code editor. Tabs can be split — vertically or horizontally — so a user can view two files, or two parts of the same file, side by side. This matters specifically for technical writing: comparing an outline against a draft, or a changelog against the commit it documents, is a constant workflow and deserves first-class split support rather than being an awkward workaround.

Each open file shows a **breadcrumb trail** above the editor content (workspace root → subfolder path → filename → current heading), so a user scrolled deep into a long document always knows where they are structurally, not just which file they're in.

An **outline panel** (toggleable, typically docked right or as a collapsible sidebar) mirrors the document's heading hierarchy (H1–H6) and updates live as the user types new headings. Clicking or navigating to an outline entry jumps the editor cursor to that heading. This is distinct from the file tree — the file tree navigates *between* files, the outline navigates *within* a file.

**Behavior & Edge Cases:**

- **Session restore:** closing Ink and reopening it in the same folder restores exactly the tabs, splits, cursor positions, and scroll positions from the last session, so a user never loses their place.
- **Autosave** runs on a short debounce (content-driven, not time-driven — it saves after a pause in typing, not on a fixed interval) so unsaved work is never more than a few keystrokes' pause away from being persisted, while avoiding a save-on-every-keystroke performance cost.
- **Recent files** are tracked per-workspace and globally, surfaced both in the command palette and the startup dashboard (Section 4.12).
- **Large file handling:** files above a configurable size threshold open in a reduced-feature "large file mode" — syntax highlighting and outline generation may be deferred or simplified to keep typing responsive, with a visible indicator that the file is in this mode.
- **Encoding detection** happens on file open (UTF-8 as the default assumption, with detection and a visible warning for non-UTF-8 files) and **line ending** (LF vs CRLF) is detected, preserved on save, and displayed in the status bar with a click-to-convert affordance.
- **Frontmatter support:** YAML frontmatter blocks at the top of a Markdown file are recognized, visually distinguished from body content (subtle background or border treatment), and can be collapsed to reduce visual noise while editing the body.
- **Word statistics and reading time** are computed live and shown in the status bar (word count, character count, estimated reading time based on a standard words-per-minute baseline), with a toggle for selection-only stats when text is selected.
- **Undo/redo** is per-tab, persists across a session, and is separate from Git history — this is character-level editing history, not version control.
- **Workspace persistence:** the workspace itself (which folders are open, sidebar width, panel visibility, active mode) is saved independently from individual file session state, so workspace layout preferences survive even if a project is reopened after a long gap.

**Data It Owns:** open tab list, split layout tree, per-file cursor/scroll/undo state, workspace-level layout preferences, recent files list.

**Interactions With Other Modules:** the Outline is also consumed by the Search System (heading search) and Command Palette (jump-to-heading). The File Explorer (4.3) and the Markdown Workspace share the concept of "currently open files" but own different state — the Explorer owns the tree structure, the Workspace owns the editing session.

**Future Enhancements:** collaborative real-time co-editing; per-file custom metadata beyond frontmatter; editor-level focus/typewriter modes tied into Distraction-Free Mode (Section 14.7).

---

### 4.2 Module: Markdown Rendering (Preview)

**Purpose:** Give the user a live, beautifully rendered preview of their Markdown as they write, entirely within the terminal's rendering constraints.

**Experience:**

Preview is a togglable pane — either a split next to the raw editor (live side-by-side) or a full-pane preview mode for reading. The rendering engine supports the full range of Markdown a technical writer expects to use daily: headings with proper visual hierarchy (size/weight approximated through terminal-appropriate styling since literal font size isn't available), tables rendered with proper column alignment and borders, task lists with checkbox glyphs that reflect checked/unchecked state, nested ordered and unordered lists with correct indentation, fenced code blocks with syntax highlighting matched to the declared language, Mermaid diagrams rendered as terminal-compatible ASCII/box-drawing approximations (with a fallback to a "diagram summary + open in browser" affordance when a diagram is too complex for terminal rendering fidelity), inline and block math notation rendered as best-effort terminal typography, footnotes with jump-to-reference navigation, hyperlinks that are visually distinguished and can be opened in the system browser via keyboard shortcut, images rendered inline where the terminal supports an image protocol (with a graceful fallback to a bordered placeholder showing alt text and dimensions when it doesn't), blockquotes and callout/admonition blocks (note, warning, tip) rendered with distinct left-border coloring per type, horizontal rules, emoji shortcodes resolved to their glyphs, and inline formatting (bold, italic, strikethrough, inline code) rendered with terminal-appropriate styling.

**Behavior & Edge Cases:**

- Preview updates **live** as the user types, on the same debounce cadence as autosave, so it never feels laggy but also never re-renders on every keystroke in a way that would waste cycles on a long document.
- Scroll position is **synced** between the raw editor and preview when shown side-by-side — scrolling one moves the other proportionally, keyed to nearest heading rather than raw line number, so structural context is preserved even though rendering may compress or expand vertical space differently than raw text.
- When a construct can't be rendered with full fidelity in the current terminal (e.g., a complex diagram in a terminal without advanced graphics protocol support), Ink shows a clearly labeled fallback rather than silently failing or rendering garbled output.

**Data It Owns:** rendering cache per open file (to avoid full re-parse on every keystroke — only changed regions re-render).

**Interactions With Other Modules:** reads directly from the Markdown Workspace's live buffer; the Terminal Experience module (4.10) defines the capability-detection logic that determines which fallback tier of rendering (full image support vs. placeholder, full Mermaid vs. summary) is active for the user's current terminal.

**Future Enhancements:** custom callout types defined per-workspace; print-layout preview mode distinct from editing preview; live preview of Mermaid diagram edits with instant re-render on diagram source change.

---

### 4.3 Module: Workspace Management

**Purpose:** Let Ink treat an entire folder as a first-class project, not just a location to open individual files from.

**Experience:**

Opening Ink points it at a root folder, which becomes "the workspace." A **file explorer** sidebar shows the folder tree with standard affordances: expand/collapse, create/rename/delete/move files and folders, drag-to-reorder where meaningful, and visual indicators for Git status (modified, new, staged) inherited from the Git Integration module. Hidden files (dotfiles) are hidden by default with a toggle to reveal them. Users can **favorite or pin** specific files or folders so they stay visible at the top of the tree regardless of alphabetical position — useful for a README or a primary spec file that's referenced constantly.

**Recent projects** are tracked globally across all workspaces Ink has ever opened, surfaced on the startup dashboard, letting a user jump back into any prior project instantly. **Workspace settings** allow per-project overrides of global preferences (e.g., a docs-heavy repo might want the preview pane open by default; a notes repo might not).

**Behavior & Edge Cases:**

- Multiple workspace folders can theoretically be open simultaneously (multi-root workspace), each shown as a top-level section in the file tree, for users who work across a monorepo-adjacent set of related repos.
- **Workspace state restoration** covers not just open tabs (owned by the Markdown Workspace module) but tree expansion state, scroll position within the tree, and which folders were collapsed — so returning to a large project doesn't require re-expanding a dozen folders every time.
- File operations (rename, move, delete) are guarded with confirmation for destructive actions and, where the operation touches a Git-tracked file, are coordinated with the Git module so the operation is reflected correctly in Git status rather than looking like an untracked delete+create.

**Data It Owns:** workspace root path(s), tree expansion/collapse state, favorites/pinned items, recent projects list, per-workspace settings overrides.

**Interactions With Other Modules:** feeds open-file requests to the Markdown Workspace; consumes Git status per-file from the Git Integration module to render status badges in the tree; feeds the Dashboard's "recent projects" and "pinned workspaces" sections.

**Future Enhancements:** workspace-level tagging/categorization on the dashboard; saved multi-root workspace configurations that can be shared/exported as a team convention.

---

### 4.4 Module: Search System

**Purpose:** Make finding anything — a file, a heading, a phrase, a symbol — feel instant, regardless of workspace size.

**Experience:**

Search is invoked via a dedicated keybinding and presents a unified search overlay with mode switching: **fuzzy file search** (type fragments of a filename/path, get ranked matches), **full-text/content search** (search inside file contents across the workspace), **heading search** (search specifically within document structure, useful for jumping to a concept by its section title across many files), **symbol search** (surfaces frontmatter fields, named anchors, or structurally significant markers), and **regex search** for power users who need precise pattern matching.

**Replace** is available in both single-file and multi-file modes, with a **preview-before-apply** step showing every match that will be changed and allowing individual matches to be excluded before committing the replacement — multi-file replace is treated as a high-stakes operation and never applied silently.

**Search history** persists recent queries per-workspace, and **search filters** let a user scope by file type, folder, or exclude patterns (e.g., excluding a `node_modules`-equivalent or a `dist` folder) — with sensible default excludes that respect common ignore-file conventions out of the box.

**Behavior & Edge Cases:**

- Results are ranked, not just listed — fuzzy file search ranks by match quality and recency of access; content search ranks by match density and, secondarily, recency of file modification.
- Search is designed to feel instant even on large workspaces, which implies an indexing strategy running in the background rather than a synchronous full-scan on every keystroke; the UX contract is "results update as you type without perceptible lag," and the underlying implementation must satisfy that contract however it's built.
- Regex search clearly indicates invalid pattern syntax inline rather than silently returning zero results.

**Data It Owns:** search index (conceptually — the actual indexing strategy is an implementation concern), search history, saved filters.

**Interactions With Other Modules:** results that are files open into the Markdown Workspace; results that are headings jump into the Outline; the Command Palette's "go to file" and "go to symbol" actions are thin wrappers around this module's fuzzy/heading search.

**Future Enhancements:** saved searches; search-as-a-smart-folder (a persistent view that always shows current matches for a saved query, useful for tracking all "TODO" callouts across a docs repo).

---

### 4.5 Module: Command Palette

**Purpose:** A single, universal entry point for every action in Ink, discoverable by typing rather than memorizing menu locations.

**Experience:**

Invoked via a dedicated keybinding, the palette overlays the current view with a text input and a live-filtered list of actions, grouped into categories: File, Edit, Navigation, Search, View, Git, AI, Workspace, Export, Plugins, Preferences. Each entry shows its keybinding (if one exists) alongside its label, reinforcing shortcut discovery over time — a new user finds an action through the palette, sees its shortcut, and gradually internalizes the shortcut without needing to consult a separate cheat sheet.

Typing filters fuzzily across both the action label and its category, so a user typing "commit" finds Git actions even without knowing the exact category name. Recently used commands are weighted toward the top of results for repeat actions.

**Behavior & Edge Cases:**

- Some actions require a follow-up input (e.g., "Rename File" needs a new name) — these actions transition the palette into an inline input step rather than closing and opening a separate dialog, keeping the interaction contiguous.
- Destructive actions (delete file, force push) surfaced through the palette still route through their normal confirmation step — the palette is a launcher, not a bypass for safety checks.
- The palette is context-aware: some actions only appear when relevant (e.g., "Stage Hunk" only appears when the active file has uncommitted changes; "Insert Table" only appears when a Markdown editor is focused).

**Data It Owns:** the action registry (conceptually — every module registers its available actions here) and usage-frequency weighting for ranking.

**Interactions With Other Modules:** every other module registers commands into this system; this is the primary discoverability mechanism for the entire product, meaning its design quality directly determines how learnable Ink is.

**Future Enhancements:** plugin-contributed command categories; a lightweight "command chaining" mode for running a short sequence of actions (e.g., "stage all, commit, push") as a single palette-invoked macro.

---

### 4.6 Module: Git Integration

**Purpose:** Make version control feel like a native part of the writing/coding workflow rather than a context switch to a separate tool.

**Experience:**

When a workspace is inside a Git repository, Ink automatically detects it and surfaces a persistent **Git status indicator** (current branch, ahead/behind counts, dirty/clean state) in the status bar. A dedicated **Git panel** (and full Git Mode, Section 14.5) shows staged and unstaged changes as a list, with **staging and unstaging** available per-file or per-hunk. **Commit creation** happens through a focused commit-message composer (subject + body, with a live character-count guide for subject-line length conventions) directly inside Ink.

**Diff viewing** supports both **side-by-side** and **inline** modes, togglable per preference, with word-level (not just line-level) highlighting so small edits inside a long line are easy to spot. **Blame** is available per-line or per-selection, showing commit, author, and date inline or in a side panel. **Branch management** covers creating, switching, renaming, and deleting branches, with a searchable branch list for repos with many branches. **Push, pull, fetch, merge, and rebase** are exposed as first-class actions with clear status feedback (in progress, succeeded, conflict) — and a dedicated **conflict viewer** presents merge conflicts as a structured three-way view (ours/theirs/base) rather than raw conflict markers, with per-conflict resolution actions.

**Behavior & Edge Cases:**

- Git status badges in the File Explorer and open tabs update reactively as the underlying repository state changes (including changes made outside Ink, e.g., from a separate terminal `git` command) — Ink should never show stale Git state.
- Commit history is browsable as a scrollable, searchable log, with the ability to view the full diff of any historical commit without leaving the panel.
- Operations that can fail in ways requiring user decision (push rejected, merge conflict, rebase conflict) surface a clear, actionable state rather than a raw error — the conflict viewer is the resolution path, not a dead end.

**Data It Owns:** nothing persistent beyond caches — Git Integration is a live view over the actual Git repository, which remains the single source of truth at all times.

**Interactions With Other Modules:** feeds status badges to Workspace Management's file tree; feeds the AI Workspace's `/commit` and `/review` slash commands (Section 4.9) with diff context; feeds the Dashboard's Git status summary.

**Future Enhancements:** interactive rebase with drag-to-reorder commit list; stash management UI; PR/MR creation and review directly from Ink for hosted Git platforms.

---

### 4.7 Module: AI Workspace

**Purpose:** Provide an AI collaborator that understands the *workspace* — its files, folder structure, and Git state — rather than behaving as a stateless chatbot the user has to manually paste context into.

**Experience:**

AI interaction happens through a dedicated panel (and full AI Mode, Section 14.3) that maintains awareness of: the currently active file, any selected text within it, related files the user has recently visited, and — when relevant to the request — the broader folder or full workspace structure. A user can ask a question, request a rewrite, or invoke a slash command (Section 4.9) without manually describing what file or project they're talking about — Ink supplies that context automatically, visibly showing *what* context was included with each request so the interaction never feels opaque.

**Selected-text actions** let a user highlight a passage and trigger inline actions (rewrite, summarize, explain, translate) that show a **proposed diff** of the change rather than silently overwriting text — the user reviews and accepts, rejects, or requests a revision before anything is applied to the document.

**Multi-file understanding** allows requests that reference more than one file explicitly (e.g., "summarize the differences between the two API docs I have open") — the AI Workspace module is responsible for assembling multi-file context in a way that stays within practical context limits, prioritizing relevance (open tabs, recently visited files, explicitly referenced files) over exhaustive inclusion.

**Behavior & Edge Cases:**

- Every AI-proposed edit is shown as a **diff against the current content**, never as a silent replacement — this is a non-negotiable trust boundary for the product, since users are editing real documents they care about.
- Long-running AI operations (e.g., summarizing a large folder) show progress feedback rather than a frozen UI, and are cancellable mid-operation.
- The AI Workspace clearly indicates which provider/model is currently active (Section 4.8) so the user always knows what's answering them, especially relevant when local models and hosted models behave differently.
- If AI context assembly has to truncate or omit something (e.g., a very large file can't fully fit in context), Ink tells the user what was included and what was left out rather than silently working with partial information.

**Data It Owns:** conversation/session history per workspace (so AI interactions have continuity within a project), context-assembly rules and their current configuration.

**Interactions With Other Modules:** reads from Markdown Workspace (active file/selection), Workspace Management (folder structure), Git Integration (diffs, commit history) as needed per request; writes proposed edits back into the Markdown Workspace as reviewable diffs; slash commands (4.9) are the structured entry points into this module's workflows.

**Future Enhancements:** persistent per-workspace AI "memory" of project conventions (style guide, terminology) that gets automatically included in relevant requests; multi-turn agentic workflows that can plan and execute a multi-step documentation task with checkpoints for user approval.

---

### 4.8 Module: AI Providers

**Purpose:** Decouple Ink's AI-powered workflows from any single AI vendor, so users can choose based on cost, privacy, capability, or personal preference — including fully local, offline-capable options.

**Experience:**

Ink supports **Ollama** and **LM Studio** (local, self-hosted model runners), and **OpenAI**, **Anthropic**, and **OpenRouter** (hosted providers) through a unified provider abstraction. In Settings (Section 4.15), a user configures one or more providers — API keys for hosted providers, connection endpoint for local runners — and selects a **default provider and model** for general use, with the ability to override per-session or per-slash-command (e.g., a user might default to a fast local model for quick rewrites but explicitly choose a stronger hosted model for a `/review` on an important document).

**Model selection UX** shows, per provider, the available models (fetched live where the provider supports listing, or configured manually for providers/setups that don't), with basic capability indicators surfaced where knowable (e.g., context window size) to help users pick appropriately for a given task.

**Behavior & Edge Cases:**

- If a configured provider is unreachable (local runner not started, hosted API key invalid or rate-limited), Ink surfaces a clear, specific error in the AI panel rather than a generic failure, and offers a one-step path to switch to a different configured provider for that request.
- Provider credentials are stored using the most secure mechanism available on the user's platform (OS-level credential storage where possible) rather than in plain-text config files.
- Switching providers mid-session preserves the AI Workspace conversation history where reasonably possible, with a clear indicator that the provider changed partway through.

**Data It Owns:** provider configuration (endpoints, model preferences, default selections); credentials are owned by this module but stored via secure OS-level mechanisms rather than in Ink's own state.

**Interactions With Other Modules:** the AI Workspace module calls into this abstraction for every AI request; Settings surfaces this module's configuration UI.

**Future Enhancements:** automatic per-task provider routing (e.g., always use a local model for quick inline rewrites, always use a specific hosted model for `/review`); cost tracking/estimation for hosted providers; provider fallback chains (try provider A, fall back to B on failure).

---

### 4.9 Module: Slash Commands

**Purpose:** Turn common AI-assisted workflows into fast, discoverable, structured commands rather than requiring free-form prompt-writing for repeated tasks.

**Experience:** Slash commands are invoked inline (typed directly in the AI panel or, for text-scoped commands, triggered from a selection context menu) and each represents a specific, well-defined workflow:

- **`/rewrite`** — takes the current selection (or full document if nothing is selected) and proposes a rewritten version per an optional style/goal argument (e.g., `/rewrite more concise`), shown as a reviewable diff.
- **`/summarize`** — produces a concise summary of the active file, a selection, or (with an explicit scope argument) an entire folder, shown in the AI panel as a standalone response rather than a document edit.
- **`/explain`** — explains a selection (prose or code) in plain language, useful for onboarding-style documentation review or understanding an unfamiliar section of a large doc.
- **`/translate`** — translates the selection or document into a specified target language, proposed as a diff (or a new file, for full-document translation, since bilingual documents commonly need to coexist).
- **`/table`** — converts loosely structured text (a list, comma-separated data, freeform notes) into a properly formatted Markdown table, proposed as a diff.
- **`/diagram`** — generates a Mermaid diagram from a natural-language description of a process, architecture, or relationship, inserted as a fenced diagram block and immediately previewed via the Markdown Rendering module.
- **`/commit`** — analyzes the currently staged Git changes and proposes a commit message (subject + body) following conventional commit-message quality practices, which the user can accept, edit, or regenerate before committing.
- **`/review`** — performs a structured review of a document or diff, surfacing specific, actionable feedback (clarity issues, inconsistencies, missing sections) rather than vague commentary, presented as an annotated list tied to specific locations in the document.
- **`/todo`** — scans the active file or workspace for TODO-style markers and open action items, surfacing them as a consolidated, navigable list.
- **`/continue`** — given the current document's content and trajectory, proposes a continuation (next section, next paragraph) that the user can accept, edit, or discard — useful for overcoming a blank-page moment mid-document.

**Behavior & Edge Cases:**

- Every slash command that modifies document content routes through the same diff-review mechanism as general AI Workspace edits (Section 4.7) — there is no separate "trust tier" for slash commands vs. free-form requests.
- Commands that take an argument (like `/rewrite more concise`) have sensible default behavior when invoked with no argument, and the command palette / AI panel surfaces the available argument patterns as inline hints.
- Slash commands are designed to be **extensible** — the Plugin System (Section 4.13) is expected to allow custom slash commands in the future, so the command registry is treated as an open list, not a hardcoded set.

**Data It Owns:** the slash command registry and per-command argument-parsing rules.

**Interactions With Other Modules:** every slash command is a structured entry point into the AI Workspace (4.7); `/commit` and `/review` pull context from Git Integration (4.6); `/diagram` output is rendered by Markdown Rendering (4.2).

**Future Enhancements:** user-defined custom slash commands (workspace-level, saved as simple prompt templates with argument placeholders); command chaining (e.g., a single invocation that runs `/review` then offers `/rewrite` on each flagged section).

---

### 4.10 Module: Terminal Experience

**Purpose:** Define how Ink feels to use, moment to moment — the layer of polish that determines whether a terminal app feels professional or feels like a script with a UI bolted on.

**Experience:**

Layouts are built from OpenTUI's component system (Section 2) into named regions that compose per Workspace Mode (Section 14): a persistent status bar (branch, file stats, mode indicator, AI provider indicator), a togglable sidebar (file tree, or contextually swapped for Git/AI/Search depending on mode), a main content area (editor, split editors, or preview), and overlay layers (command palette, modals, notifications).

**Colors** are theme-driven (Section 4.16) with semantic meaning preserved across themes (e.g., "added" is always a consistent hue across all themes, just adjusted for palette). **Terminal-friendly animations** are used sparingly and purposefully — a subtle transition when switching modes, a loading indicator for AI/search operations — never as decoration for its own sake, respecting that excessive terminal animation reads as gimmicky rather than polished.

**Keyboard navigation** is comprehensive: every pane is reachable via a consistent focus-cycling shortcut, every list is arrow-key navigable, and focus state is always visually obvious (a clear border or background treatment on the focused pane). **Mouse interaction** layers on top for users who want it — clicking to focus a pane, clicking a file to open it, dragging to resize a split — without ever being required.

**Behavior & Edge Cases:**

- **Window resizing** triggers responsive re-layout: below a configurable width/height threshold, Ink degrades gracefully (e.g., auto-collapsing the sidebar, stacking what would be a split into a single pane with a switcher) rather than rendering a broken or clipped layout.
- **Capability detection** (Section 4.2's rendering fallbacks depend on this) determines what the current terminal supports — true color vs. 256-color vs. basic ANSI, image protocol support, Unicode/box-drawing character support — and Ink adjusts rendering fidelity accordingly, always preferring a clean degraded experience over a broken one.
- **Performance under large projects** (thousands of files, large individual files) is treated as a first-class constraint on every module, not an edge case — the Terminal Experience module is where the "does this still feel instant" bar is enforced holistically.
- **Accessibility** considerations include respecting terminal-level accessibility settings (screen reader compatibility where the terminal emulator supports it), sufficient contrast ratios as a hard requirement for every theme, and configurable reduced-motion mode that disables non-essential animation.

**Data It Owns:** detected terminal capability profile, current layout/focus state.

**Interactions With Other Modules:** every module renders through this layer's layout and theming rules; Workspace Modes (Section 14) are defined as specific configurations of this module's layout system.

**Future Enhancements:** user-customizable layout presets beyond the built-in modes; richer terminal graphics support as terminal emulator capabilities evolve industry-wide.

---

### 4.11 Module: Workspace Modes

**Purpose:** Let the same underlying workspace be reconfigured for the task at hand, rather than forcing one fixed layout for fundamentally different activities (deep writing vs. reviewing a PR vs. presenting).

**Experience:** Modes are switched via the command palette or a dedicated keybinding, and each reconfigures which panels are visible, their sizing, and which is focused by default:

- **Writing Mode** — sidebar minimized, single editor (or editor+preview split) maximized, status bar shows word count/reading time prominently. Optimized for heads-down drafting.
- **Research Mode** — a multi-pane layout supporting several open reference files/notes simultaneously alongside an active draft, with Search surfaced prominently for quick reference lookup.
- **AI Mode** — the AI Workspace panel is given primary screen real estate alongside the active document, optimized for iterative AI-assisted editing sessions.
- **Review Mode** — diff-centric layout (Git diff or AI `/review` output) with the annotated feedback list and the document shown side-by-side.
- **Git Mode** — the Git panel (status, staging, diff, history) takes primary focus, with the editor available but secondary — optimized for a dedicated "handle my Git workflow" session.
- **Presentation Mode** — a clean, chrome-minimized full-screen rendering of the active document's preview, intended for reading a document aloud or sharing a screen without exposing editor UI.
- **Distraction-Free Mode** — everything but the editor itself is hidden (no status bar, no sidebar, no tabs), for maximum focus on the current sentence.

**Behavior & Edge Cases:**

- Mode switches are **non-destructive** — switching from Writing Mode to Git Mode and back restores exactly the panel state Writing Mode had before the switch, including scroll and cursor position.
- Modes are a layout preset, not a restriction — a user in Distraction-Free Mode can still invoke the command palette or a keyboard-driven action; only the *visible chrome* is reduced, not the underlying functionality.
- Per-workspace default mode is configurable (a docs-heavy repo might default to Writing Mode; an active-development repo might default to Git Mode).

**Data It Owns:** mode definitions (which regions are visible/sized how) and the current active mode per workspace session.

**Interactions With Other Modules:** this module is essentially a curated configuration layer over the Terminal Experience module's layout system; every other module's panel is a candidate for inclusion in a mode's layout.

**Future Enhancements:** user-defined custom modes (save current panel arrangement as a named, reusable mode); mode-specific keybinding overlays.

---

### 4.12 Module: Dashboard

**Purpose:** Give the user a useful, orienting landing screen when Ink starts without a specific workspace already implied — a place to decide *what to work on* rather than *how to work*.

**Experience:** The startup dashboard is organized into scannable sections: **Recent projects** (workspaces opened before, most recent first), **Pinned workspaces** (explicitly starred projects that stay put regardless of recency), **Recent files** (across all recent workspaces, for jumping straight into a specific document without navigating through the project tree first), **Git status** summary (a compact view of which recent projects have uncommitted changes or are ahead/behind their remote, so a user can spot "oh, I left something uncommitted" at a glance), **Tasks** (an aggregated view of `/todo`-style markers across pinned/recent projects), **Bookmarks** (user-marked locations within documents, distinct from file-level pinning), **Recent searches** (quick access to re-run a recent search across a workspace), **Daily notes** (if the user has opted into a daily-note convention, quick access to today's and recent days' notes), **AI activity** (a light summary of recent AI Workspace sessions, useful for picking up an AI-assisted task where it was left off), and **Quick actions** (new project, open folder, open recent, clone repository).

**Behavior & Edge Cases:**

- The dashboard is read-first: every section is a launcher into the relevant module (clicking a recent project opens that workspace; clicking a Git status entry opens that workspace directly into Git Mode) rather than a separate place to perform actions.
- Sections are individually collapsible/reorderable so a user can de-emphasize sections irrelevant to their workflow (e.g., a user who never uses Daily Notes can collapse that section permanently).
- The dashboard is genuinely useful to return to mid-session too (not just at startup) — accessible via the command palette as a "Home" action from within any workspace.

**Data It Owns:** dashboard layout/section preferences (visibility, order).

**Interactions With Other Modules:** aggregates data from Workspace Management (recent/pinned projects), Git Integration (status summaries), Search System (recent searches), AI Workspace (recent activity) — the Dashboard owns no primary data itself, only presentation and aggregation logic.

**Future Enhancements:** cross-project task aggregation with due dates; a lightweight "what changed since I last opened this project" summary per recent project.

---

### 4.13 Module: Plugin System

**Purpose:** Establish, from the outset, the extension points that let Ink's community add capability without requiring changes to core — even though the initial release ships a fixed, curated feature set.

**Philosophy:** The plugin system is designed around a simple principle: **plugins extend, they don't fork the core experience.** A plugin should be able to add a new panel, a new command-palette category, a new slash command, or a new export format — without being able to silently override or destabilize the modules described in this document. This keeps the core product's quality bar consistent regardless of which plugins a given user has installed.

**Extension Points (conceptual, for future design):**

- **New panels/views** registered into the sidebar or as a new Workspace Mode.
- **New command palette entries and categories.**
- **New slash commands**, following the same diff-review contract as built-in ones (Section 4.9).
- **New export formats** (Section 4.14), registered as additional output targets.
- **New AI providers** (Section 4.8), for community-maintained integrations beyond the built-in five.

**Potential First-Wave Plugins:** a calendar view for date-oriented notes; a Kanban board for lightweight task tracking within a docs repo; a mind-map view built from a document's outline/link structure; a slides plugin for presenting a document as a deck (complementary to Presentation Mode); an RSS reader panel for research workflows; a database/table viewer for structured-data-heavy projects; a dedicated terminal panel for running shell commands without leaving Ink; a standalone task manager beyond simple `/todo` scanning; documentation generators for specific ecosystems (e.g., API doc scaffolding from code comments); and general developer utilities (JSON formatting, regex testing, timestamp conversion) as quick-access tools.

**Behavior & Edge Cases:**

- Plugins are discoverable and manageable through Settings (Section 4.15), with clear indication of what each plugin adds, what permissions/data access it requires, and an easy enable/disable/remove path.
- The plugin system is designed with the same trust boundaries as the AI Workspace — a plugin that proposes document edits should be expected to go through the same diff-review UX, not a silent-write shortcut.

**Data It Owns:** plugin registry, per-plugin enabled/disabled state and configuration.

**Interactions With Other Modules:** by design, touches nearly every module through its extension points — this is intentional, since the plugin system's entire purpose is to be a sanctioned way to extend the rest of the product.

**Future Enhancements:** a plugin marketplace/directory; sandboxed plugin execution for safety; a plugin SDK/authoring guide as a separate document once the extension API stabilizes.

---

### 4.14 Module: Export System

**Purpose:** Let the work done inside Ink leave the terminal cleanly, since not every consumer of a document lives in Ink.

**Experience:** Export is available per-file, per-folder, or per-workspace, with target formats including: **Markdown** (useful for normalized/cleaned-up export, e.g., resolving includes or stripping Ink-specific frontmatter extensions), **HTML** (a standalone, styled HTML rendering suitable for sharing or hosting), **PDF** (print-ready, using the same rendering fidelity as the Markdown Rendering module where possible), **static documentation site generation** (a multi-file folder exported as a navigable static site — index, per-page navigation, consistent styling — for docs-heavy projects), **print-friendly output** (a layout variant of HTML/PDF export optimized specifically for physical printing — adjusted margins, page-break handling at logical section boundaries), and **project archives** (a full workspace export as a compressed archive, useful for handoff or backup outside of Git).

**Behavior & Edge Cases:**

- Export always previews before writing to disk — a summary of what will be generated (file count, target format, destination path) is confirmed before the operation runs.
- Folder/workspace exports respect the same ignore-pattern conventions as the Search System's default excludes, so generated build artifacts or dependency folders aren't accidentally included.
- Export operations that could take meaningful time (large static site generation) show progress and are cancellable.

**Data It Owns:** export configuration presets (per-format settings, e.g., PDF margin/page-size preferences) and export history.

**Interactions With Other Modules:** consumes the Markdown Rendering module's rendering logic as the basis for HTML/PDF fidelity; consumes Workspace Management's folder structure and ignore-pattern rules for multi-file exports; can be a target for Plugin System extensions (custom export formats).

**Future Enhancements:** direct publishing integrations (push exported static site to a hosting target); custom export templates/themes distinct from the in-app editing theme.

---

### 4.15 Module: Settings

**Purpose:** Give every other module's configuration a single, coherent, discoverable home.

**Experience:** Settings is organized into the same categories that appear throughout this document, so a user's mental model of "where do I configure X" matches the product's own information architecture: **Editor** (autosave behavior, undo granularity, line-ending defaults), **Appearance** (active theme, layout density), **Themes** (theme selection and custom theme management, Section 4.16), **Fonts** (terminal font is largely outside Ink's control, but Ink can express preferences for glyph/ligature-dependent rendering choices where relevant), **Keybindings** (full remapping, Section 4.17), **AI** (provider configuration, default model, per-slash-command overrides — Sections 4.7–4.9), **Git** (diff view preference, commit message conventions, default remote behavior), **Workspace** (per-project overrides of global settings, default Workspace Mode), **Performance** (large-file thresholds, indexing behavior, animation/reduced-motion toggles), **Rendering** (Markdown preview fidelity preferences, fallback behavior for unsupported terminal features), **Plugins** (installed plugin management, Section 4.13), and **Accessibility** (contrast, reduced motion, screen-reader-oriented preferences).

**Behavior & Edge Cases:**

- Settings changes apply live wherever technically reasonable (theme changes, keybinding changes) without requiring a restart.
- Settings are searchable — the same fuzzy-search interaction pattern used elsewhere in Ink applies to finding a specific setting by name or description, avoiding the "I know this setting exists somewhere in a deep menu tree" problem common to complex apps.
- Global settings vs. per-workspace overrides are visually distinguished, so a user editing a workspace-scoped setting always knows it won't affect other projects.

**Data It Owns:** the full settings schema, global values, and per-workspace override values.

**Interactions With Other Modules:** every module reads its configuration from here; this module has no independent function beyond being the coherent front-end for everyone else's configuration.

**Future Enhancements:** settings sync/export across machines; settings profiles (e.g., a "presentation" settings profile vs. a "deep work" profile, switchable independently of Workspace Modes).

---

### 4.16 Module: Themes

**Purpose:** Let Ink look and feel intentional and modern, and let users express preference, without ever compromising the terminal-compatibility and accessibility bar.

**Experience:** Ink ships with a curated set of **dark themes** (the expected default context for most terminal usage) and **light themes** (for users in bright environments or with a light-terminal preference), each covering the full semantic palette Ink's UI relies on (focus state, Git status colors, callout/admonition colors, syntax highlighting colors, diff add/remove colors). **Custom themes** are supported via a straightforward token-based definition, so community members can create and share themes without needing to understand Ink's rendering internals. A distinct but coordinated **syntax theme** layer governs code-block highlighting specifically, so a user can pair, for instance, a preferred UI theme with a preferred code syntax theme independently.

**Terminal compatibility** is handled by defining every theme in terms of a capability-tiered palette — a full true-color definition, with an automatically derived 256-color and basic-ANSI fallback — so a theme author defines a theme once and it degrades gracefully rather than needing separate theme definitions per terminal capability tier.

**Behavior & Edge Cases:**

- Every shipped theme is verified against a minimum contrast ratio standard as a hard quality bar, not a suggestion, since accessibility (Section 4.10) depends on it.
- Live theme preview (seeing the effect of a theme change immediately, before committing) is part of the Settings experience for theme selection.

**Data It Owns:** theme definitions (shipped and custom/imported), active theme selection.

**Interactions With Other Modules:** every visual surface across every module reads from this module's active theme tokens rather than hardcoding any color.

**Future Enhancements:** a theme gallery/marketplace akin to the plugin system's future marketplace; auto dark/light switching based on system-level terminal appearance settings where detectable.

---

### 4.17 Module: Keybindings

**Purpose:** Ensure Ink's keyboard-first philosophy (Section 1.3) is backed by a coherent, professional, and fully remappable shortcut system.

**Experience:** Default keybindings are designed to feel immediately familiar to users coming from modern editors (drawing conventions from VS Code and similar tools where they don't conflict with essential terminal reservations), covering: **navigation** (pane focus cycling, file tree navigation, outline jump), **editing** (standard text editing plus Markdown-specific shortcuts — toggle bold/italic, insert link, toggle checkbox), **searching** (open search, next/previous match, toggle replace), **Git** (stage/unstage, open diff, commit, push/pull), **AI** (open AI panel, trigger inline rewrite on selection, invoke slash command menu), **workspace management** (new file/folder, open recent, switch workspace), **panes** (split, close split, resize), and **command palette** invocation itself.

**Behavior & Edge Cases:**

- Every binding is **fully remappable** through Settings, with conflict detection (Ink warns, rather than silently allowing, a new binding that collides with an existing one, and requires explicit confirmation to override).
- Keybinding sets can be **exported/imported** as a portable configuration, useful for users who want to replicate their setup across machines or share a convention with a team.
- A **cheat-sheet overlay** (invoked via its own shortcut) shows the current effective keybindings contextually — filtered to what's relevant in the currently focused pane/mode — rather than dumping the entire global list every time.

**Data It Owns:** the full keybinding map (default and user-overridden).

**Interactions With Other Modules:** every action registered in the Command Palette (4.5) is a candidate for a keybinding; this module is the input-routing layer that ultimately decides which module receives a given keypress based on current focus.

**Future Enhancements:** vim-style modal keybinding preset as an alternative default scheme for users who prefer it; per-Workspace-Mode keybinding overlays.

---

### 4.18 Performance Goals

Performance is treated as a product requirement with measurable targets, not a vague aspiration, because a terminal app that feels slow undermines its entire value proposition against GUI alternatives.

- **Fast startup:** Ink should be usable (workspace loaded, ready for input) near-instantly from launch — startup time should not become a daily-friction point regardless of workspace size.
- **Low memory usage:** memory footprint should scale with what's actually open (active tabs, loaded search index) rather than the full size of the workspace on disk, so large repositories don't degrade performance for users only actively working with a handful of files.
- **Responsive typing:** keystroke-to-render latency must remain imperceptible even in large files, achieved through the large-file mode strategy described in Section 4.1.
- **Efficient indexing:** background indexing for Search (4.4) should not visibly compete with foreground responsiveness — a user should never feel Ink "pause" because it's indexing.
- **Instant search:** search results should update as-you-type without perceptible lag, as established in Section 4.4.
- **Smooth scrolling:** both raw editing and rendered preview scrolling should remain smooth even in long documents, relying on viewport virtualization (Section 2.1).
- **Scalable workspaces:** every above goal should hold from a small personal notes folder up through a large multi-thousand-file documentation monorepo — performance goals are explicitly not scoped only to small/demo-sized projects.

---

### 4.19 User Experience: Core Journeys

This section walks through complete, end-to-end user journeys to validate that the modules above compose into coherent real-world workflows, not just isolated features.

**Journey: Creating a new project.** A user launches Ink to the Dashboard (4.12), selects "New Project" from Quick Actions, chooses a folder location and an optional starter template (blank, README-only, docs-site skeleton), and lands directly in the new Workspace (4.3) with a first file already open in the Markdown Workspace (4.1), ready to type — no intermediate empty-state screen required.

**Journey: Writing documentation.** A user opens an existing project, switches to Writing Mode (4.11), opens the target file, and drafts with the Outline panel tracking structure live and the Markdown Rendering preview (4.2) split alongside for continuous visual feedback. Periodically they invoke `/rewrite` or `/summarize` (4.9) on a rough section, reviewing the proposed diff before accepting. Autosave (4.1) means there's never a manual save step interrupting flow.

**Journey: Managing notes across a research project.** A user in Research Mode (4.11) has several reference files open in a split alongside their active draft, uses Search (4.4) to jump to a specific heading across the workspace when they need to cross-reference something, and uses Bookmarks (surfaced on the Dashboard, 4.12) to mark specific passages for later return.

**Journey: Searching a workspace.** A user invokes Search (4.4), starts in fuzzy file mode, switches to content search mid-query when a filename-based search doesn't surface what they need, narrows with a folder filter, and jumps directly into the matched file at the matched line — the search overlay closing automatically once a result is selected, landing them in the Markdown Workspace with the match highlighted.

**Journey: Using AI.** A user selects a rough paragraph, triggers an inline rewrite action, reviews the proposed diff, requests a revision with a follow-up instruction in the AI panel (4.7), and accepts the second version — the entire interaction happening without leaving the document or losing their place in it.

**Journey: Reviewing Git changes.** A user switches to Git Mode (4.11) at the end of a writing session, reviews the diff of everything changed (4.6), uses `/review` (4.9) to get AI-assisted feedback on the diff before committing, stages selected changes, invokes `/commit` for a proposed commit message, edits it slightly, and commits — then pushes, all without leaving Ink.

**Journey: Publishing documentation.** A user with a completed docs folder invokes Export (4.14) at the workspace level, selects static documentation site generation, previews the file/page count that will be generated, confirms, and receives a ready-to-host static site output — a workflow that previously might have required a separate static-site-generator toolchain, now handled inline.

---

## 5. Long-Term Vision

### 5.1 Mission

Ink's mission is to prove that terminal-native software can be the *better* choice for serious technical writing and project work — not a minimal fallback for people who happen to prefer terminals, but a genuinely superior workflow for the specific job of thinking and writing inside a software project.

### 5.2 Core Principles (Restated for the Long Term)

The values in Section 1.3 — keyboard-first, minimal context switching, low cognitive load, native performance, and designed-in extensibility — are treated as permanent product constraints, not launch-phase priorities that get relaxed as the feature set grows. Every future module or plugin proposed for Ink should be evaluated against whether it strengthens or dilutes these principles.

### 5.3 What Differentiates Ink From Traditional Markdown Editors

Most Markdown editors are either GUI-first tools that happen to support Markdown, or minimal terminal editors that treat Markdown as plain text with light syntax highlighting. Ink's differentiation is that it treats the **entire project** — files, structure, Git history, and AI assistance — as the unit of design, inside an environment (the terminal) that technical users already live in for everything else they do. The absence of context-switching is the product, not a nice-to-have on top of a text editor.

### 5.4 Why Developers Would Adopt It

Developers already spend the majority of their working time in a terminal for code, Git, and system tasks. Every time they need to write a README, a design doc, a changelog, or research notes, they currently leave that environment for a GUI tool, and leave it again for Git operations related to that same work, and leave it again to ask an AI tool for help. Ink's adoption case is simply: **stop leaving.** The cost of switching to Ink is low for anyone already terminal-native, and the ongoing productivity benefit compounds every time a context switch that used to happen doesn't.

### 5.5 How Ink Could Evolve Over Several Years

In its first phase, Ink should focus entirely on making the core modules in Section 4 excellent and reliable — a smaller, polished feature set beats a sprawling, uneven one. In a second phase, the Plugin System (4.13) matures from a designed-but-empty extension point into an active ecosystem, likely starting with the first-wave plugins already scoped in this document (Kanban, calendar, mind map) as reference implementations that also validate the plugin API itself. In a third phase, collaborative features (real-time co-editing, shared workspace sessions) become viable to explore, once the single-user experience is mature enough that collaboration is additive rather than a distraction from core quality. Throughout, AI capability (Sections 4.7–4.9) should track the broader AI ecosystem's evolution — new providers, new interaction patterns — without ever making Ink feel provider-locked or chatbot-first.

### 5.6 Potential Ecosystem Growth

A mature Ink ecosystem looks like: a healthy library of community themes (4.16) and plugins (4.13); shared, exportable keybinding and settings profiles (4.15, 4.17) that let teams standardize a working convention; community-authored slash commands and AI provider integrations (4.8, 4.9) that extend AI capability without requiring core changes; and, eventually, Ink becoming a reasonable default recommendation for any open-source project's documentation workflow — the same way certain editors became the default recommendation for general-purpose coding.

---

## 6. Summary

Ink is specified in this document as a terminal-native workspace, not an editor — nineteen interlocking modules (Markdown Workspace, Rendering, Workspace Management, Search, Command Palette, Git Integration, AI Workspace, AI Providers, Slash Commands, Terminal Experience, Workspace Modes, Dashboard, Plugin System, Export, Settings, Themes, Keybindings, plus the cross-cutting Performance Goals and User Experience journeys) that together let a developer think, write, navigate, search, manage Git, and collaborate with AI without ever leaving the terminal. Every module in this document is designed to the same standard: a clear purpose, a concrete experience, explicit edge-case handling, clearly owned data, explicit interactions with the rest of the system, and room to grow — so that whoever eventually implements Ink is building from intent, not guesswork.
