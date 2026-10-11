// OVERLAY 0012 — moved aad.org sources (./0012-fix-aad-links.ts). Proven here: the overlay only
// patches `sources` of three existing skincare tips, and no SERVED tip still cites a dead address.

import { describe, expect, it } from 'vitest'
import { OVERLAID_SEED } from '../../../test/overlaidSeed'
import { SKINCARE_TIPS } from '../skincare'
import { OVERLAY } from './0012-fix-aad-links'
import { OVERLAYS } from './index'

const DEAD = [
  'https://www.aad.org/public/everyday-care/skin-care-basics/care/how-to-test-skin-care-products',
  'https://www.aad.org/public/everyday-care/nail-care-secrets/basics/artificial-nails',
  'https://www.aad.org/public/everyday-care/sun-protection/sunscreen-patients/sunscreen-faqs',
]

describe('overlay 0012-fix-aad-links', () => {
  it('is registered and patches sources only, of existing tips', () => {
    expect(OVERLAYS.map((o) => o.id)).toContain('0012-fix-aad-links')
    expect(OVERLAY.additions).toBeUndefined()
    const patches = OVERLAY.patches?.skincare_tips ?? []
    expect(patches).toHaveLength(3)
    const base = new Set(SKINCARE_TIPS.map((t) => t.slug))
    for (const p of patches) {
      expect(base.has(p.slug), p.slug).toBe(true)
      expect(Object.keys(p.set)).toEqual(['sources'])
      for (const url of p.set.sources ?? []) expect(url).toMatch(/^https:\/\/www\.aad\.org\//)
    }
    expect(Object.keys(OVERLAY.patches ?? {})).toEqual(['skincare_tips'])
  })

  it('leaves no served skincare tip citing a dead aad.org address', () => {
    const cited = OVERLAID_SEED.skincare_tips.flatMap((t) => t.sources)
    for (const url of DEAD) expect(cited).not.toContain(url)
    const served = new Map(OVERLAID_SEED.skincare_tips.map((t) => [t.slug, t]))
    for (const p of OVERLAY.patches?.skincare_tips ?? [])
      expect(served.get(p.slug)?.sources).toEqual(p.set.sources)
  })
})
