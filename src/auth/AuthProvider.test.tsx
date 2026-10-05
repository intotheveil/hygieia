import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { CLIENT_OPTIONS, type HygieiaClient } from '../lib/supabase'
import { AuthProvider, useAuth } from './AuthProvider'
import { fakeClient, fakeSession } from './fake-client'

function wrap(client: HygieiaClient | null) {
  return ({ children }: { children: ReactNode }) => (
    <AuthProvider client={client}>{children}</AuthProvider>
  )
}

describe('AuthProvider', () => {
  afterEach(() => vi.restoreAllMocks())

  it('is unavailable with no client and never touches window storage', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem')
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const { result } = renderHook(() => useAuth(), { wrapper: wrap(null) })
    expect(result.current.state).toEqual({ status: 'unavailable' })
    expect(result.current.client).toBeNull()
    expect(getItem).not.toHaveBeenCalled()
    expect(setItem).not.toHaveBeenCalled()
  })

  it('seeds from the persisted session before any event arrives', async () => {
    const fake = fakeClient({ session: fakeSession('u-persisted', 'p@example.test') })
    const { result } = renderHook(() => useAuth(), { wrapper: wrap(fake.client) })
    expect(result.current.state.status).toBe('loading')
    await waitFor(() =>
      expect(result.current.state).toEqual({
        status: 'signed-in',
        user: { id: 'u-persisted', email: 'p@example.test' },
      }),
    )
    expect(fake.getSession).toHaveBeenCalledTimes(1)
  })

  it('SIGNED_IN → signed-in with the id; SIGNED_OUT → anonymous', async () => {
    const fake = fakeClient()
    const { result } = renderHook(() => useAuth(), { wrapper: wrap(fake.client) })
    await waitFor(() => expect(result.current.state.status).toBe('anonymous'))
    act(() => fake.emit('SIGNED_IN', fakeSession('u-1', 'one@example.test')))
    expect(result.current.state).toEqual({
      status: 'signed-in',
      user: { id: 'u-1', email: 'one@example.test' },
    })
    act(() => fake.emit('SIGNED_OUT', null))
    expect(result.current.state).toEqual({ status: 'anonymous' })
  })

  it('an event that lands before getSession resolves is not overwritten by the snapshot', async () => {
    const fake = fakeClient({ session: null })
    let release: () => void = () => {}
    fake.getSession.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = () => resolve({ data: { session: null }, error: null })
        }),
    )
    const { result } = renderHook(() => useAuth(), { wrapper: wrap(fake.client) })
    act(() => fake.emit('SIGNED_IN', fakeSession('u-early')))
    expect(result.current.state.status).toBe('signed-in')
    await act(async () => release())
    expect(result.current.state.status).toBe('signed-in')
  })

  it('signOut delegates to the client and unmount unsubscribes', async () => {
    const fake = fakeClient()
    const { result, unmount } = renderHook(() => useAuth(), { wrapper: wrap(fake.client) })
    await waitFor(() => expect(result.current.state.status).toBe('anonymous'))
    expect(fake.listeners()).toBe(1)
    await act(() => result.current.signOut())
    expect(fake.signOut).toHaveBeenCalledTimes(1)
    unmount()
    expect(fake.listeners()).toBe(0)
    expect(fake.unsubscribed()).toBeGreaterThanOrEqual(1)
  })

  it('refuses to be used outside the provider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(/within <AuthProvider>/)
  })

  it('keeps the session persisted and the PKCE flow on (CLIENT_OPTIONS contract)', () => {
    expect(CLIENT_OPTIONS.auth.persistSession).toBe(true)
    expect(CLIENT_OPTIONS.auth.detectSessionInUrl).toBe(true)
    expect(CLIENT_OPTIONS.auth.flowType).toBe('pkce')
  })
})
