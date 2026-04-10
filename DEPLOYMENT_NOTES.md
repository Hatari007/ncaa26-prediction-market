# GitHub Pages project-site deployment notes

For this repository (`ncaa26-prediction-market`), Vite must be built with:

- `base: '/ncaa26-prediction-market/'`

This ensures generated asset URLs (JS/CSS/images) and root-relative navigation links resolve correctly when hosted at:

- `https://<user>.github.io/ncaa26-prediction-market/`

## Navigation/assets verification checklist

Because this repository currently has no application source files, runtime navigation can't be exercised here.

When app pages/components are added, verify:

1. Build output paths are prefixed with `/ncaa26-prediction-market/`.
2. Any SPA router uses the same basename:
   - React Router: `<BrowserRouter basename="/ncaa26-prediction-market/">`
3. Any hardcoded links/images avoid absolute `/...` URLs unless intentionally prefixed.
4. Deployed site loads all JS/CSS/image assets without 404s.
