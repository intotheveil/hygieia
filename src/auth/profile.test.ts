import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import type { HygieiaClient } from '../lib/supabase'
import { AuthProvider } from './AuthProvider'
import { fakeClient, fakeSession } from './fake-client'
import {
  PROFILE_COLUMNS,
  displayNameFor,
  ensureProfile,
  profileClientFor,
  useProfile,
} from './profile'

describe('displayNameFor', () => {
  it('uses the email local part, or "user" when there is none', () => {
    expect(displayNameFor('maria.k@example.test')).toBe('maria.k')
    expect(displayNameFor(null)).toBe('user')
    expect(displayNameFor('')).toBe('user')
    expect(displayNameFor('@example.test')).toBe('user')
  })
})

describe('ensureProfile', () => {
  const uid = '11111111-1111-4111-8111-111111111111'

  it('returns the existing row and performs no insert', async () => {
    const fake = fakeClient({
      profiles: { rows: [{ user_id: uid, display_name: 'maria', is_admin: true }] },
    })
    const profile = await ensureProfile(profileClientFor(fake.client), { id: uid, email: 'm@x.y' })
    expect(profile).toEqual({ user_id: uid, display_name: 'maria', is_admin: true })
    expect(fake.inserts).toHaveLength(0)
    expect(fake.from).toHaveBeenCalledWith('profiles')
  })

  it('creates exactly one row on first sign-in, WITHOUT is_admin', async () => {
    const fake = fakeClient()
    const profile = await ensureProfile(profileClientFor(fake.client), {
      id: uid,
      email: 'nikos@example.test',
    })
    expect(fake.inserts).toHaveLength(1)
    expect(fake.inserts[0]).toEqual({ user_id: uid, display_name: 'nikos' })
    expect(fake.inserts[0]).not.toHaveProperty('is_admin')
    expect(profile.is_admin).toBe(false)
    expect(PROFILE_COLUMNS).not.toMatch(/\*/)
  })

  it('surfaces a database error instead of inserting', async () => {
    const fake = fakeClient({ profiles: { selectError: 'permission denied' } })
    await expect(
      ensureProfile(profileClientFor(fake.client), { id: uid, email: null }),
    ).rejects.toThrow(/permission denied/)
    expect(fake.inserts).toHaveLength(0)
  })
})

describe('useProfile', () => {
  const uid = '22222222-2222-4222-8222-222222222222'
  const wrap =
    (client: HygieiaClient | null) =>
    ({ children }: { children: ReactNode }) =>
      createElement(AuthProvider, { client, children })

  it('is idle without a session and in local-only mode', async () => {
    const anon = renderHook(() => useProfile(), { wrapper: wrap(fakeClient().client) })
    await waitFor(() => expect(anon.result.current.status).toBe('idle'))
    const local = renderHook(() => useProfile(), { wrapper: wrap(null) })
    expect(local.result.current).toEqual({ status: 'idle', profile: null, isAdmin: false })
  })

  it('isAdmin is true only when the row says so', async () => {
    const admin = fakeClient({
      session: fakeSession(uid, 'a@example.test'),
      profiles: { rows: [{ user_id: uid, display_name: 'a', is_admin: true }] },
    })
    const a = renderHook(() => useProfile(), { wrapper: wrap(admin.client) })
    await waitFor(() => expect(a.result.current.status).toBe('ready'))
    expect(a.result.current.isAdmin).toBe(true)

    const plain = fakeClient({
      session: fakeSession(uid, 'b@example.test'),
      profiles: { rows: [{ user_id: uid, display_name: 'b', is_admin: false }] },
    })
    const b = renderHook(() => useProfile(), { wrapper: wrap(plain.client) })
    await waitFor(() => expect(b.result.current.status).toBe('ready'))
    expect(b.result.current.isAdmin).toBe(false)

    const fresh = fakeClient({ session: fakeSession(uid, 'c@example.test') })
    const c = renderHook(() => useProfile(), { wrapper: wrap(fresh.client) })
    await waitFor(() => expect(c.result.current.status).toBe('ready'))
    expect(c.result.current.isAdmin).toBe(false)
    expect(c.result.current.profile?.display_name).toBe('c')
    expect(fresh.inserts).toHaveLength(1)
  })

  it('reports an error state when the database refuses', async () => {
    const fake = fakeClient({
      session: fakeSession(uid),
      profiles: { selectError: 'permission denied' },
    })
    const { result } = renderHook(() => useProfile(), { wrapper: wrap(fake.client) })
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.isAdmin).toBe(false)
  })
})
