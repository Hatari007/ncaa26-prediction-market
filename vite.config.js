import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repositoryName = 'ncaa26-prediction-market';
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || (isGitHubActions ? `/${repositoryName}/` : '/'),
});
