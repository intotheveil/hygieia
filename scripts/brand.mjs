// Derive the hero image variants from the committed JPEG masters. Run: `npm run brand`.
// The outputs are committed (the build does not regenerate them); re-run after replacing a master.
//
// Why (PLAN P5.3, Lighthouse mobile): the hero is the LCP element. On a 412 css px phone at DPR 1.75
// the browser needs ~665 device px, so with only 608w and 1216w candidates it downloaded the 1216w
// JPEG (124 kB); an 800w candidate and WebP (`modern-image-formats`, ~35% smaller) cut that in half.
// `og-hygieia.jpg` is left alone: social cards want a plain JPEG at the declared 1216×640.
//
// One master per theme (src/theme/themes.ts; operator request 2026-10-06): `hero-plate` is the
// kitchen default, `hero-dark` / `hero-athletic` / `hero-gamer` / `hero-rose` / `hero-lavender`
// were rendered on the operator's ComfyUI (RealVisXL V5) at 1216×640. The home page picks the set
// that matches `data-theme` (src/App.tsx), so a visitor downloads exactly one set, as before.
import sharp from 'sharp'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const brand = (name) => resolve(root, 'public/brand', name)

const masters = [
  'hero-plate',
  'hero-dark',
  'hero-athletic',
  'hero-gamer',
  'hero-rose',
  'hero-lavender',
] // each `<stem>.jpg`, 1216×640
for (const stem of masters) {
  const master = brand(`${stem}.jpg`)
  const targets = [
    [`${stem}-sm.jpg`, 608, 'jpeg'],
    [`${stem}-800.webp`, 800, 'webp'],
    [`${stem}-1216.webp`, 1216, 'webp'],
  ]
  for (const [name, width, kind] of targets) {
    const resized = sharp(master).resize({ width, withoutEnlargement: true })
    const encoded =
      kind === 'webp' ? resized.webp({ quality: 80 }) : resized.jpeg({ quality: 80, mozjpeg: true })
    const info = await encoded.toFile(brand(name))
    console.log('wrote', name, `${info.width}×${info.height}`, `${info.size} bytes`)
  }
}
