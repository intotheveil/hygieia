// OVERLAY 0008 — recipe photos (2026-10-11). Sets `image_path` = `recipes/<slug>` for
// every recipe with an accepted photo that no earlier overlay covers (182 already are):
// ComfyUI renders (RealVisXL V5, 1024×768), vision-QA’d with qwen2.5vl:7b and reviewed by eye,
// served as public/recipes/<slug>-480.webp and -960.webp (the UI appends the width —
// src/recipes/photo.ts). Authored by `node scripts/recipe-photos.mjs --overlay --only-missing`.

import type { Overlay } from './types.ts'

export const OVERLAY: Overlay = {
  id: '0008-recipe-photos-2',
  summary: 'photos for 120 recipes (image_path = recipes/<slug>)',
  patches: {
    recipes: [
      {
        slug: 'arepas-venezuelan-cornmeal-cheese',
        set: { image_path: 'recipes/arepas-venezuelan-cornmeal-cheese' },
      },
      {
        slug: 'baked-kale-chips-sea-salt',
        set: { image_path: 'recipes/baked-kale-chips-sea-salt' },
      },
      {
        slug: 'baked-salmon-dill-rice-spinach',
        set: { image_path: 'recipes/baked-salmon-dill-rice-spinach' },
      },
      {
        slug: 'banh-mi-op-la-vietnamese-eggs-pickled-carrot',
        set: { image_path: 'recipes/banh-mi-op-la-vietnamese-eggs-pickled-carrot' },
      },
      {
        slug: 'beef-bok-choy-ginger-stir-fry',
        set: { image_path: 'recipes/beef-bok-choy-ginger-stir-fry' },
      },
      {
        slug: 'beef-broccoli-ginger-stir-fry',
        set: { image_path: 'recipes/beef-broccoli-ginger-stir-fry' },
      },
      {
        slug: 'beef-burger-lettuce-wraps-tomato',
        set: { image_path: 'recipes/beef-burger-lettuce-wraps-tomato' },
      },
      {
        slug: 'beef-ginger-carrot-bone-broth-soup',
        set: { image_path: 'recipes/beef-ginger-carrot-bone-broth-soup' },
      },
      {
        slug: 'besan-chilla-chickpea-flour-pancakes',
        set: { image_path: 'recipes/besan-chilla-chickpea-flour-pancakes' },
      },
      {
        slug: 'bibimbap-korean-rice-bowl-vegetables-egg',
        set: { image_path: 'recipes/bibimbap-korean-rice-bowl-vegetables-egg' },
      },
      {
        slug: 'blueberry-maple-oat-porridge-pumpkin-seeds',
        set: { image_path: 'recipes/blueberry-maple-oat-porridge-pumpkin-seeds' },
      },
      {
        slug: 'borscht-ukrainian-beetroot-soup',
        set: { image_path: 'recipes/borscht-ukrainian-beetroot-soup' },
      },
      {
        slug: 'buckwheat-porridge-strawberries-flax',
        set: { image_path: 'recipes/buckwheat-porridge-strawberries-flax' },
      },
      {
        slug: 'bulgogi-beef-lettuce-wraps',
        set: { image_path: 'recipes/bulgogi-beef-lettuce-wraps' },
      },
      {
        slug: 'carnivore-beef-heart-skewers',
        set: { image_path: 'recipes/carnivore-beef-heart-skewers' },
      },
      {
        slug: 'carnivore-beef-kidney-butter',
        set: { image_path: 'recipes/carnivore-beef-kidney-butter' },
      },
      {
        slug: 'carnivore-beef-patties-fried-egg',
        set: { image_path: 'recipes/carnivore-beef-patties-fried-egg' },
      },
      {
        slug: 'carnivore-boiled-beef-tongue',
        set: { image_path: 'recipes/carnivore-boiled-beef-tongue' },
      },
      {
        slug: 'carnivore-cheddar-ham-omelette',
        set: { image_path: 'recipes/carnivore-cheddar-ham-omelette' },
      },
      {
        slug: 'carnivore-chicken-liver-pate',
        set: { image_path: 'recipes/carnivore-chicken-liver-pate' },
      },
      {
        slug: 'carnivore-crispy-chicken-thighs-ghee',
        set: { image_path: 'recipes/carnivore-crispy-chicken-thighs-ghee' },
      },
      {
        slug: 'carnivore-egg-bacon-muffin-cups',
        set: { image_path: 'recipes/carnivore-egg-bacon-muffin-cups' },
      },
      {
        slug: 'carnivore-lamb-burgers-feta',
        set: { image_path: 'recipes/carnivore-lamb-burgers-feta' },
      },
      {
        slug: 'carnivore-lamb-chops-tallow-sear',
        set: { image_path: 'recipes/carnivore-lamb-chops-tallow-sear' },
      },
      {
        slug: 'carnivore-oven-beef-jerky',
        set: { image_path: 'recipes/carnivore-oven-beef-jerky' },
      },
      { slug: 'carnivore-oven-pork-ribs', set: { image_path: 'recipes/carnivore-oven-pork-ribs' } },
      {
        slug: 'carnivore-pan-fried-halloumi-bites',
        set: { image_path: 'recipes/carnivore-pan-fried-halloumi-bites' },
      },
      {
        slug: 'carnivore-pulled-pork-shoulder',
        set: { image_path: 'recipes/carnivore-pulled-pork-shoulder' },
      },
      {
        slug: 'carnivore-reverse-seared-ribeye',
        set: { image_path: 'recipes/carnivore-reverse-seared-ribeye' },
      },
      {
        slug: 'carnivore-roast-duck-legs-crispy-skin',
        set: { image_path: 'recipes/carnivore-roast-duck-legs-crispy-skin' },
      },
      {
        slug: 'carnivore-seared-scallops-butter',
        set: { image_path: 'recipes/carnivore-seared-scallops-butter' },
      },
      {
        slug: 'carnivore-shrimp-butter-skillet',
        set: { image_path: 'recipes/carnivore-shrimp-butter-skillet' },
      },
      {
        slug: 'carnivore-steak-roasted-bone-marrow',
        set: { image_path: 'recipes/carnivore-steak-roasted-bone-marrow' },
      },
      {
        slug: 'ceviche-peruvian-sea-bass-lime',
        set: { image_path: 'recipes/ceviche-peruvian-sea-bass-lime' },
      },
      {
        slug: 'chakchouka-tunisian-eggs-peppers',
        set: { image_path: 'recipes/chakchouka-tunisian-eggs-peppers' },
      },
      {
        slug: 'chana-chaat-indian-chickpea-salad',
        set: { image_path: 'recipes/chana-chaat-indian-chickpea-salad' },
      },
      {
        slug: 'chicken-paprikash-hungarian',
        set: { image_path: 'recipes/chicken-paprikash-hungarian' },
      },
      {
        slug: 'chicken-potato-spinach-skillet-hash',
        set: { image_path: 'recipes/chicken-potato-spinach-skillet-hash' },
      },
      {
        slug: 'chicken-tagine-apricots-almonds',
        set: { image_path: 'recipes/chicken-tagine-apricots-almonds' },
      },
      {
        slug: 'cilbir-turkish-poached-eggs-garlic-yoghurt',
        set: { image_path: 'recipes/cilbir-turkish-poached-eggs-garlic-yoghurt' },
      },
      {
        slug: 'coconut-flour-pancakes-butter',
        set: { image_path: 'recipes/coconut-flour-pancakes-butter' },
      },
      {
        slug: 'congee-chicken-ginger-spring-onion',
        set: { image_path: 'recipes/congee-chicken-ginger-spring-onion' },
      },
      {
        slug: 'draniki-belarusian-potato-pancakes',
        set: { image_path: 'recipes/draniki-belarusian-potato-pancakes' },
      },
      {
        slug: 'edamame-lime-chilli-flakes',
        set: { image_path: 'recipes/edamame-lime-chilli-flakes' },
      },
      {
        slug: 'egg-fried-rice-carrots-green-beans',
        set: { image_path: 'recipes/egg-fried-rice-carrots-green-beans' },
      },
      { slug: 'egg-salad-cucumber-boats', set: { image_path: 'recipes/egg-salad-cucumber-boats' } },
      {
        slug: 'esquites-mexican-street-corn-cup',
        set: { image_path: 'recipes/esquites-mexican-street-corn-cup' },
      },
      {
        slug: 'ezme-turkish-spicy-tomato-pepper-salad',
        set: { image_path: 'recipes/ezme-turkish-spicy-tomato-pepper-salad' },
      },
      {
        slug: 'falafel-baked-herb-chickpea-patties',
        set: { image_path: 'recipes/falafel-baked-herb-chickpea-patties' },
      },
      {
        slug: 'fattoush-levantine-bread-salad',
        set: { image_path: 'recipes/fattoush-levantine-bread-salad' },
      },
      {
        slug: 'foul-medames-egyptian-fava-beans',
        set: { image_path: 'recipes/foul-medames-egyptian-fava-beans' },
      },
      {
        slug: 'gallo-pinto-costa-rican-rice-beans-egg',
        set: { image_path: 'recipes/gallo-pinto-costa-rican-rice-beans-egg' },
      },
      { slug: 'gimbap-korean-rice-rolls', set: { image_path: 'recipes/gimbap-korean-rice-rolls' } },
      { slug: 'ginger-egg-rice-congee', set: { image_path: 'recipes/ginger-egg-rice-congee' } },
      {
        slug: 'goi-cuon-vietnamese-shrimp-rice-paper-rolls',
        set: { image_path: 'recipes/goi-cuon-vietnamese-shrimp-rice-paper-rolls' },
      },
      {
        slug: 'guacamole-classic-mexican',
        set: { image_path: 'recipes/guacamole-classic-mexican' },
      },
      {
        slug: 'gyeran-jjim-korean-steamed-egg',
        set: { image_path: 'recipes/gyeran-jjim-korean-steamed-egg' },
      },
      {
        slug: 'harira-moroccan-lentil-chickpea-soup',
        set: { image_path: 'recipes/harira-moroccan-lentil-chickpea-soup' },
      },
      {
        slug: 'herb-cod-mash-green-beans',
        set: { image_path: 'recipes/herb-cod-mash-green-beans' },
      },
      {
        slug: 'herb-omelette-cheddar-tomato',
        set: { image_path: 'recipes/herb-omelette-cheddar-tomato' },
      },
      {
        slug: 'hiyayakko-chilled-tofu-ginger',
        set: { image_path: 'recipes/hiyayakko-chilled-tofu-ginger' },
      },
      {
        slug: 'huevos-rancheros-mexican-eggs-black-beans',
        set: { image_path: 'recipes/huevos-rancheros-mexican-eggs-black-beans' },
      },
      {
        slug: 'khai-jiao-thai-omelette-rice',
        set: { image_path: 'recipes/khai-jiao-thai-omelette-rice' },
      },
      {
        slug: 'kimchi-fried-rice-fried-egg',
        set: { image_path: 'recipes/kimchi-fried-rice-fried-egg' },
      },
      {
        slug: 'labneh-zaatar-olive-oil-plate',
        set: { image_path: 'recipes/labneh-zaatar-olive-oil-plate' },
      },
      {
        slug: 'lamb-kofta-cucumber-tomato-salad',
        set: { image_path: 'recipes/lamb-kofta-cucumber-tomato-salad' },
      },
      {
        slug: 'larb-gai-thai-chicken-lettuce-cups',
        set: { image_path: 'recipes/larb-gai-thai-chicken-lettuce-cups' },
      },
      {
        slug: 'lemon-oregano-chicken-skewers-greek-salad',
        set: { image_path: 'recipes/lemon-oregano-chicken-skewers-greek-salad' },
      },
      {
        slug: 'lemon-oregano-roast-lamb-potatoes',
        set: { image_path: 'recipes/lemon-oregano-roast-lamb-potatoes' },
      },
      {
        slug: 'lohikeitto-finnish-salmon-soup',
        set: { image_path: 'recipes/lohikeitto-finnish-salmon-soup' },
      },
      {
        slug: 'mango-lassi-yoghurt-drink',
        set: { image_path: 'recipes/mango-lassi-yoghurt-drink' },
      },
      { slug: 'mapo-tofu-sichuan-style', set: { image_path: 'recipes/mapo-tofu-sichuan-style' } },
      {
        slug: 'masala-oats-savoury-indian-porridge',
        set: { image_path: 'recipes/masala-oats-savoury-indian-porridge' },
      },
      {
        slug: 'masala-omelette-indian-spiced',
        set: { image_path: 'recipes/masala-omelette-indian-spiced' },
      },
      {
        slug: 'mercimek-corbasi-turkish-red-lentil-soup',
        set: { image_path: 'recipes/mercimek-corbasi-turkish-red-lentil-soup' },
      },
      {
        slug: 'misir-wat-ethiopian-red-lentil-stew',
        set: { image_path: 'recipes/misir-wat-ethiopian-red-lentil-stew' },
      },
      { slug: 'miso-soup-tofu-spinach', set: { image_path: 'recipes/miso-soup-tofu-spinach' } },
      {
        slug: 'mizeria-polish-cucumber-salad',
        set: { image_path: 'recipes/mizeria-polish-cucumber-salad' },
      },
      {
        slug: 'moroccan-carrot-salad-cumin-orange',
        set: { image_path: 'recipes/moroccan-carrot-salad-cumin-orange' },
      },
      {
        slug: 'muhammara-roasted-pepper-walnut-dip',
        set: { image_path: 'recipes/muhammara-roasted-pepper-walnut-dip' },
      },
      {
        slug: 'nasu-dengaku-miso-glazed-aubergine',
        set: { image_path: 'recipes/nasu-dengaku-miso-glazed-aubergine' },
      },
      {
        slug: 'okayu-japanese-rice-porridge-egg',
        set: { image_path: 'recipes/okayu-japanese-rice-porridge-egg' },
      },
      { slug: 'onigiri-salmon-nori', set: { image_path: 'recipes/onigiri-salmon-nori' } },
      {
        slug: 'oven-trout-green-beans-new-potatoes',
        set: { image_path: 'recipes/oven-trout-green-beans-new-potatoes' },
      },
      {
        slug: 'paneer-tikka-skewers-yoghurt-marinade',
        set: { image_path: 'recipes/paneer-tikka-skewers-yoghurt-marinade' },
      },
      {
        slug: 'patacones-green-plantain-lime',
        set: { image_path: 'recipes/patacones-green-plantain-lime' },
      },
      {
        slug: 'pho-ga-vietnamese-chicken-noodle-soup',
        set: { image_path: 'recipes/pho-ga-vietnamese-chicken-noodle-soup' },
      },
      {
        slug: 'polenta-parmesan-soft-egg-bowl',
        set: { image_path: 'recipes/polenta-parmesan-soft-egg-bowl' },
      },
      {
        slug: 'pork-ginger-lettuce-wraps',
        set: { image_path: 'recipes/pork-ginger-lettuce-wraps' },
      },
      {
        slug: 'pork-meatballs-tomato-basil-potatoes',
        set: { image_path: 'recipes/pork-meatballs-tomato-basil-potatoes' },
      },
      {
        slug: 'pork-sage-breakfast-patties',
        set: { image_path: 'recipes/pork-sage-breakfast-patties' },
      },
      {
        slug: 'potato-spinach-cheddar-egg-bake',
        set: { image_path: 'recipes/potato-spinach-cheddar-egg-bake' },
      },
      {
        slug: 'quinoa-cucumber-tomato-feta-olive-bowl',
        set: { image_path: 'recipes/quinoa-cucumber-tomato-feta-olive-bowl' },
      },
      {
        slug: 'rice-noodle-chicken-bok-choy-stir-fry',
        set: { image_path: 'recipes/rice-noodle-chicken-bok-choy-stir-fry' },
      },
      {
        slug: 'rosemary-lamb-stew-carrots-potatoes',
        set: { image_path: 'recipes/rosemary-lamb-stew-carrots-potatoes' },
      },
      {
        slug: 'rosemary-pork-chops-roast-potatoes-green-beans',
        set: { image_path: 'recipes/rosemary-pork-chops-roast-potatoes-green-beans' },
      },
      {
        slug: 'rosemary-pumpkin-seed-walnut-mix',
        set: { image_path: 'recipes/rosemary-pumpkin-seed-walnut-mix' },
      },
      {
        slug: 'sardine-cucumber-lemon-bites',
        set: { image_path: 'recipes/sardine-cucumber-lemon-bites' },
      },
      {
        slug: 'scallion-pancakes-cong-you-bing',
        set: { image_path: 'recipes/scallion-pancakes-cong-you-bing' },
      },
      {
        slug: 'sesame-crusted-tuna-steak-cucumber-salad',
        set: { image_path: 'recipes/sesame-crusted-tuna-steak-cucumber-salad' },
      },
      {
        slug: 'shish-taouk-lemon-garlic-chicken-skewers',
        set: { image_path: 'recipes/shish-taouk-lemon-garlic-chicken-skewers' },
      },
      {
        slug: 'shrimp-ginger-egg-fried-rice',
        set: { image_path: 'recipes/shrimp-ginger-egg-fried-rice' },
      },
      {
        slug: 'smoked-salmon-egg-scramble-chives',
        set: { image_path: 'recipes/smoked-salmon-egg-scramble-chives' },
      },
      {
        slug: 'smorrebrod-rye-egg-radish-dill',
        set: { image_path: 'recipes/smorrebrod-rye-egg-radish-dill' },
      },
      {
        slug: 'strawberry-kiwi-pumpkin-seed-cups',
        set: { image_path: 'recipes/strawberry-kiwi-pumpkin-seed-cups' },
      },
      {
        slug: 'syrniki-russian-cottage-cheese-pancakes',
        set: { image_path: 'recipes/syrniki-russian-cottage-cheese-pancakes' },
      },
      {
        slug: 'tamagoyaki-japanese-rolled-omelette',
        set: { image_path: 'recipes/tamagoyaki-japanese-rolled-omelette' },
      },
      { slug: 'tea-eggs-chinese-marbled', set: { image_path: 'recipes/tea-eggs-chinese-marbled' } },
      {
        slug: 'teff-porridge-ethiopian-banana-cinnamon',
        set: { image_path: 'recipes/teff-porridge-ethiopian-banana-cinnamon' },
      },
      {
        slug: 'tofu-peanut-ginger-rice-bowl',
        set: { image_path: 'recipes/tofu-peanut-ginger-rice-bowl' },
      },
      {
        slug: 'tom-kha-gai-thai-coconut-chicken-soup',
        set: { image_path: 'recipes/tom-kha-gai-thai-coconut-chicken-soup' },
      },
      {
        slug: 'tomato-egg-stir-fry-chinese',
        set: { image_path: 'recipes/tomato-egg-stir-fry-chinese' },
      },
      {
        slug: 'tomato-spinach-baked-frittata',
        set: { image_path: 'recipes/tomato-spinach-baked-frittata' },
      },
      {
        slug: 'tuna-cheddar-stuffed-baked-potatoes',
        set: { image_path: 'recipes/tuna-cheddar-stuffed-baked-potatoes' },
      },
      {
        slug: 'tuna-cucumber-olive-bites',
        set: { image_path: 'recipes/tuna-cucumber-olive-bites' },
      },
      {
        slug: 'turkey-burgers-potato-wedges',
        set: { image_path: 'recipes/turkey-burgers-potato-wedges' },
      },
      {
        slug: 'turkey-egg-cucumber-roll-ups',
        set: { image_path: 'recipes/turkey-egg-cucumber-roll-ups' },
      },
      {
        slug: 'turkey-meatballs-tomato-basil-polenta',
        set: { image_path: 'recipes/turkey-meatballs-tomato-basil-polenta' },
      },
      {
        slug: 'vinegret-russian-beetroot-potato-salad',
        set: { image_path: 'recipes/vinegret-russian-beetroot-potato-salad' },
      },
      {
        slug: 'zaalouk-moroccan-aubergine-tomato-salad',
        set: { image_path: 'recipes/zaalouk-moroccan-aubergine-tomato-salad' },
      },
    ],
  },
}
