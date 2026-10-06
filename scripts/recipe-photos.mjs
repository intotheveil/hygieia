// RECIPE PHOTOS (2026-10-06): turns the accepted ComfyUI masters (1024×768 PNG, one per recipe
// slug, rendered + vision-QA'd outside the repo) into the two web variants the app serves, and
// (with `--overlay <file>`) authors the content overlay that sets each recipe's `image_path`.
//
//   node scripts/recipe-photos.mjs [<dir-of-masters>] [--overlay src/content/seed/overlays/NNNN-recipe-photos.ts]
//   (masters are named <slug>.png)
//
// Variants: public/recipes/<slug>-480.webp (q72, the card) and -960.webp (q75, the detail hero).
// Both are 4:3. They are NOT precached by the service worker (vite.config.ts `globIgnores`); a
// runtime CacheFirst rule (`recipe-images`) keeps what the user actually viewed.
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import sharp from 'sharp'

const root = resolve(import.meta.dirname, '..')
const outDir = join(root, 'public', 'recipes')
const VARIANTS = [
  { width: 480, quality: 72 },
  { width: 960, quality: 75 },
]

const src = process.argv[2]?.startsWith('--') ? undefined : process.argv[2]
mkdirSync(outDir, { recursive: true })
if (src) {
  const masters = readdirSync(src).filter((f) => f.endsWith('.png'))
  for (const file of masters) {
    const slug = file.slice(0, -4)
    for (const { width, quality } of VARIANTS) {
      await sharp(join(src, file))
        .resize({ width, height: Math.round((width * 3) / 4), fit: 'cover' })
        .webp({ quality, effort: 6 })
        .toFile(join(outDir, `${slug}-${width}.webp`))
    }
  }
  console.log(`recipe-photos: ${masters.length} masters → ${masters.length * VARIANTS.length} webp`)
}

// A slug counts only when BOTH variants exist, so a half-generated set never yields a 404.
const files = new Set(readdirSync(outDir))
const slugs = [...files]
  .filter((f) => f.endsWith('-480.webp'))
  .map((f) => f.slice(0, -'-480.webp'.length))
  .filter((slug) => files.has(`${slug}-960.webp`))
  .sort()
let bytes = 0
for (const f of files) bytes += statSync(join(outDir, f)).size
console.log(
  `recipe-photos: ${slugs.length} complete photo sets; public/recipes = ${files.size} files, ${(bytes / 1024 / 1024).toFixed(2)} MB`,
)

// --overlay <file>: author the content overlay that sets image_path for every complete set. One
// shot: a shipped overlay is never edited (docs/ops/migrations.md), so an existing file is refused.
const at = process.argv.indexOf('--overlay')
if (at > 0) {
  const target = resolve(process.argv[at + 1])
  if (existsSync(target)) throw new Error(`${target} exists — a shipped overlay is never rewritten`)
  const id = basename(target, '.ts')
  const tick = '`'
  const lines = [
    `// OVERLAY ${id.slice(0, 4)} — recipe photos (2026-10-06). Sets ${tick}image_path${tick} = ${tick}recipes/<slug>${tick} for`,
    '// every recipe with an accepted photo: ComfyUI renders (RealVisXL V5, 1024×768), vision-QA’d with',
    '// qwen2.5vl:7b and reviewed by eye, served as public/recipes/<slug>-480.webp and -960.webp (the UI',
    `// appends the width — src/recipes/photo.ts). Authored by ${tick}node scripts/recipe-photos.mjs --overlay${tick}.`,
    '',
    "import type { Overlay } from './types.ts'",
    '',
    'export const OVERLAY: Overlay = {',
    `  id: '${id}',`,
    `  summary: 'photos for ${slugs.length} recipes (image_path = recipes/<slug>)',`,
    '  patches: {',
    '    recipes: [',
    ...slugs.map((slug) => `      { slug: '${slug}', set: { image_path: 'recipes/${slug}' } },`),
    '    ],',
    '  },',
    '}',
    '',
  ]
  writeFileSync(target, lines.join('\n'))
  console.log(`recipe-photos: wrote ${target} (${slugs.length} patches)`)
}
