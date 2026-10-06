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
    // into index.html; `check:pwa` verifies the built artifact in CI. Fonts are self-hosted
    // (src/index.css) and precached with the bundle, so the installed app renders Greek text
    // offline from the first visit.
    VitePWA({
      registerType: 'autoUpdate',
      // `defer` on the injected registerSW.js: Lighthouse counted the default blocking script as
      // ~300 ms of render-blocking time on every route (PLAN P5.3); registration can wait for parse.
      injectRegister: 'script-defer',
      includeAssets: [
        'favicon.svg',
        'icons/apple-touch-icon-180.png',
        'brand/*.jpg',
        'brand/*.webp',
      ],
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
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // woff2: the self-hosted font subsets; webp: the hero variants (scripts/brand.mjs).
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,webp,woff2,webmanifest}'],
        // Recipe photos (public/recipes/, 2 × 152 WebP, several MB) are NOT precached: an install
        // must not download every photo. The runtime rule below keeps the ones the user viewed.
        globIgnores: ['**/recipes/**'],
        runtimeCaching: [
          {
            // Images only: `/hygieia/recipes/<slug>` is also the SPA route of the detail page, and a
            // navigation must never be answered from this cache.
            urlPattern: ({ request, url }) =>
              request.destination === 'image' &&
              url.pathname.startsWith('/hygieia/recipes/') &&
              url.pathname.endsWith('.webp'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'recipe-images',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        // Explicit, because `injectRegister: 'script-defer'` (P5.3) switches off the plugin's implicit
        // clientsClaim for autoUpdate — found by P1.QA: offline.spec.ts went red (no SW controlled the page).
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: '/hygieia/index.html',
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // e2e/** holds Playwright specs (npm run e2e), which Vitest must not collect.
    exclude: ['e2e/**', 'node_modules/**', 'dist/**', '.claude/worktrees/**'],
  },
})
