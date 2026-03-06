import { defineConfig } from 'vite';

// For GitHub Pages project site: set BASE to repo name (e.g. 'm7_proj').
// Leave BASE unset for local dev and for user site (username.github.io).
const base = process.env.BASE ? `/${process.env.BASE}/` : '/';

export default defineConfig({
  base,
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: 'index.html',
    },
  },
});
