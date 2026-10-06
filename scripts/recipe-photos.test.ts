// @vitest-environment node
// RECIPE PHOTOS (2026-10-06): every image_path that content overlay 0005 sets resolves to BOTH web
// variants in public/recipes/, at 4:3, and public/recipes/ holds nothing the overlay does not name
// (an orphan photo would ship and never be shown).
import { readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { OVERLAYS } from '../src/content/seed/overlays/index'

const dir = resolve(import.meta.dirname, '..', 'public', 'recipes')
const patches =
  OVERLAYS.find((overlay) => overlay.id === '0005-recipe-photos')?.patches?.recipes ?? []

describe('recipe photo files', () => {
  it('overlay 0005 exists and names at least one photo', () => {
    expect(patches.length).toBeGreaterThan(0)
  })

  it('every overlay photo has a 480×360 and a 960×720 WebP, and nothing else is shipped', async () => {
    const expected = patches.flatMap((patch) =>
      [480, 960].map((width) =>
        `${String(patch.set.image_path)}-${width}.webp`.slice('recipes/'.length),
      ),
    )
    expect(readdirSync(dir).sort()).toEqual([...expected].sort())
    for (const file of expected) {
      const meta = await sharp(join(dir, file)).metadata()
      expect(meta.format).toBe('webp')
      const width = file.endsWith('-480.webp') ? 480 : 960
      expect([meta.width, meta.height]).toEqual([width, (width * 3) / 4])
    }
  })
})
