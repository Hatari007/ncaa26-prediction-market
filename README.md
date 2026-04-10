# NCAA26 Prediction Market (Vite + React + Supabase)

This starter uses Supabase Auth magic links and a basic display-name profile flow for a private friend-group site.

## 1) Install dependencies

```bash
npm install
```

## 2) Configure environment variables

Copy `.env.example` to `.env` and fill in your Supabase values:

```bash
cp .env.example .env
```

Required variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

> Do not commit real secrets. Only the anon/publishable key belongs in the client.

## 3) Configure Supabase Auth

In your Supabase project dashboard:

1. Enable **Email** provider under Authentication.
2. Ensure **Magic Link** sign-in is enabled.
3. Add your local app URL (`http://localhost:5173`) as an allowed redirect URL.

## 4) Run the app

```bash
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`).

## Included flows

- Magic link sign-in by email.
- Session persistence across refreshes.
- Display-name setup/update after login.
- Sign out.
- UI placeholder text clarifying this is for a private friend-group site.
