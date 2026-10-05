// Rasterise public/icons/icon.svg into the PWA icon set. Run: `npm run icons`.
// The PNGs are committed (the build does not regenerate them); re-run after editing the SVG.
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const svg = readFileSync(resolve(root, 'public/icons/icon.svg'))
const out = (name) => resolve(root, 'public/icons', name)

const targets = [
  ['pwa-192.png', 192],
  ['pwa-512.png', 512],
  ['maskable-512.png', 512],
  ['apple-touch-icon-180.png', 180],
]
for (const [name, size] of targets) {
  await sharp(svg, { density: 384 }).resize(size, size).png({ compressionLevel: 9 }).toFile(out(name))
  console.log('wrote', name, size)
}
