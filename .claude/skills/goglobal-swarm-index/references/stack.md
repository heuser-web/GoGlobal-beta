# Stack

Flat facts. No prose. If a version here is wrong, fix it here — not in SKILL.md.

## Runtime

| Layer | Tech | Version |
|---|---|---|
| Framework | React | 19 |
| Build tool | Vite | 6 |
| Language | JSX | — (no TypeScript, ever) |
| Styling | Tailwind CSS | 4 |
| Animation | Framer Motion | latest |
| AI SDK | @google/generative-ai | latest |
| Icons | Lucide React | latest |
| Package manager | npm | — (no yarn, no pnpm) |

## Fonts

- Display: Syne (Google Fonts)
- Body: Plus Jakarta Sans (Google Fonts)
- Loaded in `index.html`, not imported in CSS

## Environment variables

All live in `.env` at project root. Never hardcode.

- `VITE_GEMINI_API_KEY` — Romey chatbot
- `OPENAI_API_KEY` — browser-use backend
- `ANTHROPIC_API_KEY` — optional browser-use backend
- `GOOGLE_API_KEY` — optional, for Google services

Vite only exposes vars prefixed with `VITE_` to the client. Server-only
keys (OpenAI, Anthropic) must not have that prefix.

## Paths

- Mac: `/Users/romanheuser/GoGlobal Beta 1.0/`
- Windows: `C:\Users\romanheuser\Projects\goglobal-v2`
- Shells: zsh on Mac, PowerShell on Windows

## Entry point

`src/App.jsx` — currently monolithic, being extracted in Phase 1. When in
doubt about where code lives, it's probably still in App.jsx.

## Gemini models (Romey)

Configured in `src/App.jsx` → `GEMINI_CONFIG.model`.

- Primary: `gemini-2.5-flash-preview-05-20`
- Fallback 1: `gemini-2.0-flash`
- Fallback 2: `gemini-1.5-flash`