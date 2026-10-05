// Derive the hero image variants from the committed JPEG masters. Run: `npm run brand`.
// The outputs are committed (the build does not regenerate them); re-run after replacing a master.
//
// Why (PLAN P5.3, Lighthouse mobile): the hero is the LCP element. On a 412 css px phone at DPR 1.75
// the browser needs ~665 device px, so with only 608w and 1216w candidates it downloaded the 1216w
// JPEG (124 kB); an 800w candidate and WebP (`modern-image-formats`, ~35% smaller) cut that in half.
// `og-hygieia.jpg` is left alone: social cards want a plain JPEG at the declared 1216×640.
import sharp from 'sharp'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const brand = (name) => resolve(root, 'public/brand', name)

const master = brand('hero-plate.jpg') // 1216×640
const targets = [
  ['hero-plate-800.webp', 800],
  ['hero-plate-1216.webp', 1216],
]
for (const [name, width] of targets) {
  const info = await sharp(master)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(brand(name))
  console.log('wrote', name, `${info.width}×${info.height}`, `${info.size} bytes`)
}
