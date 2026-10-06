import { describe, expect, it, vi } from 'vitest'
import { CLIENT_OPTIONS, clientFor, loadSupabaseLibrary } from './supabase'

describe('CLIENT_OPTIONS', () => {
  it("pins the client to schema 'hygieia' (ADR-0003: Hygieia owns one schema of a shared project)", () => {
    expect(CLIENT_OPTIONS.db.schema).toBe('hygieia')
  })

  it('keeps the PKCE auth settings', () => {
    expect(CLIENT_OPTIONS.auth).toEqual({
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    })
  })
})

describe('clientFor', () => {
  it('is null in local-only mode WITHOUT loading the library (P5.3: supabase-js is not in the eager graph)', async () => {
    const load = vi.fn(loadSupabaseLibrary)
    await expect(clientFor({ mode: 'local', reason: 'missing-url' }, load)).resolves.toBeNull()
    expect(load).not.toHaveBeenCalled()
  })

  it('builds a client in configured mode without making a request', async () => {
    const client = await clientFor({
      mode: 'configured',
      supabase: { url: 'https://example.supabase.co', anonKey: 'anon-key' },
    })
    expect(client).not.toBeNull()
    expect(typeof client?.from).toBe('function')
  })

  it('rejects when the library chunk cannot be loaded (callers map it to a network failure)', async () => {
    const load = vi.fn(() => Promise.reject(new Error('chunk failed')))
    await expect(
      clientFor(
        { mode: 'configured', supabase: { url: 'https://x.supabase.co', anonKey: 'k' } },
        load,
      ),
    ).rejects.toThrow('chunk failed')
  })
})
