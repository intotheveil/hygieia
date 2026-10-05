import type { Session } from '@supabase/supabase-js'
import {
  ANONYMOUS,
  LOADING,
  NEXT_STORAGE_KEY,
  UNAVAILABLE,
  callbackUrl,
  reduceAuthEvent,
  safeNextPath,
  stateFromSession,
  storeNext,
  takeNext,
  userFromSession,
} from './session'

function session(id: string, email?: string): Session {
  // reason: only `user.id` / `user.email` are read; the rest of Session is irrelevant to these tests.
  return { user: { id, email } } as unknown as Session
}

describe('userFromSession / stateFromSession (pure)', () => {
  it('maps a session to the user and normalises a missing email to null', () => {
    expect(userFromSession(session('u1', 'a@b.c'))).toEqual({ id: 'u1', email: 'a@b.c' })
    expect(userFromSession(session('u1'))).toEqual({ id: 'u1', email: null })
    expect(userFromSession(session('u1', ''))).toEqual({ id: 'u1', email: null })
    expect(userFromSession(null)).toBeNull()
  })
  it('is anonymous without a session and signed-in with one', () => {
    expect(stateFromSession(null)).toEqual(ANONYMOUS)
    expect(stateFromSession(session('u2', 'x@y.z'))).toEqual({
      status: 'signed-in',
      user: { id: 'u2', email: 'x@y.z' },
    })
  })
})

describe('reduceAuthEvent (pure)', () => {
  it('SIGNED_IN with a session → signed-in with the id', () => {
    expect(reduceAuthEvent(LOADING, 'SIGNED_IN', session('u1', 'a@b.c'))).toEqual({
      status: 'signed-in',
      user: { id: 'u1', email: 'a@b.c' },
    })
  })
  it('SIGNED_OUT → anonymous, whatever the payload', () => {
    expect(
      reduceAuthEvent({ status: 'signed-in', user: { id: 'u1', email: null } }, 'SIGNED_OUT', null),
    ).toEqual(ANONYMOUS)
    expect(reduceAuthEvent(LOADING, 'SIGNED_OUT', session('u1'))).toEqual(ANONYMOUS)
  })
  it('INITIAL_SESSION / TOKEN_REFRESHED / USER_UPDATED follow the session they carry', () => {
    expect(reduceAuthEvent(LOADING, 'INITIAL_SESSION', null)).toEqual(ANONYMOUS)
    expect(reduceAuthEvent(ANONYMOUS, 'TOKEN_REFRESHED', session('u3')).status).toBe('signed-in')
    expect(reduceAuthEvent(ANONYMOUS, 'USER_UPDATED', session('u3', 'n@e.w'))).toEqual({
      status: 'signed-in',
      user: { id: 'u3', email: 'n@e.w' },
    })
  })
  it('unavailable is absorbing', () => {
    expect(reduceAuthEvent(UNAVAILABLE, 'SIGNED_IN', session('u1'))).toBe(UNAVAILABLE)
  })
})

describe('callbackUrl', () => {
  it('joins origin + BASE_URL + auth/callback, tolerating a BASE_URL without the trailing slash', () => {
    expect(callbackUrl('https://intotheveil.github.io', '/hygieia/')).toBe(
      'https://intotheveil.github.io/hygieia/auth/callback',
    )
    expect(callbackUrl('http://localhost:5173', '/')).toBe('http://localhost:5173/auth/callback')
    expect(callbackUrl('http://localhost:5173', '/hygieia')).toBe(
      'http://localhost:5173/hygieia/auth/callback',
    )
  })
})

describe('next-path storage', () => {
  it('accepts only in-app paths', () => {
    expect(safeNextPath('/recipes?x=1')).toBe('/recipes?x=1')
    expect(safeNextPath('//evil.example')).toBeNull()
    expect(safeNextPath('https://evil.example')).toBeNull()
    expect(safeNextPath('recipes')).toBeNull()
    expect(safeNextPath(null)).toBeNull()
  })
  it('stores, then takes exactly once, defaulting to /', () => {
    const store = new Map<string, string>()
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    }
    storeNext(storage, '/plans/7')
    expect(store.get(NEXT_STORAGE_KEY)).toBe('/plans/7')
    expect(takeNext(storage)).toBe('/plans/7')
    expect(takeNext(storage)).toBe('/')
    storeNext(storage, 'https://evil.example')
    expect(store.size).toBe(0)
  })
  it('never throws when storage does', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {
        throw new Error('blocked')
      },
    }
    expect(() => storeNext(broken, '/x')).not.toThrow()
    expect(takeNext(broken)).toBe('/')
  })
})
