import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getContext, resolveFleetEnv, startTelemetry, startTelemetryWith } from './telemetry'
import { fingerprint } from './lib/telemetry/fingerprint'
import type { FleetErrorPayload } from './lib/telemetry/types'

const URL_ = 'https://fleet.example.supabase.co'
const KEY = 'anon-write-only-key'
const PRODUCT = 'hygieia-test-product'
const ENDPOINT = `${URL_}/rest/v1/fleet_errors`
const ALL_SET = { VITE_FLEET_URL: URL_, VITE_FLEET_KEY: KEY, VITE_FLEET_PRODUCT_ID: PRODUCT }

// The batcher flushes on a 1.5s interval; fake timers let a test drive the flush deterministically.
const FLUSH_MS = 1_500

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/
const PLANTED_EMAIL = 'patient@example.com'
// Assembled at runtime so no secret-looking literal sits in the source (the repo's secret scan).
const PLANTED_TOKEN = ['sk', 'abcdefghijklmnopqrstuvwxyz0123'].join('-')

type FetchMock = ReturnType<typeof vi.fn<(input: string, init?: RequestInit) => Promise<Response>>>

function installFetch(): FetchMock {
  const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(() =>
    Promise.resolve({ ok: true, status: 201 } as Response),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** Fire a browser-style uncaught error through whatever `window.onerror` is installed. */
function throwThrough(error: Error): void {
  const handler = window.onerror
  if (typeof handler !== 'function') throw new Error('no window.onerror installed')
  handler.call(window, error.message, 'https://app/x.js', 1, 1, error)
}

/** Parse the JSON body of a recorded fetch call as the bulk-insert array it must be. */
function bodyOf(call: [string, RequestInit?]): FleetErrorPayload[] {
  const init = call[1]
  expect(init).toBeDefined()
  expect(typeof init?.body).toBe('string')
  return JSON.parse(init?.body as string) as FleetErrorPayload[]
}

describe('resolveFleetEnv', () => {
  it('is null when any name is missing or blank', () => {
    expect(resolveFleetEnv({})).toBeNull()
    expect(resolveFleetEnv({ ...ALL_SET, VITE_FLEET_URL: '' })).toBeNull()
    expect(resolveFleetEnv({ ...ALL_SET, VITE_FLEET_KEY: '   ' })).toBeNull()
    expect(resolveFleetEnv({ ...ALL_SET, VITE_FLEET_PRODUCT_ID: undefined })).toBeNull()
  })

  it('is configured when all three are present, trimming whitespace', () => {
    expect(resolveFleetEnv({ ...ALL_SET, VITE_FLEET_KEY: ` ${KEY} ` })).toEqual({
      url: URL_,
      key: KEY,
      productId: PRODUCT,
    })
  })
})

describe('getContext', () => {
  it('supplies only the route path and the document language', () => {
    document.documentElement.lang = 'el'
    const context = getContext()
    expect(Object.keys(context).sort()).toEqual(['lang', 'page'])
    expect(context.page).toBe(window.location.pathname)
    expect(context.lang).toBe('el')
  })
})

describe('startTelemetry — off without env (no hooks, no fetch)', () => {
  let stop: () => void = () => undefined

  beforeEach(() => {
    window.onerror = null
    window.onunhandledrejection = null
  })
  afterEach(() => {
    stop()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('all three names blank: window.onerror stays null and nothing is fetched', () => {
    const fetchMock = installFetch()
    vi.stubEnv('VITE_FLEET_URL', '')
    vi.stubEnv('VITE_FLEET_KEY', '')
    vi.stubEnv('VITE_FLEET_PRODUCT_ID', '')
    stop = startTelemetry()
    expect(window.onerror).toBeNull()
    expect(window.onunhandledrejection).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    ['VITE_FLEET_URL', { ...ALL_SET, VITE_FLEET_URL: '' }],
    ['VITE_FLEET_KEY', { ...ALL_SET, VITE_FLEET_KEY: '' }],
    ['VITE_FLEET_PRODUCT_ID', { ...ALL_SET, VITE_FLEET_PRODUCT_ID: '' }],
  ])('only %s blank: same no-op', (_name, raw) => {
    const fetchMock = installFetch()
    stop = startTelemetryWith(raw)
    expect(window.onerror).toBeNull()
    expect(window.onunhandledrejection).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('leaves a pre-existing window.onerror untouched when off', () => {
    const previous = vi.fn()
    window.onerror = previous
    stop = startTelemetryWith({})
    expect(window.onerror).toBe(previous)
  })
})

describe('startTelemetry — on with all three names set', () => {
  let stop: () => void = () => undefined

  beforeEach(() => {
    vi.useFakeTimers()
    window.onerror = null
    window.onunhandledrejection = null
  })
  afterEach(() => {
    stop()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.useRealTimers()
  })

  it('reads the three VITE_FLEET_* names from import.meta.env and installs the hooks', () => {
    installFetch()
    vi.stubEnv('VITE_FLEET_URL', URL_)
    vi.stubEnv('VITE_FLEET_KEY', KEY)
    vi.stubEnv('VITE_FLEET_PRODUCT_ID', PRODUCT)
    stop = startTelemetry()
    expect(typeof window.onerror).toBe('function')
    expect(typeof window.onunhandledrejection).toBe('function')
  })

  it('a thrown error produces exactly one POST to <URL>/rest/v1/fleet_errors with a scrubbed, fingerprinted row', () => {
    const fetchMock = installFetch()
    document.documentElement.lang = 'en'
    stop = startTelemetryWith(ALL_SET, 'test')

    throwThrough(new Error(`boom for ${PLANTED_EMAIL} with token=${PLANTED_TOKEN}`))
    expect(fetchMock).not.toHaveBeenCalled() // queued, not yet flushed
    vi.advanceTimersByTime(FLUSH_MS)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(ENDPOINT)
    expect(init?.method).toBe('POST')
    const headers = init?.headers as Record<string, string>
    expect(headers.apikey).toBe(KEY)
    expect(headers.Authorization).toBe(`Bearer ${KEY}`)
    expect(headers.Prefer).toBe('return=minimal')

    const rows = bodyOf(fetchMock.mock.calls[0])
    expect(rows).toHaveLength(1)
    const row = rows[0]
    expect(row.product_id).toBe(PRODUCT)
    expect(row.source).toBe('client')
    expect(row.severity).toBe('error')
    expect(row.environment).toBe('test')
    expect(row.error_message).toContain('boom for')
    expect(row.fingerprint).toMatch(/^[0-9a-z]+$/)
    // The fingerprint was computed over the SCRUBBED message/stack, before the network call.
    expect(row.fingerprint).toBe(
      fingerprint({
        product_id: row.product_id,
        error_message: row.error_message,
        stack: row.stack ?? undefined,
      }),
    )
    // Only the allow-listed context survives (`page`); `lang` is not an allow-listed key.
    expect(row.user_context_json).toEqual({ page: window.location.pathname })

    // Nothing email- or token-looking anywhere in what left the browser.
    const wire = init?.body as string
    expect(wire).not.toContain(PLANTED_EMAIL)
    expect(wire).not.toContain(PLANTED_TOKEN)
    expect(wire).not.toMatch(EMAIL_RE)
    expect(wire).not.toMatch(/\bsk-[A-Za-z0-9_-]{20,}/)
    expect(row.error_message).toContain('[REDACTED_EMAIL]')
    expect(row.error_message).toContain('token=[REDACTED]')
  })

  it('still calls a pre-existing window.onerror (chained, not clobbered)', () => {
    installFetch()
    const previous = vi.fn<OnErrorEventHandlerNonNull>(() => true)
    window.onerror = previous
    stop = startTelemetryWith(ALL_SET)
    expect(window.onerror).not.toBe(previous)

    const error = new Error('chained')
    throwThrough(error)
    expect(previous).toHaveBeenCalledTimes(1)
    expect(previous.mock.calls[0][4]).toBe(error)
  })

  it('the disposer restores the previous handlers', () => {
    installFetch()
    const previous = vi.fn()
    window.onerror = previous
    const dispose = startTelemetryWith(ALL_SET)
    dispose()
    expect(window.onerror).toBe(previous)
  })

  it('does not throw when fetch is undefined, at init or on capture + flush', () => {
    vi.stubGlobal('fetch', undefined)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    expect(() => {
      stop = startTelemetryWith(ALL_SET)
    }).not.toThrow()
    expect(() => {
      throwThrough(new Error('no fetch here'))
      vi.advanceTimersByTime(FLUSH_MS)
    }).not.toThrow()
  })

  it('does not throw when a hook rejects the config (initFleetTelemetry failure path)', () => {
    installFetch()
    // A window whose `onerror` setter throws models a hostile host; init must swallow it.
    const original = Object.getOwnPropertyDescriptor(window, 'onerror')
    Object.defineProperty(window, 'onerror', {
      configurable: true,
      get: () => null,
      set: () => {
        throw new Error('hostile host')
      },
    })
    try {
      expect(() => {
        stop = startTelemetryWith(ALL_SET)
      }).not.toThrow()
    } finally {
      if (original) Object.defineProperty(window, 'onerror', original)
      else delete (window as { onerror?: unknown }).onerror
    }
  })
})
