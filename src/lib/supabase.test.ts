import { describe, expect, it } from 'vitest'
import { CLIENT_OPTIONS, clientFor } from './supabase'

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
  it('is null in local-only mode', () => {
    expect(clientFor({ mode: 'local', reason: 'missing-url' })).toBeNull()
  })

  it('builds a client in configured mode without making a request', () => {
    const client = clientFor({
      mode: 'configured',
      supabase: { url: 'https://example.supabase.co', anonKey: 'anon-key' },
    })
    expect(client).not.toBeNull()
    expect(typeof client?.from).toBe('function')
  })
})
