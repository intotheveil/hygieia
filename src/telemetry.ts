// FLEET TELEMETRY ENTRY — the one place Hygieia starts the error catcher (PLAN P6.1).
//
// Lifted from Enodia (`D:/projects/enodia-transit/src/telemetry.ts`); only the env NAMES differ
// (PLAN §1.11): Hygieia reads `VITE_FLEET_URL`, `VITE_FLEET_KEY`, `VITE_FLEET_PRODUCT_ID`, the
// names reserved in `.env.example` and allow-listed in `eslint.config.js`.
//
// Contract: with ANY of the three blank (unset or whitespace) this is a pure no-op — no handler is
// installed, nothing is fetched, `window.onerror` stays exactly as it was. With all three set, the
// catcher in `./lib/telemetry/fleet-telemetry` hooks `window.onerror` / `onunhandledrejection`
// (chaining whatever was there), scrubs secrets + PII and fingerprints BEFORE the network call, and
// POSTs `fleet_errors` rows to `<VITE_FLEET_URL>/rest/v1/fleet_errors` with the write-only key,
// coalesced + batched by the storm batcher. Init failure never escapes: telemetry must not be able
// to break the app it watches.
//
// Each name is read by its full literal `import.meta.env.<NAME>` so Vite inlines ONLY these three
// (never pass `import.meta.env` around whole — see src/lib/env.ts).

import { initFleetTelemetry, type FleetContext } from './lib/telemetry/fleet-telemetry'

/** The raw values as Vite provides them (undefined when unset). */
export interface RawFleetEnv {
  VITE_FLEET_URL?: string
  VITE_FLEET_KEY?: string
  VITE_FLEET_PRODUCT_ID?: string
}

/** A complete fleet configuration: all three names present and non-blank. */
export interface FleetConfig {
  url: string
  key: string
  productId: string
}

/**
 * Decide whether telemetry is configured. Pure: never throws, never reads globals. All three must
 * be non-blank after trimming, otherwise `null` (telemetry off).
 */
export function resolveFleetEnv(raw: RawFleetEnv): FleetConfig | null {
  const url = typeof raw.VITE_FLEET_URL === 'string' ? raw.VITE_FLEET_URL.trim() : ''
  const key = typeof raw.VITE_FLEET_KEY === 'string' ? raw.VITE_FLEET_KEY.trim() : ''
  const productId =
    typeof raw.VITE_FLEET_PRODUCT_ID === 'string' ? raw.VITE_FLEET_PRODUCT_ID.trim() : ''
  if (url === '' || key === '' || productId === '') return null
  return { url, key, productId }
}

/**
 * The ONLY context Hygieia attaches: the current route path and the UI language. Both are
 * non-PII; the scrubber's allow-list (`role`/`page`/`action`) drops anything else anyway, and
 * `lang` is deliberately NOT an allow-listed key — see the note in `getContext`.
 */
export function getContext(): FleetContext {
  const context: FleetContext = {}
  try {
    context.page = window.location.pathname
  } catch {
    // A sandboxed frame can throw on `location`; send what we have.
  }
  try {
    context.lang = document.documentElement.lang
  } catch {
    // No document (or detached); fine.
  }
  return context
}

/** A disposer: restores the previous handlers and flushes the batcher. No-op when telemetry is off. */
export type StopTelemetry = () => void

const noop: StopTelemetry = () => undefined

/**
 * Start telemetry from already-resolved raw values (the testable core). Returns a disposer so a
 * caller can undo the hooks; `noop` when telemetry is off or init failed.
 */
export function startTelemetryWith(raw: RawFleetEnv, environment?: string): StopTelemetry {
  try {
    const config = resolveFleetEnv(raw)
    if (config === null) return noop
    return initFleetTelemetry({
      supabaseUrl: config.url,
      writeOnlyKey: config.key,
      productId: config.productId,
      environment,
      getContext,
    })
  } catch {
    // Telemetry init must never affect the app.
    return noop
  }
}

/**
 * Start fleet telemetry from the build's env. Call once, first thing in `main.tsx`, before render.
 * Never throws.
 */
export function startTelemetry(): StopTelemetry {
  // Read inline so Vite substitutes the build's values: a build without the fleet names (the
  // local-only artifact the Lighthouse gate audits, and the live site until OP6.a) folds this to
  // `return noop`, and the bundler then drops the whole client (~14 kB) from the entry chunk every
  // page downloads before its first paint (perf, 2026-10-06). Same outcome as before at runtime:
  // `resolveFleetEnv` below still decides when the names are present.
  if (
    !import.meta.env.VITE_FLEET_URL ||
    !import.meta.env.VITE_FLEET_KEY ||
    !import.meta.env.VITE_FLEET_PRODUCT_ID
  ) {
    return noop
  }
  try {
    return startTelemetryWith(
      {
        VITE_FLEET_URL: import.meta.env.VITE_FLEET_URL,
        VITE_FLEET_KEY: import.meta.env.VITE_FLEET_KEY,
        VITE_FLEET_PRODUCT_ID: import.meta.env.VITE_FLEET_PRODUCT_ID,
      },
      import.meta.env.MODE,
    )
  } catch {
    // Reading env cannot realistically throw, but the contract is "never throws out".
    return noop
  }
}
