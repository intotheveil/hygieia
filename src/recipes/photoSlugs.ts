// FRAME-FIRST HERO (perf, 2026-10-07). The recipe page knows its slug from the route before any
// seed byte arrives; when a recipe-photo content overlay (0005, and 0008 for the recipes of
// overlays 0006/0007) gives that slug a photo, the hero's URL is `recipes/<slug>` (the overlays'
// convention), so the page can start the hero in its FIRST frame instead of after the data. The
// overlays are the single source of truth for both the DB column and this set. Both are small
// patch-only modules the recipes loader imports anyway (by-table/recipes.ts), so this costs no
// extra chunk. Imported only by RecipePage (its lazy route chunk).

import { OVERLAY as PHOTOS_0005 } from '../content/seed/overlays/0005-recipe-photos.ts'
import { OVERLAY as PHOTOS_0008 } from '../content/seed/overlays/0008-recipe-photos-2.ts'

const PHOTO_PATHS: ReadonlyMap<string, string> = new Map(
  [PHOTOS_0005, PHOTOS_0008].flatMap((overlay) =>
    (overlay.patches?.recipes ?? []).flatMap((patch) =>
      typeof patch.set.image_path === 'string' ? [[patch.slug, patch.set.image_path] as const] : [],
    ),
  ),
)

/** The image_path a recipe-photo overlay sets for `slug`, or null (no photo / unknown slug). */
export function framePhotoPath(slug: string): string | null {
  return PHOTO_PATHS.get(slug) ?? null
}
