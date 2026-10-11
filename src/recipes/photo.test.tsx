// RECIPE PHOTOS (2026-10-06): URL helpers, the card thumbnail, the detail hero, and the bundled
// source serving `image_path` from EVERY recipe-photo content overlay (0005, 0008, 0010, … — derived
// from the overlay list, never pinned; the files themselves: scripts/recipe-photos.test.ts).
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { contentSource } from '../content/index'
import { ok, type ContentSource, type Recipe } from '../content/source'
import { LangProvider } from '../i18n/LangProvider'
import { el, en, type Lang } from '../i18n/dictionary'
import { fill } from '../i18n/fill'
import { OVERLAYS } from '../content/seed/overlays/index'
import { RECIPES } from '../content/seed/recipes'
import { RecipeCard } from './RecipeCard'
import { RecipePage } from './RecipePage'
import { photoHeight, recipePhotoSrc, recipePhotoSrcSet } from './photo'
import { framePhotoPath, PHOTO_OVERLAY_IDS } from './photoSlugs'

const BASE = import.meta.env.BASE_URL
const SLUG = 'fasolada-white-bean-soup'

/** Every overlay that sets a recipe's image_path, in list order — however many batches there are. */
const PHOTO_OVERLAYS = OVERLAYS.filter((overlay) =>
  (overlay.patches?.recipes ?? []).some((patch) => 'image_path' in patch.set),
)

async function seeded(slug: string): Promise<Recipe> {
  const result = await contentSource.getRecipe(slug)
  if (!result.ok || result.data === null) throw new Error(`no seeded recipe ${slug}`)
  return result.data
}

/** A source that answers one recipe (with the given image_path) and the real diets. */
function sourceWith(recipe: Recipe): ContentSource {
  return {
    ...contentSource,
    getRecipe: async () => ok(recipe),
  }
}

function renderPage(source: ContentSource, lang: Lang) {
  return render(
    <LangProvider initial={lang}>
      <MemoryRouter initialEntries={[`/recipes/${SLUG}`]}>
        <Routes>
          <Route path="/recipes/:slug" element={<RecipePage source={source} />} />
        </Routes>
      </MemoryRouter>
    </LangProvider>,
  )
}

function renderCard(recipe: Recipe, lang: Lang) {
  return render(
    <LangProvider initial={lang}>
      <MemoryRouter>
        <ul>
          <RecipeCard recipe={recipe} dietsBySlug={new Map()} />
        </ul>
      </MemoryRouter>
    </LangProvider>,
  )
}

describe('recipe photo URLs', () => {
  it('resolves the two 4:3 WebP variants against BASE_URL', () => {
    expect(recipePhotoSrc('recipes/x', 480)).toBe(`${BASE}recipes/x-480.webp`)
    expect(recipePhotoSrc('recipes/x', 960)).toBe(`${BASE}recipes/x-960.webp`)
    expect(recipePhotoSrcSet('recipes/x')).toBe(
      `${BASE}recipes/x-480.webp 480w, ${BASE}recipes/x-960.webp 960w`,
    )
    expect(photoHeight(480)).toBe(360)
    expect(photoHeight(960)).toBe(720)
  })
})

describe('bundled source image_path (every photo overlay)', () => {
  const photoPatches = PHOTO_OVERLAYS.flatMap((overlay) => overlay.patches?.recipes ?? [])

  it('finds every photo batch: at least 0005, 0008 and 0010', () => {
    expect(PHOTO_OVERLAYS.map((overlay) => overlay.id)).toEqual(
      expect.arrayContaining([
        '0005-recipe-photos',
        '0008-recipe-photos-2',
        '0010-recipe-photos-3',
      ]),
    )
  })

  it('sets image_path = recipes/<slug> on real recipes only', () => {
    expect(photoPatches.length).toBeGreaterThan(0)
    for (const patch of photoPatches)
      expect(patch.set).toEqual({ image_path: `recipes/${patch.slug}` })
  })

  it("serves exactly the overlays' photos and leaves the frozen base seed untouched", async () => {
    const result = await contentSource.listRecipes()
    if (!result.ok) throw new Error(result.error)
    const withPhoto = new Set(photoPatches.map((patch) => patch.slug))
    for (const recipe of result.data) {
      expect(recipe.image_path).toBe(withPhoto.has(recipe.slug) ? `recipes/${recipe.slug}` : null)
    }
    expect(RECIPES.every((recipe) => recipe.image_path === null)).toBe(true)
  })
})

