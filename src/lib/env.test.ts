import { resolveAppEnv } from './env'
import { clientFor } from './supabase'

describe('resolveAppEnv', () => {
  it('is local-only when nothing is set, naming the first missing value', () => {
    expect(resolveAppEnv({})).toEqual({ mode: 'local', reason: 'missing-url' })
    expect(resolveAppEnv({ VITE_SUPABASE_URL: 'https://x.supabase.co' })).toEqual({
      mode: 'local',
      reason: 'missing-anon-key',
    })
    expect(resolveAppEnv({ VITE_SUPABASE_URL: '   ', VITE_SUPABASE_ANON_KEY: 'k' })).toEqual({
      mode: 'local',
      reason: 'missing-url',
    })
  })

  it('rejects a URL that is not absolute http(s)', () => {
    for (const bad of ['x.supabase.co', 'ftp://x', 'javascript:alert(1)']) {
      expect(resolveAppEnv({ VITE_SUPABASE_URL: bad, VITE_SUPABASE_ANON_KEY: 'k' })).toEqual({
        mode: 'local',
        reason: 'invalid-url',
      })
    }
  })

  it('is configured when both values are usable, trimming whitespace', () => {
    expect(
      resolveAppEnv({
        VITE_SUPABASE_URL: ' https://x.supabase.co ',
        VITE_SUPABASE_ANON_KEY: ' k ',
      }),
    ).toEqual({ mode: 'configured', supabase: { url: 'https://x.supabase.co', anonKey: 'k' } })
  })
})

describe('clientFor', () => {
  it('creates no client in local-only mode and a client when configured', () => {
    expect(clientFor({ mode: 'local', reason: 'missing-url' })).toBeNull()
    const client = clientFor({
      mode: 'configured',
      supabase: { url: 'https://x.supabase.co', anonKey: 'anon' },
    })
    expect(client).not.toBeNull()
    expect(typeof client?.from).toBe('function')
  })
})
