import { googleSignInEnabled, resolveAppEnv } from './env'
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

describe('googleSignInEnabled', () => {
  it.each(['1', 'true', 'TRUE ', ' True'])('is on for %j', (value) => {
    expect(googleSignInEnabled({ VITE_AUTH_GOOGLE: value })).toBe(true)
  })

  it.each(['0', '', '   ', 'yes', 'on', '2', 'false', undefined])('is off for %j', (value) => {
    expect(googleSignInEnabled({ VITE_AUTH_GOOGLE: value })).toBe(false)
  })

  it('is off when the name is absent altogether', () => {
    expect(googleSignInEnabled({})).toBe(false)
  })

  it('isGoogleSignInEnabled reads VITE_AUTH_GOOGLE from import.meta.env at module load', async () => {
    try {
      vi.stubEnv('VITE_AUTH_GOOGLE', '')
      vi.resetModules()
      expect((await import('./env')).isGoogleSignInEnabled).toBe(false)
      vi.stubEnv('VITE_AUTH_GOOGLE', '1')
      vi.resetModules()
      expect((await import('./env')).isGoogleSignInEnabled).toBe(true)
    } finally {
      vi.unstubAllEnvs()
      vi.resetModules()
    }
  })
})

describe('clientFor', () => {
  it('creates no client in local-only mode and a client when configured', async () => {
    await expect(clientFor({ mode: 'local', reason: 'missing-url' })).resolves.toBeNull()
    const client = await clientFor({
      mode: 'configured',
      supabase: { url: 'https://x.supabase.co', anonKey: 'anon' },
    })
    expect(client).not.toBeNull()
    expect(typeof client?.from).toBe('function')
  })
})
