import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * GitHub Pages project-site support:
 * - Set VITE_BASE_PATH to '/your-repo-name/' in workflow/env.
 * - Falls back to '/' for local dev.
 */
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/'
});
