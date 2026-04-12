# Anti-patterns

Wrong / right pairs, with the *why*. The why is the part that matters —
patterns without reasons rot the moment the reason changes.

---

## Loading every skill up front

**Wrong:** Read SKILL.md, then immediately load stack.md, design-system.md,
specialists.md, and anti-patterns.md "to be ready."

**Right:** Read SKILL.md. Classify the request. Load only the reference
files the selected specialist actually needs.

**Why:** Context is finite. Pre-loading references for a task that doesn't
need them wastes the budget you'll want later for actual reasoning. The
router's whole point is demand-loading.

---

## Making scope decisions without Shannon

**Wrong:** "This feels like Phase 3 work but let me just build it anyway."

**Right:** If you're unsure whether a task fits the current phase, route
to shannon-ops-agent first. If Shannon says it's fine or surfaces a
tradeoff Roman can decide, then proceed.

**Why:** Roman is a solo founder. Silent scope creep is how projects
stall. Shannon's job is to make scope decisions visible, not to block
them — but if specialists make those decisions silently, Shannon never
gets the chance.

---

## Using Tailwind v3 syntax

**Wrong:** `module.exports = { theme: { extend: { colors: {...} } } }` in
a `tailwind.config.js` file.

**Right:** `@import "tailwindcss"; @theme { --color-accent-rose: #FF2D55; }`
in the main CSS file.

**Why:** This project is on Tailwind v4. The v3 config pattern *partially*
works but causes subtle bugs where some utilities resolve and others
don't. If you see a `tailwind.config.js` in the repo, it's a migration
artifact — the source of truth is the `@theme` block.

---

## Writing TypeScript

**Wrong:** Creating `.ts` or `.tsx` files, adding type annotations in
JSX files, importing from `@types/*`.

**Right:** JSX only. Document types with JSDoc comments if you need to
communicate shape.

**Why:** This codebase chose JSX deliberately. Mixing TS into a JSX
project creates build config drift and gives future-you two conventions
to maintain. Pick one and stay.

---

## Using non-Lucide icons

**Wrong:** Importing from Heroicons, Font Awesome, react-icons, or
pasting inline SVG icon markup.

**Right:** `import { ChevronRight } from 'lucide-react'`.

**Why:** Icon consistency is visual consistency. Mixing icon libraries
means mixing stroke weights, corner radii, and metaphors — and that
shows up as a vague "this feels off" quality you can't pin down. One
icon library, every time.

---

## Loading browser-use alongside other skills

**Wrong:** "I'll use browser-use to check the npm version and
react-architect to write the component in the same turn."

**Right:** Run browser-use. End the turn. Start a new turn for the
component work.

**Why:** browser-use is a separate Python process with its own LLM and
its own context. Trying to interleave it with in-Claude specialists
creates confused state where Claude isn't sure which agent "owns" the
current step. Isolate it.

---

## Reaching for browser-use first

**Wrong:** "I need the latest version of framer-motion, let me fire up
browser-use."

**Right:** `curl https://registry.npmjs.org/framer-motion/latest` — two
seconds, zero tokens, done.

**Why:** browser-use is the heaviest tool in the kit. Every task has a
cheaper alternative *unless* the site specifically requires a rendered
browser. See browser-use/SKILL.md for the full decision procedure.

---

## Using CSS `@keyframes` for motion

**Wrong:** `@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`
plus an `animation:` property.

**Right:** `<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} />`.

**Why:** Two motion systems in one project means two places to look when
motion is wrong, two mental models for timing, and two ways to stagger.
Framer Motion is the one choice. The only exception is hover color
fades, which can stay as Tailwind `transition-colors`.

---

## Hardcoding shell syntax

**Wrong:** `rm -rf dist/` in instructions, without checking which shell
Roman is on.

**Right:** Know the environment. On Windows PowerShell, `rm` is an alias
but `rm -rf` isn't — use `Remove-Item -Recurse -Force`. On Mac zsh, the
Unix form is fine.

**Why:** Roman works on both Mac and Windows. Instructions that only
work in one shell fail silently in the other. When in doubt, ask which
machine he's on — or use a Node script (`rimraf`) that works everywhere.

---

## Reconstructing what's in memory

**Wrong:** Restating Roman's name, role, location, paths, and project
history at the top of every skill file.

**Right:** Reference things by the shortest name that identifies them.
"The project" means GoGlobal V2 in this context. "Roman" is enough.

**Why:** Memory carries this context across sessions. Duplicating it in
skill files costs tokens on every load and goes stale the moment
something changes. Skills should describe *behavior*, not biography.