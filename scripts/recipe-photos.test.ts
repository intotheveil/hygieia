// @vitest-environment node
// RECIPE PHOTOS (2026-10-06; later batches 2026-10-11): every image_path a content overlay sets
// (0005, 0008, 0010, … — derived from the overlay list, never pinned) resolves to BOTH web variants
// in public/recipes/, at 4:3, and public/recipes/ holds nothing an overlay does not name (an orphan
// photo would ship and never be shown). Every served recipe has a photo, each later batch patches
// only recipes added before it, and `--only-missing` authors an overlay that never re-patches an
// earlier one.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import sharp from 'sharp'
import { afterAll, describe, expect, it } from 'vitest'
import { RECIPES } from '../src/content/seed/recipes'
import { OVERLAYS } from '../src/content/seed/overlays/index'

const root = resolve(import.meta.dirname, '..')
const dir = join(root, 'public', 'recipes')
const photoOverlays = OVERLAYS.filter((overlay) =>
  (overlay.patches?.recipes ?? []).some((patch) => 'image_path' in patch.set),
)
const patches = photoOverlays.flatMap((overlay) => overlay.patches?.recipes ?? [])
const slugsOf = (overlay: (typeof OVERLAYS)[number]) =>
  (overlay.patches?.recipes ?? []).map((patch) => patch.slug)

describe('recipe photo files', () => {
  it('the photo overlays are named NNNN-recipe-photos*, patch image_path only, no slug twice', () => {
    expect(photoOverlays.map((overlay) => overlay.id)).toEqual(
      expect.arrayContaining([
        '0005-recipe-photos',
        '0008-recipe-photos-2',
        '0010-recipe-photos-3',
      ]),
    )
    for (const overlay of photoOverlays) {
      expect(overlay.id).toMatch(/^\d{4}-recipe-photos(-\d+)?$/)
      expect(overlay.additions, overlay.id).toBeUndefined()
      expect(Object.keys(overlay.patches ?? {}), overlay.id).toEqual(['recipes'])
      for (const patch of overlay.patches?.recipes ?? [])
        expect(patch.set, patch.slug).toEqual({ image_path: `recipes/${patch.slug}` })
    }
    const slugs = patches.map((patch) => patch.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('every served recipe has a photo, from a batch registered after the recipe was added', () => {
    const added = new Map<string, number>(RECIPES.map((r) => [r.slug, -1]))
    for (const [i, overlay] of OVERLAYS.entries())
      for (const r of overlay.additions?.recipes ?? []) added.set(r.slug, i)
    const photographed = new Map<string, number>()
    for (const [i, overlay] of OVERLAYS.entries())
      if (photoOverlays.includes(overlay)) for (const s of slugsOf(overlay)) photographed.set(s, i)
    expect([...photographed.keys()].sort()).toEqual([...added.keys()].sort())
    for (const [slug, at] of photographed)
      expect(at, `${slug} photographed before it exists`).toBeGreaterThan(added.get(slug) ?? 99)
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

  it.each(photoOverlays.slice(1).map((overlay) => [overlay.id] as const))(
    're-authoring %s yields its slugs plus every later batch, never an earlier batch',
    (id) => {
      const got = author(`${id}.ts`, true)
      const want = photoOverlays.filter((overlay) => overlay.id >= id).flatMap(slugsOf)
      expect([...got].sort()).toEqual([...want].sort())
    },
  )

  it('without the flag it patches every complete set (the 0005 behaviour)', () => {
    expect(author('9999-all.ts', false).sort()).toEqual(patches.map((patch) => patch.slug).sort())
  })
})
