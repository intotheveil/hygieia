// SESSION HELPERS — the pure half of auth (P2.1). Nothing here touches React, the Supabase
// client or `window`, so every branch is unit-testable with plain objects.

import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string | null
}

/**
 * The four things the app can know about auth:
 * - `unavailable`: no Supabase client (local-only mode, see src/lib/env.ts) — sign-in cannot exist.
 * - `loading`: a client exists; the persisted session has not been read yet.
 * - `anonymous`: a client exists and there is no session.
 * - `signed-in`: who it is.
 */
export type AuthState =
  | { status: 'unavailable' }
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'signed-in'; user: AuthUser }

export const UNAVAILABLE: AuthState = { status: 'unavailable' }
export const LOADING: AuthState = { status: 'loading' }
export const ANONYMOUS: AuthState = { status: 'anonymous' }

/** The user of a session, or null. Supabase types `email` as optional; the app sees `string | null`. */
export function userFromSession(session: Session | null): AuthUser | null {
  if (!session?.user?.id) return null
  const email = session.user.email
  return { id: session.user.id, email: typeof email === 'string' && email !== '' ? email : null }
}

/** `anonymous` or `signed-in`, from a session (the result of `getSession()`). */
export function stateFromSession(session: Session | null): AuthState {
  const user = userFromSession(session)
  return user ? { status: 'signed-in', user } : ANONYMOUS
}

/**
 * Fold one `onAuthStateChange` event into the state. `unavailable` is absorbing (no client, no
 * events). `SIGNED_OUT` is always anonymous whatever the payload; every other event is read from
 * its session, because `SIGNED_IN`, `INITIAL_SESSION`, `TOKEN_REFRESHED` and `USER_UPDATED` all
 * carry the current session (or null when there is none).
 */
export function reduceAuthEvent(
  prev: AuthState,
  event: AuthChangeEvent,
  session: Session | null,
): AuthState {
  if (prev.status === 'unavailable') return prev
  if (event === 'SIGNED_OUT') return ANONYMOUS
  return stateFromSession(session)
}

// --- Redirect plumbing shared by the sign-in and callback pages (P2.2) --------------------------

/** Where Supabase sends the browser back to: `<origin><BASE_URL>auth/callback`, never hardcoded. */
export function callbackUrl(origin: string, baseUrl: string): string {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  return `${origin}${base}auth/callback`
}

export const NEXT_STORAGE_KEY = 'hygieia.auth.next'

/**
 * Only an in-app path may be a return target: it must start with a single `/` (so `//evil.example`
 * and `https://…` are rejected) — the open-redirect guard for `?next=`.
 */
export function safeNextPath(value: unknown): string | null {
  if (typeof value !== 'string') return null
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null
  return value
}

/** Remember `?next=` across the round trip to the identity provider. Storage may throw; ignore. */
export function storeNext(storage: Pick<Storage, 'setItem'>, next: unknown): void {
  const path = safeNextPath(next)
  if (!path) return
  try {
    storage.setItem(NEXT_STORAGE_KEY, path)
  } catch {
    // No storage: the user lands on the home page after sign-in. Acceptable.
  }
}

/** Read and clear the stored return path; `/` when none or unusable. */
export function takeNext(storage: Pick<Storage, 'getItem' | 'removeItem'>): string {
  try {
    const stored = storage.getItem(NEXT_STORAGE_KEY)
    storage.removeItem(NEXT_STORAGE_KEY)
    return safeNextPath(stored) ?? '/'
  } catch {
    return '/'
  }
}
