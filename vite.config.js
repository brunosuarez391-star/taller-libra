import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  // CRITICAL for Electron production: assets must use relative paths.
  // With base: './', Vite emits <script src="./assets/index-xxx.js">
  // instead of <script src="/assets/index-xxx.js">, which works with
  // the file:// protocol (no server root to resolve from).
  base: './',

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },

  server: {
    port: 5173,
    strictPort: true,
  },
})
