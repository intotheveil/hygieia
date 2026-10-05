import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LangProvider } from '../i18n/LangProvider'
import { el, en, type Lang } from '../i18n/dictionary'
import type { HygieiaClient } from '../lib/supabase'
import { AuthProvider } from './AuthProvider'
import { CallbackPage } from './CallbackPage'
import { fakeClient, fakeSession } from './fake-client'
import { NEXT_STORAGE_KEY } from './session'
import { SignInPage } from './SignInPage'

function renderAt(path: string, client: HygieiaClient | null, lang: Lang = 'en', timeoutMs = 30) {
  return render(
    <LangProvider initial={lang}>
      <AuthProvider client={client}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/" element={<p>home-probe</p>} />
            <Route path="/plans" element={<p>plans-probe</p>} />
            <Route path="/auth" element={<SignInPage />} />
            <Route path="/auth/callback" element={<CallbackPage timeoutMs={timeoutMs} />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </LangProvider>,
  )
}

describe('SignInPage', () => {
  beforeEach(() => window.sessionStorage.clear())

  it('sends a magic link to the typed email with a redirect ending in /auth/callback', async () => {
    const fake = fakeClient()
    renderAt('/auth', fake.client)
    fireEvent.change(screen.getByLabelText(en.signInEmailLabel), {
      target: { value: 'someone@example.test' },
    })
    fireEvent.click(screen.getByRole('button', { name: en.signInSendLink }))
    await waitFor(() => expect(fake.signInWithOtp).toHaveBeenCalledTimes(1))
    expect(fake.signInWithOtp).toHaveBeenCalledWith({
      email: 'someone@example.test',
      options: { emailRedirectTo: expect.stringMatching(/^http.*\/auth\/callback$/) },
    })
    expect(await screen.findByRole('status')).toHaveTextContent(en.signInLinkSent)
  })

  it('"Continue with Google" calls signInWithOAuth with provider google and the same redirect', async () => {
    const fake = fakeClient()
    renderAt('/auth', fake.client)
    fireEvent.click(screen.getByRole('button', { name: en.signInGoogle }))
    await waitFor(() => expect(fake.signInWithOAuth).toHaveBeenCalledTimes(1))
    expect(fake.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: expect.stringMatching(/\/auth\/callback$/) },
    })
  })

  it('stores a safe ?next= before leaving and ignores an off-site one', async () => {
    const fake = fakeClient()
    const { unmount } = renderAt('/auth?next=/plans', fake.client)
    fireEvent.click(screen.getByRole('button', { name: en.signInGoogle }))
    await waitFor(() => expect(window.sessionStorage.getItem(NEXT_STORAGE_KEY)).toBe('/plans'))
    unmount()
    window.sessionStorage.clear()
    const second = fakeClient()
    renderAt('/auth?next=//evil.example', second.client)
    fireEvent.click(screen.getByRole('button', { name: en.signInGoogle }))
    await waitFor(() => expect(second.signInWithOAuth).toHaveBeenCalledTimes(1))
    expect(window.sessionStorage.getItem(NEXT_STORAGE_KEY)).toBeNull()
  })

  it('shows the failure copy when the OTP call errors', async () => {
    const fake = fakeClient({ otpError: 'rate limited' })
    renderAt('/auth', fake.client)
    fireEvent.change(screen.getByLabelText(en.signInEmailLabel), {
      target: { value: 'someone@example.test' },
    })
    fireEvent.click(screen.getByRole('button', { name: en.signInSendLink }))
    expect(await screen.findByRole('alert')).toHaveTextContent(en.signInFailed)
  })

  it.each([
    ['en', en],
    ['el', el],
  ] as const)('renders the unavailable state in %s when there is no client', (lang, t) => {
    renderAt('/auth', null, lang)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(t.signInUnavailableTitle)
    expect(screen.getByText(t.signInUnavailableBody)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: t.signInGoogle })).not.toBeInTheDocument()
  })

  it('offers sign-out when already signed in', async () => {
    const fake = fakeClient({ session: fakeSession('u-1', 'me@example.test') })
    renderAt('/auth', fake.client)
    expect(await screen.findByText('me@example.test')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: en.signOut }))
    await waitFor(() => expect(fake.signOut).toHaveBeenCalledTimes(1))
  })
})

describe('CallbackPage', () => {
  beforeEach(() => window.sessionStorage.clear())

  it('shows the working copy, then navigates to the stored return path once signed in', async () => {
    window.sessionStorage.setItem(NEXT_STORAGE_KEY, '/plans')
    const fake = fakeClient()
    renderAt('/auth/callback?code=abc', fake.client, 'el', 5_000)
    expect(screen.getByRole('status')).toHaveTextContent(el.callbackWorking)
    fake.emit('SIGNED_IN', fakeSession('u-cb', 'cb@example.test'))
    expect(await screen.findByText('plans-probe')).toBeInTheDocument()
    expect(window.sessionStorage.getItem(NEXT_STORAGE_KEY)).toBeNull()
  })

  it('defaults the return path to / when nothing was stored', async () => {
    const fake = fakeClient({ session: fakeSession('u-cb') })
    renderAt('/auth/callback?code=abc', fake.client, 'en', 5_000)
    expect(await screen.findByText('home-probe')).toBeInTheDocument()
  })

  it('fails immediately when the provider reports an error in the URL', () => {
    renderAt('/auth/callback?error=access_denied&error_description=denied', fakeClient().client)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(en.callbackFailed)
    expect(screen.getByRole('link', { name: en.backToSignIn })).toHaveAttribute('href', '/auth')
  })

  it('fails when no session arrives before the timeout', async () => {
    renderAt('/auth/callback?code=stale', fakeClient().client, 'el', 20)
    expect(screen.getByRole('status')).toHaveTextContent(el.callbackWorking)
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(el.callbackFailed)
  })

  it('fails when there is no client at all', () => {
    renderAt('/auth/callback?code=abc', null)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(en.callbackFailed)
  })
})
