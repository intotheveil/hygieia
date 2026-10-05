/// <reference types="vitest/config" />
import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * SPA fallback for GitHub Pages. Pages has no server rewrites: a hard load of a deep link finds no
 * file and Pages serves 404.html (with HTTP status 404, which browsers render normally). Making
 * 404.html a byte copy of index.html means every deep link boots the app and the client router
 * reads the route from the URL. The requested URL is never rewritten (the Themis pattern).
 */
export function spaFallback(): Plugin {
  let outDir = 'dist'
  return {
    name: 'hygieia-spa-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    writeBundle() {
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
    },
  }
}

// Served at https://intotheveil.github.io/hygieia/ (GitHub Pages project site, ADR-0001). If a
// custom domain ever serves it at the root, this base becomes '/' or the page loads a blank shell.
export default defineConfig({
  base: '/hygieia/',
  plugins: [react(), tailwindcss(), spaFallback()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['node_modules/**', 'dist/**', '.claude/worktrees/**'],
  },
})
