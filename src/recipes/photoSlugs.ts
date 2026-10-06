// FRAME-FIRST HERO (perf, 2026-10-07). The recipe page knows its slug from the route before any
// seed byte arrives; when content overlay 0005 gives that slug a photo, the hero's URL is
// `recipes/<slug>` (the overlay's convention), so the page can start the hero in its FIRST frame
// instead of after the data. The overlay is the single source of truth for both the DB column and
// this set. Imported only by RecipePage (its lazy route chunk).

import { OVERLAY } from '../content/seed/overlays/0005-recipe-photos.ts'

const PHOTO_PATHS: ReadonlyMap<string, string> = new Map(
  (OVERLAY.patches?.recipes ?? []).flatMap((patch) =>
    typeof patch.set.image_path === 'string' ? [[patch.slug, patch.set.image_path] as const] : [],
  ),
)

/** The image_path overlay 0005 sets for `slug`, or null (no photo / unknown slug). */
export function framePhotoPath(slug: string): string | null {
  return PHOTO_PATHS.get(slug) ?? null
}
