# Specialists

This is the catalog the router reads in Step 2. Each entry has four
fields: *domain*, *pick when*, *don't pick when*, *pairs badly with*.

The "don't pick when" field is load-bearing. It's how the router avoids
wrong routes when keywords match but intent doesn't.

---

## react-architect

- **Domain:** `ui` — component structure, state, hooks, data flow
- **Pick when:** the task is "build a component," "refactor this hook,"
  "lift state up," "handle this form submission," or anything where the
  hard part is *how the code is organized*
- **Don't pick when:** the hard part is how it *looks* — that's
  ui-composer. If the visual design is already decided and you just need
  the JSX scaffolding, react-architect is right.
- **Pairs badly with:** nothing — this is the most pairable specialist

## ui-composer

- **Domain:** `ui` — visual design, layout, spacing, hierarchy, aesthetic
- **Pick when:** the task is "design this page," "make this look right,"
  "lay out this grid," "apply glassmorphism," "theme this toggle," or
  anything where the hard part is *visual decisions*
- **Don't pick when:** the component already looks right and just needs
  wiring — that's react-architect
- **Pairs badly with:** nothing

## animation-engineer

- **Domain:** `animation` — Framer Motion, transitions, scroll effects,
  micro-interactions
- **Pick when:** the task mentions motion, animation, transitions,
  parallax, scroll-triggered reveals, page transitions, or hover effects
  beyond a color fade
- **Don't pick when:** the "animation" is just a CSS color transition on
  hover — that's ui-composer territory, not worth spinning up a motion
  specialist
- **Pairs badly with:** nothing

## debugger-agent

- **Domain:** `debug` — things that are broken
- **Pick when:** the task contains "broken," "not working," "error,"
  "blank screen," "console says," "build failing," "styles not applying,"
  or any evidence that something *was* working and now isn't
- **Don't pick when:** the code was never working — that's not a debug,
  that's a build. Route to the specialist for the thing being built.
- **Pairs badly with:** nothing — debugger runs first and hands off

## city-data-agent

- **Domain:** `data` — the city database, events, trails, gems, parks
- **Pick when:** adding a new city, updating city config, adding or
  editing events/trails/gems/parks data
- **Don't pick when:** the task is "make the city page *look* different"
  — that's ui-composer. city-data-agent owns the data, not the
  presentation.
- **Pairs badly with:** nothing, but often hands off to api-integration
  for live data sources

## gemini-ai-agent

- **Domain:** `ai` — Romey the chatbot, Gemini SDK, prompt engineering,
  vibe selection
- **Pick when:** the task touches Romey's behavior, system prompt, model
  selection, vibe mode, or anything Gemini-specific
- **Don't pick when:** the task is just "add a chat UI" — that's
  react-architect. gemini-ai-agent is for the AI layer, not the chat
  interface.
- **Pairs badly with:** nothing

## api-integration-agent

- **Domain:** `api` — external API wiring (Ticketmaster, Yelp, Google
  Maps, Unsplash)
- **Pick when:** integrating a new API, handling keys, writing fetch
  logic, shaping API responses for the app
- **Don't pick when:** the API is already wired and you just need to
  display the data differently — that's ui-composer
- **Pairs badly with:** nothing, often hands off to browser-use for doc
  lookups

## accessibility-agent

- **Domain:** `a11y` — WCAG, screen readers, focus management, contrast
- **Pick when:** explicit a11y work, accessibility audits, fixing
  reported a11y issues, adding aria-* attributes thoughtfully
- **Don't pick when:** you just need to add an `alt` attribute to an
  image — that's any specialist's job, not a handoff
- **Pairs badly with:** nothing

## responsive-agent

- **Domain:** `responsive` — breakpoints, mobile layouts, touch targets,
  viewport issues
- **Pick when:** the bug or task is specifically about mobile, tablet,
  touch, overflow on small screens, or cross-device testing
- **Don't pick when:** you're designing the desktop layout and *also*
  want it responsive — that's ui-composer's job from the start. Don't
  route to responsive-agent as a second pass.
- **Pairs badly with:** nothing

## swarm-analytics

- **Domain:** `perf` — performance, bundle size, Core Web Vitals,
  memoization
- **Pick when:** the task is "this feels slow," "optimize X," "reduce
  bundle," "Lighthouse says Y," or anything with a measurable
  performance goal
- **Don't pick when:** the perceived slowness is actually a missing
  loading state — that's react-architect plus ui-composer
- **Pairs badly with:** nothing

## deploy-agent

- **Domain:** `deploy` — Vercel config, production builds, environment
  setup, shipping
- **Pick when:** the task is about going live, vercel.json,
  environment-specific config, or a build that works locally but fails
  on deploy
- **Don't pick when:** the build is failing locally — that's debugger
- **Pairs badly with:** nothing

## browser-use

- **Domain:** `web` — live browser automation via Python + Chromium
- **Pick when:** the task genuinely needs a browser. See browser-use's
  own SKILL.md for the decision procedure.
- **Don't pick when:** a curl or web_fetch would work. This is the most
  common routing mistake — browser-use is expensive and should be the
  last resort.
- **Pairs badly with:** *everything*. browser-use runs in its own Python
  process with its own context. Never pair it with another specialist in
  the same turn. Run browser-use, finish the lookup, end the turn, then
  start a new turn for the code work.

## shannon-ops-agent

- **Domain:** `ops` — project phase, scope, priority, what to work on next
- **Pick when:** the request is a *question about the project* rather
  than a request to *change the project*. "What phase are we in," "is
  this in scope," "what should I work on."
- **Don't pick when:** the request is to do work — Shannon decides,
  specialists do. If Roman says "build X," even if X might be
  out-of-scope, route to the build specialist and let *them* consult
  Shannon if needed.
- **Pairs badly with:** nothing, but never pair with a build specialist
  in the same turn — Shannon either approves and hands off, or defers
  and stops. Don't do both.