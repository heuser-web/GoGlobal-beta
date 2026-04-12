---
name: goglobal-swarm-index
description: >
  Router for all GoGlobal V2 work. Activates on any request touching the
  GoGlobal codebase: building, fixing, styling, animating, adding cities,
  integrating APIs, working with Romey or Shannon, deploying, or asking
  what to work on next. Read this file fully before taking any action on
  the project — it selects the right specialist and loads only what's needed.
---

# GoGlobal V2 Router

You are working on Roman's GoGlobal V2 codebase. This file decides *who* handles
the request. It does not do the work itself.

## Operating procedure

Follow these steps in order. Stop at the first one that resolves the request.

### 1. Classify the request

Read the user's message and place it in exactly one of these buckets:

- **Build** — create something new (component, page, feature, city)
- **Change** — modify something that exists (style, refactor, extend)
- **Fix** — something is broken, erroring, or behaving wrong
- **Integrate** — wire up an external API, SDK, or service
- **Assess** — answer a question about status, scope, or priority
- **Investigate** — look something up on the live web

If the request spans buckets, pick the bucket matching the *blocking* step —
the thing that has to happen first. State your classification in one sentence
before proceeding.

### 2. Select a specialist

Load `references/specialists.md` and match the classification + domain to a
single specialist. Domains: `ui`, `animation`, `data`, `ai`, `api`, `perf`,
`deploy`, `a11y`, `responsive`, `web`, `ops`.

Rules:
- **One specialist is the default.** Two is rare. Three is a smell — stop
  and reconsider the classification.
- **`browser-use` runs alone.** Never pair it with another specialist in the
  same turn. If you need web lookup *and* code work, do the lookup first,
  finish it, then start a new turn for the code work.
- **Ambiguous match → ask Roman.** One question, tappable options. Don't guess.

### 3. Load context on demand

Only load reference files the selected specialist actually needs:

| Specialist needs to know... | Load this |
|---|---|
| Stack versions, package rules, file layout | `references/stack.md` |
| Colors, fonts, spacing, aesthetic | `references/design-system.md` |
| What *not* to do | `references/anti-patterns.md` |

Do not pre-load these. Do not load all of them "just in case."

### 4. Defer scope decisions to Shannon

You do not decide what Roman should work on next. You do not decide if a
request fits the current phase. If the request is "what's next," "should I
do X or Y," "is this in scope," or anything about priority — route to
`shannon-ops-agent` and stop.

### 5. Act

Execute the work as the selected specialist. If mid-task you discover the
classification was wrong, stop, say so plainly, and re-route. Do not silently
switch specialists.

## Hard constraints (never violate)

- **JSX only.** No `.ts` or `.tsx` files, ever.
- **Tailwind v4 syntax only.** `@import` + `@theme`. Never `tailwind.config.js`
  v3 patterns.
- **Framer Motion for all motion.** No CSS `@keyframes`, no `transition:` for
  anything beyond hover color fades.
- **Lucide React for all icons.** No Heroicons, no Font Awesome, no inline SVG
  icon sets.
- **npm only.** Not yarn, not pnpm.
- **PowerShell on Windows, zsh on Mac.** Match shell syntax to Roman's
  current environment.

Violating any of these is a bug, not a style choice. If a request requires
violating one, surface the conflict before writing code.

## When you're unsure

Ask one question. Give tappable options. Don't write speculative code and
don't load five skills hoping one fits. Roman prefers a 10-second clarifying
question over a 2-minute wrong answer.