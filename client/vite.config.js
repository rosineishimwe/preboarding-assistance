import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const repoName = env.GITHUB_REPOSITORY ? env.GITHUB_REPOSITORY.split('/')[1] : '';

  return {
    base: process.env.GITHUB_ACTIONS ? `/${repoName}/` : './',
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
    },
    preview: {
      host: '0.0.0.0',
      port: 4173,
    },
  };
});
