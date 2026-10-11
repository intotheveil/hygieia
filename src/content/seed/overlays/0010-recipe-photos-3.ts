// OVERLAY 0010 — recipe photos (2026-10-11). Sets `image_path` = `recipes/<slug>` for
// every recipe with an accepted photo that no earlier overlay covers (302 already are):
// ComfyUI renders (RealVisXL V5, 1024×768) of the 0009 crêpes, chosen by eye (the lead's by-eye review
// replaced the qwen2.5vl:7b gate for the final retries; BUILD_LOG RECIPE PHOTOS 3),
// served as public/recipes/<slug>-480.webp and -960.webp (the UI appends the width —
// src/recipes/photo.ts). Authored by `node scripts/recipe-photos.mjs --overlay --only-missing`.

import type { Overlay } from './types.ts'

export const OVERLAY: Overlay = {
  id: '0010-recipe-photos-3',
  summary: 'photos for 12 recipes (image_path = recipes/<slug>)',
  patches: {
    recipes: [
      {
        slug: 'crepe-banana-hazelnut-cocoa-spread',
        set: { image_path: 'recipes/crepe-banana-hazelnut-cocoa-spread' },
      },
      {
        slug: 'crepe-caramelised-apple-cinnamon',
        set: { image_path: 'recipes/crepe-caramelised-apple-cinnamon' },
      },
      {
        slug: 'crepe-chicken-mushroom-kasseri',
        set: { image_path: 'recipes/crepe-chicken-mushroom-kasseri' },
      },
      {
        slug: 'crepe-galette-complete-buckwheat-ham-emmental-egg',
        set: { image_path: 'recipes/crepe-galette-complete-buckwheat-ham-emmental-egg' },
      },
      {
        slug: 'crepe-greek-street-ham-gouda-tomato-lettuce',
        set: { image_path: 'recipes/crepe-greek-street-ham-gouda-tomato-lettuce' },
      },
      {
        slug: 'crepe-honey-walnut-cinnamon',
        set: { image_path: 'recipes/crepe-honey-walnut-cinnamon' },
      },
      {
        slug: 'crepe-lemon-sugar-classic',
        set: { image_path: 'recipes/crepe-lemon-sugar-classic' },
      },
      {
        slug: 'crepe-protein-oat-skyr-blueberry',
        set: { image_path: 'recipes/crepe-protein-oat-skyr-blueberry' },
      },
      {
        slug: 'crepe-smoked-salmon-cream-cheese-dill',
        set: { image_path: 'recipes/crepe-smoked-salmon-cream-cheese-dill' },
      },
      {
        slug: 'crepe-spinach-feta-spanakopita-style',
        set: { image_path: 'recipes/crepe-spinach-feta-spanakopita-style' },
      },
      {
        slug: 'crepe-strawberry-greek-yoghurt-honey',
        set: { image_path: 'recipes/crepe-strawberry-greek-yoghurt-honey' },
      },
      {
        slug: 'crepe-vegan-mushroom-pepper-spinach',
        set: { image_path: 'recipes/crepe-vegan-mushroom-pepper-spinach' },
      },
    ],
  },
}
