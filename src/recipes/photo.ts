// RECIPE PHOTO URLS (2026-10-06). A recipe's `image_path` is a base path relative to the site root
// (`recipes/<slug>`); the files are `<base>-480.webp` (card) and `<base>-960.webp` (detail hero),
// both 4:3, produced by scripts/recipe-photos.mjs. Resolved against Vite's BASE_URL so the same
// value works under `/hygieia/` (Pages) and in tests.

export const PHOTO_WIDTHS = [480, 960] as const
export type PhotoWidth = (typeof PHOTO_WIDTHS)[number]

/** Intrinsic height of a 4:3 variant (width/height attributes reserve the box: no layout shift). */
export function photoHeight(width: PhotoWidth): number {
  return (width * 3) / 4
}

export function recipePhotoSrc(imagePath: string, width: PhotoWidth): string {
  return `${import.meta.env.BASE_URL}${imagePath}-${width}.webp`
}

export function recipePhotoSrcSet(imagePath: string): string {
  return PHOTO_WIDTHS.map((width) => `${recipePhotoSrc(imagePath, width)} ${width}w`).join(', ')
}