describe('<RecipeCard> photo', () => {
  it.each([
    ['en', en],
    ['el', el],
  ] as const)('shows the lazy 480w 4:3 photo with a localized alt (%s)', async (lang, dict) => {
    const recipe = { ...(await seeded(SLUG)), image_path: `recipes/${SLUG}` }
    renderCard(recipe, lang)
    const title = lang === 'el' ? recipe.title_el : recipe.title_en
    const img = screen.getByRole('img', { name: fill(dict.recipePhotoAlt, { title }) })
    expect(img).toHaveAttribute('src', `${BASE}recipes/${SLUG}-480.webp`)
    expect(img).toHaveAttribute('loading', 'lazy')
    expect(img).toHaveAttribute('decoding', 'async')
    expect(img).toHaveAttribute('width', '480')
    expect(img).toHaveAttribute('height', '360')
  })

  it('renders no image when image_path is null', async () => {
    renderCard({ ...(await seeded(SLUG)), image_path: null }, 'en')
    expect(document.querySelector('img')).toBeNull()
  })
})

describe('<RecipePage> hero', () => {
  it.each([
    ['en', en],
    ['el', el],
  ] as const)(
    'shows the hero with a 480w/960w srcset and a localized alt (%s)',
    async (lang, dict) => {
      const recipe = { ...(await seeded(SLUG)), image_path: `recipes/${SLUG}` }
      renderPage(sourceWith(recipe), lang)
      const title = lang === 'el' ? recipe.title_el : recipe.title_en
      const img = await screen.findByRole('img', { name: fill(dict.recipePhotoAlt, { title }) })
      expect(img).toHaveAttribute('src', `${BASE}recipes/${SLUG}-960.webp`)
      expect(img).toHaveAttribute('srcset', recipePhotoSrcSet(`recipes/${SLUG}`))
      expect(img).toHaveAttribute('sizes')
      expect(img).toHaveAttribute('width', '960')
      expect(img).toHaveAttribute('height', '720')
      expect(img).not.toHaveAttribute('loading', 'lazy')
      // Phones get the 480w file whatever their DPR (the hero is the route's LCP element).
      const source = img.parentElement?.querySelector('source')
      expect(img.parentElement?.tagName).toBe('PICTURE')
      expect(source).toHaveAttribute('media', '(max-width: 47.99rem)')
      expect(source).toHaveAttribute('srcset', `${BASE}recipes/${SLUG}-480.webp`)
    },
  )

  it('renders no hero when image_path is null', async () => {
    renderPage(sourceWith({ ...(await seeded(SLUG)), image_path: null }), 'en')
    await screen.findByRole('heading', { level: 1 })
    expect(document.querySelector('img')).toBeNull()
  })
})

describe('<RecipePage> frame-first hero', () => {
  it('starts the hero in the first frame from the route slug, before the recipe loads', () => {
    const pending: ContentSource = {
      ...contentSource,
      getRecipe: () => new Promise(() => {}),
    }
    renderPage(pending, 'en')
    // Still loading: no title yet, but the hero (decorative until the title arrives) is there.
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
    const img = document.querySelector('img')
    expect(img).toHaveAttribute('src', `${BASE}recipes/${SLUG}-960.webp`)
    expect(img).toHaveAttribute('alt', '')
    expect(img).toHaveAttribute('fetchpriority', 'high')
  })

  it('reads exactly the photo overlays the overlay list has (the file-name glob misses none)', () => {
    expect(PHOTO_OVERLAY_IDS).toEqual(PHOTO_OVERLAYS.map((overlay) => overlay.id))
  })

  it.each(PHOTO_OVERLAYS.map((overlay) => [overlay.id, overlay] as const))(
    'knows every batch: a slug overlay %s gives a photo starts its hero',
    (id, overlay) => {
      const slug = overlay.patches?.recipes?.[0]?.slug ?? `missing-${id}`
      expect(framePhotoPath(slug)).toBe(`recipes/${slug}`)
      const pending: ContentSource = { ...contentSource, getRecipe: () => new Promise(() => {}) }
      render(
        <LangProvider initial="en">
          <MemoryRouter initialEntries={[`/recipes/${slug}`]}>
            <Routes>
              <Route path="/recipes/:slug" element={<RecipePage source={pending} />} />
            </Routes>
          </MemoryRouter>
        </LangProvider>,
      )
      expect(document.querySelector('img')).toHaveAttribute(
        'src',
        `${BASE}recipes/${slug}-960.webp`,
      )
    },
  )

  it('framePhotoPath answers every photo overlay slug, and null for anything else', () => {
    const photoPatches = OVERLAYS.flatMap((overlay) => overlay.patches?.recipes ?? []).filter(
      (patch) => 'image_path' in patch.set,
    )
    for (const patch of photoPatches) expect(framePhotoPath(patch.slug)).toBe(patch.set.image_path)
    expect(framePhotoPath('no-such-recipe')).toBeNull()
  })

  it('starts no hero for a slug no photo overlay gives a photo', () => {
    const pending: ContentSource = { ...contentSource, getRecipe: () => new Promise(() => {}) }
    render(
      <LangProvider initial="en">
        <MemoryRouter initialEntries={['/recipes/no-such-recipe']}>
          <Routes>
            <Route path="/recipes/:slug" element={<RecipePage source={pending} />} />
          </Routes>
        </MemoryRouter>
      </LangProvider>,
    )
    expect(document.querySelector('img')).toBeNull()
  })
})
