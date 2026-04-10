# NCAA 26 Dynasty Prediction Market (Joke Site)

A lightweight Vite + React app for a parody sportsbook/ESPN-style NCAA 26 dynasty prediction market.

## Features

- Home page showing active markets (open / locked / resolved)
- Leaderboard page based on correct picks
- Admin page for creating/resolving markets (UI scaffolding)
- Auth UI scaffold for Supabase sign-in
- Mobile-friendly layout
- Funny-but-readable sports media aesthetic

## Tech Choices

- **Vite + React (JavaScript)**
- **Minimal dependencies**: `react`, `react-dom`, `vite`, `@vitejs/plugin-react`
- Mock data designed to map cleanly to planned Supabase tables

## Project Structure

```text
.
├─ .github/workflows/deploy-pages.yml
├─ src/
│  ├─ components/
│  │  ├─ AuthPanel.jsx
│  │  ├─ Header.jsx
│  │  └─ MarketCard.jsx
│  ├─ data/
│  │  └─ mockData.js
│  ├─ pages/
│  │  ├─ AdminPage.jsx
│  │  ├─ HomePage.jsx
│  │  └─ LeaderboardPage.jsx
│  ├─ App.jsx
│  ├─ main.jsx
│  └─ styles.css
├─ .env.example
├─ AGENTS.md
├─ index.html
├─ package.json
└─ vite.config.js
```

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment template:

   ```bash
   cp .env.example .env
   ```

3. Fill in `.env` values:

   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - For local dev, `VITE_BASE_PATH=/`

4. Run dev server:

   ```bash
   npm run dev
   ```

## Supabase Notes

The app currently uses mock data and mock sign-in state in `src/data/mockData.js` and `src/App.jsx`.
Replace these with real Supabase calls when backend tables/auth are ready.

Assumed backend rules:

- users can sign in
- one pick per user per market
- markets move through `open`, `locked`, `resolved`
- leaderboard uses count of correct picks

## GitHub Pages Deployment

### 1) Configure repo settings

- In GitHub repository settings, set **Pages** source to **GitHub Actions**.

### 2) Add repository secrets

Add these Actions secrets:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 3) Push to `main`

The workflow at `.github/workflows/deploy-pages.yml` will:

- install dependencies
- build with
  - `VITE_BASE_PATH=/${{ github.event.repository.name }}/`
- deploy `dist/` to GitHub Pages

### 4) Base path behavior

`vite.config.js` uses:

- `process.env.VITE_BASE_PATH` when set (CI / project site)
- `/` fallback for local development

If you rename the repo, deployment keeps working because workflow derives the path from repository name.

## Future Integration Checklist

- Add `@supabase/supabase-js`
- Create `src/lib/supabaseClient.js`
- Implement auth flows (email OTP or OAuth)
- Persist picks and market states in Supabase tables
- Add RLS policies for one-pick-per-user integrity
