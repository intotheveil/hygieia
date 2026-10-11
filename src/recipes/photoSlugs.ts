// FRAME-FIRST HERO (perf, 2026-10-07). The recipe page knows its slug from the route before any
// seed byte arrives; when a recipe-photo content overlay gives that slug a photo, the hero's URL is
// `recipes/<slug>` (the overlays' convention), so the page can start the hero in its FIRST frame
// instead of after the data. The overlays are the single source of truth for both the DB column and
// this set.
//
// Every photo overlay is found by its file name, `NNNN-recipe-photos*.ts` (0005, 0008, 0010, …), so
// a new photo batch is picked up without touching this module; photo.test.tsx proves the glob
// matches exactly the overlays in ../content/seed/overlays/index.ts that set `image_path`. They are
// small patch-only modules the recipes loader imports anyway (by-table/recipes.ts), so this costs no
// extra chunk; never glob a module that carries recipe ROWS here (it would pull them into the route
// chunk). Imported only by RecipePage (its lazy route chunk).

import type { Overlay } from '../content/seed/overlays/types.ts'

const PHOTO_OVERLAYS: readonly Overlay[] = Object.entries(
  import.meta.glob<Overlay>('../content/seed/overlays/[0-9][0-9][0-9][0-9]-recipe-photos*.ts', {
    eager: true,
    import: 'OVERLAY',
  }),
)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, overlay]) => overlay)

/** The ids of the photo overlays this module read, in NNNN order (for the tests). */
export const PHOTO_OVERLAY_IDS: readonly string[] = PHOTO_OVERLAYS.map((overlay) => overlay.id)

const PHOTO_PATHS: ReadonlyMap<string, string> = new Map(
  PHOTO_OVERLAYS.flatMap((overlay) =>
    (overlay.patches?.recipes ?? []).flatMap((patch) =>
      typeof patch.set.image_path === 'string' ? [[patch.slug, patch.set.image_path] as const] : [],
    ),
  ),
)

/** The image_path a recipe-photo overlay sets for `slug`, or null (no photo / unknown slug). */
export function framePhotoPath(slug: string): string | null {
  return PHOTO_PATHS.get(slug) ?? null
}
