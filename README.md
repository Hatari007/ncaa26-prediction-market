# Waiting on the World to Change

A private, no-money NCAA College Football dynasty prediction market for friends. The app is a Vite + React site with a Vegas sportsbook parody look, manual commissioner controls, weighted markets, and a season leaderboard.

> Entertainment only. No real gambling, payouts, deposits, or cash value.

## Current prototype

This pass intentionally uses **display-name-only login** for the private friend group. The browser stores the active display name and market state in `localStorage`, so it can run immediately on GitHub Pages while the Supabase schema is finalized.

Preloaded players:

| Display name | Dynasty team | Role |
| --- | --- | --- |
| Frank | Tennessee | Admin |
| Jeff | Texas | User |
| Aus | Iowa | User |
| Matt | TCU | User |
| Bryan | Georgia Tech | User |
| Tom | Stanford | User |
| Eric | Rice | User |
| Mired | USC | User |

Preloaded markets:

| Market | Options | Points | Lock display |
| --- | --- | --- | --- |
| Who will win TCU vs. Iowa? | TCU, Iowa | 1 | Kickoff |
| Who will win Tennessee vs. Texas? | Tennessee, Texas | 1 | Kickoff |
| Who will win the National Championship? | Texas, Iowa, Tennessee, TCU | 2 | Kickoff |

## Features

- Display-name login for the invited friend group.
- Dynasty school logos are shown for each player using ESPN-hosted team logo images.
- Admin controls for Frank to create, lock, reopen, resolve, and delete markets.
- Users can make or edit picks while a market is open.
- Pick percentages, pick counts, and who picked each option are hidden until a market is locked.
- Markets follow `open -> locked -> resolved`.
- Weighted season leaderboard.
- Admin mode can edit homepage/login copy plus market titles, descriptions, lock labels, point values, and option labels.
- GitHub Pages-aware Vite base path.

## Local setup

```bash
npm install
npm run dev
```

## Build and checks

```bash
npm test
npm run build
```

## Deployment

The app is compatible with GitHub Pages. The Vite config derives the project-site base path in GitHub Actions and also supports overriding it with `VITE_BASE_PATH`.

## Supabase notes

Supabase remains the intended shared backend for a hardened production version. Keep `.env.example` aligned with these public Vite env vars:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_BASE_PATH=/ncaa26-prediction-market/
```

The current prototype does not require Supabase credentials to run.
