// The home page's extras slot (src/App.tsx): until the lazy chunk (./HomeExtras.tsx) arrives, a
// skeleton draws the SAME boxes (./layout.ts) so the swap is not a layout shift. Its own file on
// purpose: App keeps the loaded chunk in a module variable, so only a fresh module graph (one per
// test file) shows the skeleton on its first render.

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { LangProvider } from '../i18n/LangProvider'
import { dictionaries } from '../i18n/dictionary'
import { ThemeProvider } from '../theme/ThemeProvider'
import { TODAY_CARD, onboardingBox } from './layout'

const ONBOARDING_BOX = onboardingBox('en')

const en = dictionaries.en

function renderHome() {
  return render(
    <LangProvider initial="en">
      <ThemeProvider>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </ThemeProvider>
    </LangProvider>,
  )
}

describe('home extras skeleton', () => {
  beforeEach(() => window.localStorage.clear())

  it('reserves the onboarding box and the two of-the-day cards, then swaps in the same boxes', async () => {
    renderHome()
    const skeleton = screen.getByTestId('home-extras-skeleton')
    expect(skeleton).toHaveAttribute('aria-hidden', 'true')
    const [onboardingBone, todayRow] = [...skeleton.children]
    expect(onboardingBone).toHaveClass(...ONBOARDING_BOX.split(' '))
    const todayBones = [...(todayRow?.children ?? [])]
    expect(todayBones).toHaveLength(2)
    for (const bone of todayBones) expect(bone).toHaveClass(...TODAY_CARD.split(' '))

    const card = await screen.findByRole('region', { name: en.prefsTitle })
    expect(screen.queryByTestId('home-extras-skeleton')).toBeNull()
    expect(card).toHaveClass(...ONBOARDING_BOX.split(' '))
    expect(screen.getByTestId('recipe-of-the-day')).toHaveClass(...TODAY_CARD.split(' '))
    expect(screen.getByTestId('tip-of-the-day')).toHaveClass(...TODAY_CARD.split(' '))
  })

  it('a returning visitor (preferences stored) gets no onboarding box', () => {
    window.localStorage.setItem('hygieia:prefs', '{"skipped":true}')
    renderHome()
    // Either the skeleton (first render in this module graph) or the loaded extras: no onboarding.
    const skeleton = screen.queryByTestId('home-extras-skeleton')
    if (skeleton !== null) expect(skeleton.children).toHaveLength(1)
    expect(screen.queryByRole('region', { name: en.prefsTitle })).toBeNull()
  })
})
