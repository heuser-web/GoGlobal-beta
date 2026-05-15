# GoGlobal V2 — Agent Instructions

## Cursor Cloud specific instructions

### Architecture
- **Monolith** (not a monorepo): single `package.json` at root.
- **Frontend**: Vite dev server on port **3000**, proxies `/api` to backend.
- **Backend**: Express server on port **3002** (`server/index.js`).
- No database — data stored as flat JSON files in `server/data/`.

### Running the dev environment
- `npm run dev` starts both Vite (port 3000) and Express (port 3002) via `concurrently`.
- Alternatively: `npm run dev:client` (frontend only) or `npm run dev:server` (backend only).
- The `.env` file must exist at the project root. Copy `.env.example` → `.env` and set at minimum `VITE_GEMINI_API_KEY` (or have `GEMINI_API_KEY` in the environment). The server reads both `GEMINI_API_KEY` and `VITE_GEMINI_API_KEY`.

### API keys
- **Required**: `VITE_GEMINI_API_KEY` / `GEMINI_API_KEY` — powers Romey AI chatbot.
- **Optional**: `SERPER_API_KEY` (image search), `YELP_API_KEY` (restaurants), `STRIPE_SECRET_KEY` (payments), `SEMRUSH_API_KEY` + `VENICE_API_KEY` (GoRealestate pipeline). All optional features degrade gracefully without keys.

### Build
- `npm run build` outputs to `build/` directory.

### Lint / Tests
- No ESLint config or test framework is configured in this codebase.
- Validate correctness via `npm run build` (Vite build) and manual testing.

### Gotchas
- The Express server auto-seeds GoRealestate data on first boot if none exists — this is expected log output, not an error.
- Vite proxy forwards `/api/*` to `http://localhost:3002`, so the backend must be running for API calls to work from the frontend.
- The backend serves the production build from `build/` if it exists, but in dev mode Vite handles the frontend.
