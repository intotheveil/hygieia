import { type ConsoleEntry, expect, test as base } from './fixtures'

/**
 * The console watchdog for the `dead-backend` project (PLAN P5.1): the house fixture
 * (./fixtures.ts) with EXACTLY ONE more filter. The build under test is configured against
 * `http://127.0.0.1:9/` (scripts/build-dead.mjs), so every Supabase request is refused and Chromium
 * logs each as "Failed to load resource: net::ERR_CONNECTION_REFUSED" with the request URL as the
 * message location. Those lines ARE the scenario, not a defect. Anything else — a failed asset, an
 * uncaught rejection from supabase-js, a React error, a 404 for a script — still fails the test.
 *
 * The filter keys on the URL (the dead origin only) AND the message shape (a network failure of a
 * resource), never on the text alone, so a `net::ERR_*` for any other host is kept.
 */
export const DEAD_ORIGIN = 'http://127.0.0.1:9'

export const isDeadBackendFailure = (e: ConsoleEntry): boolean =>
  e.kind === 'console' &&
  /^Failed to load resource: net::ERR_/.test(e.text) &&
  e.url.startsWith(`${DEAD_ORIGIN}/`)

// An OVERRIDE of the house fixture that depends on the original (Playwright keeps the original's
// `auto`, so it still runs for every test here without being requested). Same mechanism as
// e2e/local/offline.spec.ts.
export const test = base.extend<{ consoleErrors: ConsoleEntry[] }>({
  // (`provide` is Playwright's `use`; named so react-hooks/rules-of-hooks does not read it as React's.)
  consoleErrors: async ({ consoleErrors }, provide) => {
    await provide(consoleErrors)
    // Runs after the test body and BEFORE the house fixture's `toEqual([])` (a dependency tears
    // down after its dependents), so only the dead host's failures are removed from what it judges.
    const kept = consoleErrors.filter((e) => !isDeadBackendFailure(e))
    consoleErrors.splice(0, consoleErrors.length, ...kept)
  },
})

export { expect }
