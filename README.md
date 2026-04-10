# NCAA26 Prediction Market

This repository is configured to deploy a Vite static site to **GitHub Pages** using GitHub Actions.

## Deployment workflow

The workflow file is at:

- `.github/workflows/deploy.yml`

It runs on pushes to `main`, installs dependencies with `npm ci`, builds with `npm run build`, and deploys the generated `dist/` folder to GitHub Pages.

## Required GitHub Pages settings (exact UI steps)

In your GitHub repository:

1. Go to **Settings**.
2. In the left sidebar, click **Pages**.
3. Under **Build and deployment**:
   - Set **Source** to **GitHub Actions**.
4. Save if prompted.

After that, each push to `main` will trigger deployment via the workflow.
