// OVERLAY 0005 — recipe photos (2026-10-06). Sets `image_path` = `recipes/<slug>` for
// every recipe with an accepted photo: ComfyUI renders (RealVisXL V5, 1024×768), vision-QA’d with
// qwen2.5vl:7b and reviewed by eye, served as public/recipes/<slug>-480.webp and -960.webp (the UI
// appends the width — src/recipes/photo.ts). Authored by `node scripts/recipe-photos.mjs --overlay`.

import type { Overlay } from './types.ts'

export const OVERLAY: Overlay = {
  id: '0005-recipe-photos',
  summary: 'photos for 182 recipes (image_path = recipes/<slug>)',
  patches: {
    recipes: [
      {
        slug: 'aginares-a-la-polita-artichoke-stew',
        set: { image_path: 'recipes/aginares-a-la-polita-artichoke-stew' },
      },
      {
        slug: 'almond-buckwheat-banana-bread',
        set: { image_path: 'recipes/almond-buckwheat-banana-bread' },
      },
      { slug: 'almond-milk-rice-pudding', set: { image_path: 'recipes/almond-milk-rice-pudding' } },
      {
        slug: 'apple-almond-butter-cinnamon',
        set: { image_path: 'recipes/apple-almond-butter-cinnamon' },
      },
      { slug: 'arakas-latheros-pea-stew', set: { image_path: 'recipes/arakas-latheros-pea-stew' } },
      {
        slug: 'avocado-toast-whole-wheat',
        set: { image_path: 'recipes/avocado-toast-whole-wheat' },
      },
      {
        slug: 'bakaliaros-tiganitos-fried-salt-cod',
        set: { image_path: 'recipes/bakaliaros-tiganitos-fried-salt-cod' },
      },
      {
        slug: 'baked-egg-casserole-zucchini-spinach',
        set: { image_path: 'recipes/baked-egg-casserole-zucchini-spinach' },
      },
      {
        slug: 'baked-polenta-tomato-mozzarella',
        set: { image_path: 'recipes/baked-polenta-tomato-mozzarella' },
      },
      {
        slug: 'baked-sea-bream-lemon-potatoes',
        set: { image_path: 'recipes/baked-sea-bream-lemon-potatoes' },
      },
      { slug: 'bamies-okra-tomato-stew', set: { image_path: 'recipes/bamies-okra-tomato-stew' } },
      { slug: 'banana-oat-pancakes', set: { image_path: 'recipes/banana-oat-pancakes' } },
      {
        slug: 'beef-vegetable-chili-no-beans',
        set: { image_path: 'recipes/beef-vegetable-chili-no-beans' },
      },
      {
        slug: 'beef-zucchini-ginger-stir-fry-rice',
        set: { image_path: 'recipes/beef-zucchini-ginger-stir-fry-rice' },
      },
      {
        slug: 'break-the-fast-egg-avocado-feta-plate',
        set: { image_path: 'recipes/break-the-fast-egg-avocado-feta-plate' },
      },
      {
        slug: 'briam-baked-summer-vegetables',
        set: { image_path: 'recipes/briam-baked-summer-vegetables' },
      },
      {
        slug: 'buckwheat-banana-pancakes',
        set: { image_path: 'recipes/buckwheat-banana-pancakes' },
      },
      {
        slug: 'buckwheat-beetroot-walnut-salad',
        set: { image_path: 'recipes/buckwheat-beetroot-walnut-salad' },
      },
      {
        slug: 'buckwheat-chia-seeded-bread',
        set: { image_path: 'recipes/buckwheat-chia-seeded-bread' },
      },
      { slug: 'carnivore-bacon-and-eggs', set: { image_path: 'recipes/carnivore-bacon-and-eggs' } },
      {
        slug: 'carnivore-beef-and-bone-broth-soup',
        set: { image_path: 'recipes/carnivore-beef-and-bone-broth-soup' },
      },
      {
        slug: 'carnivore-beef-liver-in-butter',
        set: { image_path: 'recipes/carnivore-beef-liver-in-butter' },
      },
      {
        slug: 'carnivore-beef-mince-cheese-skillet',
        set: { image_path: 'recipes/carnivore-beef-mince-cheese-skillet' },
      },
      {
        slug: 'carnivore-ghee-scrambled-eggs',
        set: { image_path: 'recipes/carnivore-ghee-scrambled-eggs' },
      },
      {
        slug: 'carnivore-salmon-in-brown-butter',
        set: { image_path: 'recipes/carnivore-salmon-in-brown-butter' },
      },
      {
        slug: 'carnivore-salt-crust-pork-belly',
        set: { image_path: 'recipes/carnivore-salt-crust-pork-belly' },
      },
      {
        slug: 'carnivore-salt-roast-chicken-wings',
        set: { image_path: 'recipes/carnivore-salt-roast-chicken-wings' },
      },
      {
        slug: 'carnivore-slow-roast-lamb-leg',
        set: { image_path: 'recipes/carnivore-slow-roast-lamb-leg' },
      },
      { slug: 'carnivore-steak-and-eggs', set: { image_path: 'recipes/carnivore-steak-and-eggs' } },
      { slug: 'carrot-ginger-rice-soup', set: { image_path: 'recipes/carrot-ginger-rice-soup' } },
      {
        slug: 'chia-pudding-coconut-strawberry',
        set: { image_path: 'recipes/chia-pudding-coconut-strawberry' },
      },
      {
        slug: 'chicken-avocado-orange-salad',
        set: { image_path: 'recipes/chicken-avocado-orange-salad' },
      },
      {
        slug: 'chicken-coconut-curry-rice',
        set: { image_path: 'recipes/chicken-coconut-curry-rice' },
      },
      {
        slug: 'chickpea-salad-lemon-parsley',
        set: { image_path: 'recipes/chickpea-salad-lemon-parsley' },
      },
      { slug: 'dakos-cretan-rusk-salad', set: { image_path: 'recipes/dakos-cretan-rusk-salad' } },
      { slug: 'date-oat-energy-balls', set: { image_path: 'recipes/date-oat-energy-balls' } },
      {
        slug: 'date-walnut-cocoa-energy-balls',
        set: { image_path: 'recipes/date-walnut-cocoa-energy-balls' },
      },
      {
        slug: 'dolmadakia-yalantzi-stuffed-vine-leaves',
        set: { image_path: 'recipes/dolmadakia-yalantzi-stuffed-vine-leaves' },
      },
      {
        slug: 'domatokeftedes-santorini-tomato-fritters',
        set: { image_path: 'recipes/domatokeftedes-santorini-tomato-fritters' },
      },
      { slug: 'fakes-lentil-soup', set: { image_path: 'recipes/fakes-lentil-soup' } },
      {
        slug: 'fakorizo-lentils-with-rice',
        set: { image_path: 'recipes/fakorizo-lentils-with-rice' },
      },
      { slug: 'fasolada-white-bean-soup', set: { image_path: 'recipes/fasolada-white-bean-soup' } },
      {
        slug: 'fasolakia-ladera-green-bean-stew',
        set: { image_path: 'recipes/fasolakia-ladera-green-bean-stew' },
      },
      {
        slug: 'fava-santorini-yellow-split-pea-puree',
        set: { image_path: 'recipes/fava-santorini-yellow-split-pea-puree' },
      },
      {
        slug: 'fish-taco-bowls-cabbage-slaw',
        set: { image_path: 'recipes/fish-taco-bowls-cabbage-slaw' },
      },
      {
        slug: 'fruit-salad-coconut-walnuts',
        set: { image_path: 'recipes/fruit-salad-coconut-walnuts' },
      },
      {
        slug: 'gemista-stuffed-tomatoes-peppers',
        set: { image_path: 'recipes/gemista-stuffed-tomatoes-peppers' },
      },
      {
        slug: 'gigantes-plaki-baked-giant-beans',
        set: { image_path: 'recipes/gigantes-plaki-baked-giant-beans' },
      },
      {
        slug: 'giouvarlakia-avgolemono-meatball-soup',
        set: { image_path: 'recipes/giouvarlakia-avgolemono-meatball-soup' },
      },
      { slug: 'giouvetsi-beef-orzo', set: { image_path: 'recipes/giouvetsi-beef-orzo' } },
      {
        slug: 'greek-yoghurt-honey-walnuts-figs',
        set: { image_path: 'recipes/greek-yoghurt-honey-walnuts-figs' },
      },
      {
        slug: 'green-smoothie-spinach-banana',
        set: { image_path: 'recipes/green-smoothie-spinach-banana' },
      },
      {
        slug: 'grilled-mackerel-horta-lemon',
        set: { image_path: 'recipes/grilled-mackerel-horta-lemon' },
      },
      {
        slug: 'grilled-sardines-lemon-oregano',
        set: { image_path: 'recipes/grilled-sardines-lemon-oregano' },
      },
      {
        slug: 'halloumi-grilled-vegetable-salad',
        set: { image_path: 'recipes/halloumi-grilled-vegetable-salad' },
      },
      {
        slug: 'halvas-simigdalenios-semolina-halva',
        set: { image_path: 'recipes/halvas-simigdalenios-semolina-halva' },
      },
      {
        slug: 'high-protein-baked-cod-cherry-tomatoes-capers',
        set: { image_path: 'recipes/high-protein-baked-cod-cherry-tomatoes-capers' },
      },
      {
        slug: 'high-protein-cottage-cheese-egg-scramble',
        set: { image_path: 'recipes/high-protein-cottage-cheese-egg-scramble' },
      },
      {
        slug: 'high-protein-egg-white-turkey-omelette',
        set: { image_path: 'recipes/high-protein-egg-white-turkey-omelette' },
      },
      {
        slug: 'high-protein-grilled-chicken-breast-broccoli',
        set: { image_path: 'recipes/high-protein-grilled-chicken-breast-broccoli' },
      },
      {
        slug: 'high-protein-skyr-berry-walnut-bowl',
        set: { image_path: 'recipes/high-protein-skyr-berry-walnut-bowl' },
      },
      {
        slug: 'high-protein-turkey-steak-green-beans',
        set: { image_path: 'recipes/high-protein-turkey-steak-green-beans' },
      },
      {
        slug: 'high-protein-whey-coffee-shake',
        set: { image_path: 'recipes/high-protein-whey-coffee-shake' },
      },
      {
        slug: 'horiatiki-greek-village-salad',
        set: { image_path: 'recipes/horiatiki-greek-village-salad' },
      },
      {
        slug: 'horta-vrasta-boiled-greens',
        set: { image_path: 'recipes/horta-vrasta-boiled-greens' },
      },
      {
        slug: 'hortopita-lenten-wild-greens-pie',
        set: { image_path: 'recipes/hortopita-lenten-wild-greens-pie' },
      },
      {
        slug: 'htapodi-kritharaki-octopus-orzo',
        set: { image_path: 'recipes/htapodi-kritharaki-octopus-orzo' },
      },
      { slug: 'hummus-homemade', set: { image_path: 'recipes/hummus-homemade' } },
      {
        slug: 'imam-bayildi-stuffed-eggplant',
        set: { image_path: 'recipes/imam-bayildi-stuffed-eggplant' },
      },
      { slug: 'kakavia-fishermans-soup', set: { image_path: 'recipes/kakavia-fishermans-soup' } },
      {
        slug: 'kalamarakia-stifado-squid-pearl-onions',
        set: { image_path: 'recipes/kalamarakia-stifado-squid-pearl-onions' },
      },
      {
        slug: 'keto-avocado-egg-feta-bowl',
        set: { image_path: 'recipes/keto-avocado-egg-feta-bowl' },
      },
      {
        slug: 'keto-bacon-wrapped-stuffed-chicken-thighs',
        set: { image_path: 'recipes/keto-bacon-wrapped-stuffed-chicken-thighs' },
      },
      { slug: 'keto-baked-cheese-crisps', set: { image_path: 'recipes/keto-baked-cheese-crisps' } },
      {
        slug: 'keto-beef-taco-lettuce-wraps',
        set: { image_path: 'recipes/keto-beef-taco-lettuce-wraps' },
      },
      { slug: 'keto-bulletproof-coffee', set: { image_path: 'recipes/keto-bulletproof-coffee' } },
      {
        slug: 'keto-cauliflower-cheese-bake',
        set: { image_path: 'recipes/keto-cauliflower-cheese-bake' },
      },
      {
        slug: 'keto-chicken-cauliflower-rice-bowl',
        set: { image_path: 'recipes/keto-chicken-cauliflower-rice-bowl' },
      },
      {
        slug: 'keto-chicken-liver-mushrooms-thyme',
        set: { image_path: 'recipes/keto-chicken-liver-mushrooms-thyme' },
      },
      {
        slug: 'keto-chocolate-almond-fat-bombs',
        set: { image_path: 'recipes/keto-chocolate-almond-fat-bombs' },
      },
      { slug: 'keto-cobb-salad', set: { image_path: 'recipes/keto-cobb-salad' } },
      {
        slug: 'keto-cream-cheese-pancakes',
        set: { image_path: 'recipes/keto-cream-cheese-pancakes' },
      },
      { slug: 'keto-deviled-eggs', set: { image_path: 'recipes/keto-deviled-eggs' } },
      {
        slug: 'keto-egg-salad-lettuce-wraps',
        set: { image_path: 'recipes/keto-egg-salad-lettuce-wraps' },
      },
      {
        slug: 'keto-garlic-butter-shrimp-zoodles',
        set: { image_path: 'recipes/keto-garlic-butter-shrimp-zoodles' },
      },
      {
        slug: 'keto-grilled-halloumi-rocket-walnut-salad',
        set: { image_path: 'recipes/keto-grilled-halloumi-rocket-walnut-salad' },
      },
      {
        slug: 'keto-grilled-steak-herb-butter',
        set: { image_path: 'recipes/keto-grilled-steak-herb-butter' },
      },
      {
        slug: 'keto-meatza-mince-crust-pizza',
        set: { image_path: 'recipes/keto-meatza-mince-crust-pizza' },
      },
      {
        slug: 'keto-pork-chops-mustard-cream-sauce',
        set: { image_path: 'recipes/keto-pork-chops-mustard-cream-sauce' },
      },
      {
        slug: 'keto-smoked-salmon-egg-avocado-plate',
        set: { image_path: 'recipes/keto-smoked-salmon-egg-avocado-plate' },
      },
      {
        slug: 'keto-spinach-feta-omelette',
        set: { image_path: 'recipes/keto-spinach-feta-omelette' },
      },
      { slug: 'keto-tuna-avocado-salad', set: { image_path: 'recipes/keto-tuna-avocado-salad' } },
      {
        slug: 'keto-zucchini-noodle-bolognese',
        set: { image_path: 'recipes/keto-zucchini-noodle-bolognese' },
      },
      {
        slug: 'kolokithokeftedes-zucchini-fritters',
        set: { image_path: 'recipes/kolokithokeftedes-zucchini-fritters' },
      },
      { slug: 'kotosoupa-avgolemono', set: { image_path: 'recipes/kotosoupa-avgolemono' } },
      {
        slug: 'lagana-clean-monday-flatbread',
        set: { image_path: 'recipes/lagana-clean-monday-flatbread' },
      },
      { slug: 'lahanorizo-cabbage-rice', set: { image_path: 'recipes/lahanorizo-cabbage-rice' } },
      { slug: 'lemon-chicken-rice-bowl', set: { image_path: 'recipes/lemon-chicken-rice-bowl' } },
      {
        slug: 'lentil-bolognese-whole-wheat-pasta',
        set: { image_path: 'recipes/lentil-bolognese-whole-wheat-pasta' },
      },
      {
        slug: 'lentil-pasta-tomato-spinach-feta',
        set: { image_path: 'recipes/lentil-pasta-tomato-spinach-feta' },
      },
      {
        slug: 'lentil-salad-roasted-beetroot-walnuts',
        set: { image_path: 'recipes/lentil-salad-roasted-beetroot-walnuts' },
      },
      {
        slug: 'low-carb-cauliflower-fried-rice-chicken-egg',
        set: { image_path: 'recipes/low-carb-cauliflower-fried-rice-chicken-egg' },
      },
      {
        slug: 'low-carb-chicken-caesar-no-croutons',
        set: { image_path: 'recipes/low-carb-chicken-caesar-no-croutons' },
      },
      {
        slug: 'low-carb-eggplant-mince-graviera-bake',
        set: { image_path: 'recipes/low-carb-eggplant-mince-graviera-bake' },
      },
      {
        slug: 'low-carb-smoked-salmon-egg-muffins',
        set: { image_path: 'recipes/low-carb-smoked-salmon-egg-muffins' },
      },
      {
        slug: 'low-carb-zucchini-feta-almond-fritters',
        set: { image_path: 'recipes/low-carb-zucchini-feta-almond-fritters' },
      },
      {
        slug: 'mavromatika-black-eyed-pea-salad',
        set: { image_path: 'recipes/mavromatika-black-eyed-pea-salad' },
      },
      {
        slug: 'melitzanosalata-smoky-aubergine-dip',
        set: { image_path: 'recipes/melitzanosalata-smoky-aubergine-dip' },
      },
      {
        slug: 'moschari-stifado-beef-pearl-onions',
        set: { image_path: 'recipes/moschari-stifado-beef-pearl-onions' },
      },
      {
        slug: 'moussakas-aubergine-mince-bechamel',
        set: { image_path: 'recipes/moussakas-aubergine-mince-bechamel' },
      },
      {
        slug: 'mushroom-spinach-omelette',
        set: { image_path: 'recipes/mushroom-spinach-omelette' },
      },
      {
        slug: 'mydia-achnista-steamed-mussels',
        set: { image_path: 'recipes/mydia-achnista-steamed-mussels' },
      },
      { slug: 'mydopilafo-mussel-rice', set: { image_path: 'recipes/mydopilafo-mussel-rice' } },
      {
        slug: 'oat-porridge-banana-walnuts',
        set: { image_path: 'recipes/oat-porridge-banana-walnuts' },
      },
      {
        slug: 'octopus-xydato-vinegar-oregano',
        set: { image_path: 'recipes/octopus-xydato-vinegar-oregano' },
      },
      {
        slug: 'overnight-oats-apple-cinnamon',
        set: { image_path: 'recipes/overnight-oats-apple-cinnamon' },
      },
      {
        slug: 'overnight-oats-peanut-banana',
        set: { image_path: 'recipes/overnight-oats-peanut-banana' },
      },
      {
        slug: 'paleo-almond-flaxseed-porridge',
        set: { image_path: 'recipes/paleo-almond-flaxseed-porridge' },
      },
      {
        slug: 'paleo-banana-egg-pancakes',
        set: { image_path: 'recipes/paleo-banana-egg-pancakes' },
      },
      {
        slug: 'paleo-beef-liver-and-onions',
        set: { image_path: 'recipes/paleo-beef-liver-and-onions' },
      },
      {
        slug: 'paleo-berry-coconut-smoothie',
        set: { image_path: 'recipes/paleo-berry-coconut-smoothie' },
      },
      {
        slug: 'paleo-chia-coconut-pudding',
        set: { image_path: 'recipes/paleo-chia-coconut-pudding' },
      },
      {
        slug: 'paleo-chicken-vegetable-soup-no-rice',
        set: { image_path: 'recipes/paleo-chicken-vegetable-soup-no-rice' },
      },
      {
        slug: 'paleo-egg-drop-bone-broth-soup',
        set: { image_path: 'recipes/paleo-egg-drop-bone-broth-soup' },
      },
      {
        slug: 'paleo-keftedes-without-breadcrumbs',
        set: { image_path: 'recipes/paleo-keftedes-without-breadcrumbs' },
      },
      {
        slug: 'paleo-lamb-chops-rosemary-garlic',
        set: { image_path: 'recipes/paleo-lamb-chops-rosemary-garlic' },
      },
      {
        slug: 'paleo-lemon-garlic-roast-chicken-thighs',
        set: { image_path: 'recipes/paleo-lemon-garlic-roast-chicken-thighs' },
      },
      {
        slug: 'paleo-lemon-oregano-roast-goat',
        set: { image_path: 'recipes/paleo-lemon-oregano-roast-goat' },
      },
      {
        slug: 'paleo-mushroom-spinach-frittata',
        set: { image_path: 'recipes/paleo-mushroom-spinach-frittata' },
      },
      {
        slug: 'paleo-pork-souvlaki-skewers-no-pita',
        set: { image_path: 'recipes/paleo-pork-souvlaki-skewers-no-pita' },
      },
      {
        slug: 'paleo-salmon-with-asparagus',
        set: { image_path: 'recipes/paleo-salmon-with-asparagus' },
      },
      {
        slug: 'paleo-stuffed-peppers-mince-cauliflower-rice',
        set: { image_path: 'recipes/paleo-stuffed-peppers-mince-cauliflower-rice' },
      },
      {
        slug: 'paleo-sweet-potato-hash-with-eggs',
        set: { image_path: 'recipes/paleo-sweet-potato-hash-with-eggs' },
      },
      {
        slug: 'paleo-tuna-steak-avocado-salsa',
        set: { image_path: 'recipes/paleo-tuna-steak-avocado-salsa' },
      },
      {
        slug: 'pantzarosalata-beetroot-garlic-walnuts',
        set: { image_path: 'recipes/pantzarosalata-beetroot-garlic-walnuts' },
      },
      {
        slug: 'pastitsio-baked-pasta-mince-bechamel',
        set: { image_path: 'recipes/pastitsio-baked-pasta-mince-bechamel' },
      },
      {
        slug: 'patates-lemonates-lemon-oregano-potatoes',
        set: { image_path: 'recipes/patates-lemonates-lemon-oregano-potatoes' },
      },
      { slug: 'polenta-mushroom-ragout', set: { image_path: 'recipes/polenta-mushroom-ragout' } },
      {
        slug: 'pork-tenderloin-roasted-carrots-potatoes',
        set: { image_path: 'recipes/pork-tenderloin-roasted-carrots-potatoes' },
      },
      {
        slug: 'prasorizo-leeks-with-rice',
        set: { image_path: 'recipes/prasorizo-leeks-with-rice' },
      },
      {
        slug: 'psari-plaki-baked-cod-tomato-onion',
        set: { image_path: 'recipes/psari-plaki-baked-cod-tomato-onion' },
      },
      { slug: 'pumpkin-red-lentil-soup', set: { image_path: 'recipes/pumpkin-red-lentil-soup' } },
      { slug: 'pumpkin-sage-risotto', set: { image_path: 'recipes/pumpkin-sage-risotto' } },
      {
        slug: 'quinoa-black-bean-sweet-potato-bowl',
        set: { image_path: 'recipes/quinoa-black-bean-sweet-potato-bowl' },
      },
      {
        slug: 'quinoa-porridge-orange-walnuts',
        set: { image_path: 'recipes/quinoa-porridge-orange-walnuts' },
      },
      {
        slug: 'quinoa-roasted-vegetable-feta-bowl',
        set: { image_path: 'recipes/quinoa-roasted-vegetable-feta-bowl' },
      },
      { slug: 'quinoa-tabbouleh', set: { image_path: 'recipes/quinoa-tabbouleh' } },
      {
        slug: 'revithada-sifnos-baked-chickpeas',
        set: { image_path: 'recipes/revithada-sifnos-baked-chickpeas' },
      },
      {
        slug: 'revithokeftedes-chickpea-fritters',
        set: { image_path: 'recipes/revithokeftedes-chickpea-fritters' },
      },
      {
        slug: 'rice-cakes-peanut-butter-banana',
        set: { image_path: 'recipes/rice-cakes-peanut-butter-banana' },
      },
      {
        slug: 'rice-cakes-smoked-salmon-egg',
        set: { image_path: 'recipes/rice-cakes-smoked-salmon-egg' },
      },
      {
        slug: 'rice-noodle-tofu-peanut-salad',
        set: { image_path: 'recipes/rice-noodle-tofu-peanut-salad' },
      },
      {
        slug: 'roasted-cauliflower-tahini-pomegranate',
        set: { image_path: 'recipes/roasted-cauliflower-tahini-pomegranate' },
      },
      {
        slug: 'roasted-chickpeas-paprika-cumin',
        set: { image_path: 'recipes/roasted-chickpeas-paprika-cumin' },
      },
      {
        slug: 'salmon-quinoa-broccoli-bowl',
        set: { image_path: 'recipes/salmon-quinoa-broccoli-bowl' },
      },
      {
        slug: 'seasonal-fruit-salad-walnuts',
        set: { image_path: 'recipes/seasonal-fruit-salad-walnuts' },
      },
      {
        slug: 'sheet-pan-chicken-sweet-potato-broccoli',
        set: { image_path: 'recipes/sheet-pan-chicken-sweet-potato-broccoli' },
      },
      {
        slug: 'sheet-pan-salmon-asparagus-potatoes',
        set: { image_path: 'recipes/sheet-pan-salmon-asparagus-potatoes' },
      },
      { slug: 'shrimp-lemon-risotto', set: { image_path: 'recipes/shrimp-lemon-risotto' } },
      {
        slug: 'shrimp-saganaki-feta-ouzo',
        set: { image_path: 'recipes/shrimp-saganaki-feta-ouzo' },
      },
      {
        slug: 'skordalia-garlic-potato-dip',
        set: { image_path: 'recipes/skordalia-garlic-potato-dip' },
      },
      { slug: 'skyr-berry-oat-bowl', set: { image_path: 'recipes/skyr-berry-oat-bowl' } },
      {
        slug: 'skyr-bowl-kiwi-strawberry',
        set: { image_path: 'recipes/skyr-bowl-kiwi-strawberry' },
      },
      { slug: 'smoked-salmon-skyr-toast', set: { image_path: 'recipes/smoked-salmon-skyr-toast' } },
      {
        slug: 'socca-roasted-peppers-rocket',
        set: { image_path: 'recipes/socca-roasted-peppers-rocket' },
      },
      {
        slug: 'soupies-me-spanaki-cuttlefish-spinach',
        set: { image_path: 'recipes/soupies-me-spanaki-cuttlefish-spinach' },
      },
      { slug: 'soutzoukakia-smyrneika', set: { image_path: 'recipes/soutzoukakia-smyrneika' } },
      {
        slug: 'spaghetti-tomato-garlic-basil',
        set: { image_path: 'recipes/spaghetti-tomato-garlic-basil' },
      },
      {
        slug: 'spanakopita-spinach-feta-pie',
        set: { image_path: 'recipes/spanakopita-spinach-feta-pie' },
      },
      { slug: 'spanakorizo-spinach-rice', set: { image_path: 'recipes/spanakorizo-spinach-rice' } },
      {
        slug: 'strapatsada-tomato-scrambled-eggs',
        set: { image_path: 'recipes/strapatsada-tomato-scrambled-eggs' },
      },
      { slug: 'sweet-potato-hash-eggs', set: { image_path: 'recipes/sweet-potato-hash-eggs' } },
      { slug: 'tahini-petimezi-toast', set: { image_path: 'recipes/tahini-petimezi-toast' } },
      {
        slug: 'tahinosoupa-lenten-tahini-soup',
        set: { image_path: 'recipes/tahinosoupa-lenten-tahini-soup' },
      },
      {
        slug: 'taramosalata-fish-roe-dip',
        set: { image_path: 'recipes/taramosalata-fish-roe-dip' },
      },
      {
        slug: 'tofu-scramble-turmeric-peppers',
        set: { image_path: 'recipes/tofu-scramble-turmeric-peppers' },
      },
      {
        slug: 'tofu-souvlaki-skewers-pita',
        set: { image_path: 'recipes/tofu-souvlaki-skewers-pita' },
      },
      { slug: 'trahana-soup-feta', set: { image_path: 'recipes/trahana-soup-feta' } },
      {
        slug: 'tuna-potato-green-bean-salad',
        set: { image_path: 'recipes/tuna-potato-green-bean-salad' },
      },
      { slug: 'tuna-white-bean-salad', set: { image_path: 'recipes/tuna-white-bean-salad' } },
      {
        slug: 'turkey-spinach-breakfast-patties',
        set: { image_path: 'recipes/turkey-spinach-breakfast-patties' },
      },
      { slug: 'tzatziki', set: { image_path: 'recipes/tzatziki' } },
    ],
  },
}
