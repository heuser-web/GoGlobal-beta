# GoGlobal V2 — Claude Code Integration Prompt

Paste this into Claude Code to set up the project:

---

## PROMPT TO PASTE INTO CLAUDE CODE:

```
I have a complete GoGlobal V2 project ready to set up. Here's what I need:

1. **Create a new project folder** at `C:\Users\[YOUR_USERNAME]\Projects\goglobal-v2`

2. **Initialize the project** with these exact files I'll provide:
   - package.json (React 19, Vite, Tailwind v4, Framer Motion, Gemini AI SDK, Lucide React)
   - vite.config.js
   - index.html
   - src/main.jsx
   - src/index.css (Tailwind v4 with Apple-inspired design tokens)
   - src/App.jsx (full application — 800+ lines)
   - .env.example

3. **Install dependencies**:
   ```powershell
   npm install
   ```

4. **Set up the .env file**:
   - Copy .env.example to .env
   - Add my Gemini API key: VITE_GEMINI_API_KEY=<my_key>

5. **Run the dev server**:
   ```powershell
   npm run dev
   ```

The project uses:
- React 19 + Vite 6
- Tailwind CSS v4 (new @import syntax, @theme directive)
- Framer Motion for animations
- @google/generative-ai for Gemini-powered Romey chatbot
- Lucide React for icons
- Google Fonts: Syne (display), Plus Jakarta Sans (body)

The design follows:
- Apple Store luxury aesthetic (pure black backgrounds, generous spacing, pill-shaped buttons)
- Glassmorphism with blur(24px) and subtle borders
- Vegas photography backgrounds from Unsplash
- Rose (#FF2D55) + Gold (#C9A84C) accent system
- Dark mode default with light mode toggle

Key features:
- Cover page with 12 cities (Las Vegas is live, others coming soon)
- 8 content pages: Trails, Gems, Parks, Events, Romance, Squad, Meetup, Favorites
- De-duplicated events system
- Web Share API integration
- Universal favorites with global context
- Romey AI chatbot (Gemini-powered with vibe selection)
- Autocomplete on Midway Meetup inputs
```

---

## GEMINI API SETUP:

1. Go to https://aistudio.google.com/app/apikey
2. Create a new API key
3. In your project root, create `.env`:
   ```
   VITE_GEMINI_API_KEY=AIzaSy...your_key_here
   ```
4. The model used is `gemini-2.5-flash-preview-05-20` (highest available in alpha)
5. If this model is unavailable, fallback options:
   - `gemini-2.0-flash`
   - `gemini-1.5-flash`
   Change the model string in `src/App.jsx` → `GEMINI_CONFIG.model`

---

## PROJECT STRUCTURE:

```
goglobal-v2/
├── index.html
├── package.json
├── vite.config.js
├── .env.example
├── .env (you create this)
├── src/
│   ├── main.jsx
│   ├── index.css
│   └── App.jsx
└── public/
```

---

## AFTER SETUP — OPTIONAL ENHANCEMENTS:

Ask Claude Code to help with:
- "Connect the Yelp Fusion API for live reviews"
- "Add Google Maps Places Autocomplete to the Midway Meetup"
- "Connect Ticketmaster Discovery API for live event data"
- "Add real Unsplash API integration for dynamic Vegas photos"
- "Set up Vercel deployment"

---

## 60-AGENT SWARM SYSTEM (INCLUDED)

This project includes GoGlobal's 60-agent swarm system under `.claude/skills/`.
These are Claude Code skills that act as specialized AI agents for development.

### Structure:
```
.claude/
└── skills/
    ├── goglobal-swarm-index/    ← Master index (read first)
    ├── react-architect/          ← React 19 component patterns
    ├── ui-composer/              ← Page layouts & visual hierarchy
    ├── animation-engineer/       ← Framer Motion animations
    ├── shannon-ops-agent/        ← 5-phase build system
    ├── city-data-agent/          ← City database management
    ├── gemini-ai-agent/          ← Gemini AI integration
    ├── accessibility-agent/      ← WCAG 2.1 AA compliance
    ├── responsive-agent/         ← Mobile-first design
    ├── debugger-agent/           ← Bug diagnosis
    ├── ... (40 agent skills total)
    └── swarm-analytics/          ← Agent performance tracking
```

### How to activate in Claude Code:
The skills auto-activate based on trigger words. Just describe what you need:
- "Build me an event card" → Routes to React Architect + UI Composer
- "The search is broken" → Routes to Debugger
- "What phase are we in?" → Routes to Shannon
- "Add Chicago as a city" → Routes to City Data Agent

### Token savings:
The swarm uses cache-first execution and progressive context loading
to reduce token usage by ~75% compared to naive approaches.
