// @vitest-environment node
// RECIPE PHOTOS (2026-10-06; second batch 2026-10-11): every image_path a content overlay sets
// (0005, then 0008 for the recipes of 0006/0007) resolves to BOTH web variants in public/recipes/,
// at 4:3, and public/recipes/ holds nothing an overlay does not name (an orphan photo would ship
// and never be shown). `--only-missing` authors an overlay that never re-patches an earlier one.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import sharp from 'sharp'
import { afterAll, describe, expect, it } from 'vitest'
import { OVERLAYS } from '../src/content/seed/overlays/index'

const root = resolve(import.meta.dirname, '..')
const dir = join(root, 'public', 'recipes')
const photoOverlays = OVERLAYS.filter((overlay) =>
  (overlay.patches?.recipes ?? []).some((patch) => 'image_path' in patch.set),
)
const patches = photoOverlays.flatMap((overlay) => overlay.patches?.recipes ?? [])
const second = OVERLAYS.find((overlay) => overlay.id === '0008-recipe-photos-2')
const additionsOf = (id: string) =>
  OVERLAYS.find((overlay) => overlay.id === id)?.additions?.recipes?.map((r) => r.slug) ?? []

describe('recipe photo files', () => {
  it('the photo overlays are 0005 and 0008, and no slug is patched twice', () => {
    expect(photoOverlays.map((overlay) => overlay.id)).toEqual([
      '0005-recipe-photos',
      '0008-recipe-photos-2',
    ])
    const slugs = patches.map((patch) => patch.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('overlay 0008 covers exactly the recipes overlays 0006 and 0007 add', () => {
    const expected = [
      ...additionsOf('0006-thin-diets'),
      ...additionsOf('0007-breakfast-snacks-world'),
    ]
    expect(expected.length).toBeGreaterThan(0)
    const got = (second?.patches?.recipes ?? []).map((patch) => patch.slug)
    expect([...got].sort()).toEqual([...expected].sort())
    for (const patch of second?.patches?.recipes ?? [])
      expect(patch.set).toEqual({ image_path: `recipes/${patch.slug}` })
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

describe('recipe-photos.mjs --overlay --only-missing', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'hygieia-photos-'))
  afterAll(() => rmSync(tmp, { recursive: true, force: true }))

  const author = (name: string, onlyMissing: boolean) => {
    const target = join(tmp, name)
    const args = ['scripts/recipe-photos.mjs', '--overlay', target]
    if (onlyMissing) args.push('--only-missing')
    execFileSync(process.execPath, args, { cwd: root, stdio: 'pipe' })
    const text = readFileSync(target, 'utf8')
    return [...text.matchAll(/image_path: 'recipes\/([a-z0-9-]+)'/g)].map((m) => m[1])
  }

  it('re-authoring 0008 yields exactly its slugs: every complete set minus what 0005 patches', () => {
    const got = author('0008-recipe-photos-2.ts', true)
    const want = (second?.patches?.recipes ?? []).map((patch) => patch.slug)
    expect([...got].sort()).toEqual([...want].sort())
  })

  it('without the flag it patches every complete set (the 0005 behaviour)', () => {
    expect(author('0009-all.ts', false).sort()).toEqual(patches.map((patch) => patch.slug).sort())
  })
})
