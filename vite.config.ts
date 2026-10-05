/// <reference types="vitest/config" />
import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

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
  plugins: [
    react(),
    tailwindcss(),
    spaFallback(),
    // Installable PWA (ADR-0004). The plugin injects <link rel="manifest"> and the SW registration
    // into index.html; `check:pwa` verifies the built artifact in CI. Fonts are cached at runtime
    // so the installed app renders Greek text offline after the first visit.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon-180.png', 'brand/*.jpg'],
      manifest: {
        id: '/hygieia/',
        name: 'Hygieia · Υγίεια',
        short_name: 'Hygieia',
        description:
          'Health tips, diets, recipes, calories, meal cost and workouts — in Greek and English.',
        lang: 'el',
        dir: 'ltr',
        start_url: '/hygieia/',
        scope: '/hygieia/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f6f3ea',
        theme_color: '#f6f3ea',
        categories: ['health', 'food', 'fitness', 'lifestyle'],
        icons: [
          { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,webmanifest}'],
        navigateFallback: '/hygieia/index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-css', expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['node_modules/**', 'dist/**', '.claude/worktrees/**'],
  },
})
