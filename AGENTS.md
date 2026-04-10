# AGENTS.md

## Repository Operating Instructions

### Stack and Scope
- This repository is a Vite + React (JavaScript) app.
- Keep dependencies minimal unless explicitly requested.
- Preserve GitHub Pages compatibility for project-site deployment.

### Architecture Guidelines
- UI pages live in `src/pages`.
- Shared components live in `src/components`.
- Mock/static data lives in `src/data`.
- Keep top-level app wiring in `src/App.jsx` and bootstrapping in `src/main.jsx`.

### Styling Guidelines
- Use `src/styles.css` for global styles.
- Favor readable, mobile-first layouts.
- Keep parody/fun copy tasteful and readable.

### Data and Backend Assumptions
- Supabase is the shared backend.
- Use Vite env vars for config:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Do not hardcode production credentials.

### Product Rules to Preserve
- One pick per user per market.
- Market lifecycle: `open` -> `locked` -> `resolved`.
- Leaderboard ranking by correct picks.

### Deployment Requirements
- Keep `vite.config.js` base-path aware for GitHub Pages.
- Keep `.github/workflows/deploy-pages.yml` functional.
- Prefer deriving base path from repository name in CI.

### Documentation Requirements
- Update `README.md` whenever setup or deployment steps change.
- Keep `.env.example` aligned with required env vars.

### Agent Workflow
- Run quick checks before committing (`npm run build` if dependencies are available).
- Keep comments concise and focused on intent.
- Avoid broad refactors unless task requires them.
