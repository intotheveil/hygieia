// OVERLAY 0004 — Greek retail prices 2026-10 and EU-sourced nutrition for Greek products (2026-10-06).
// One patch per ingredient (all 322). Generated from a scrape of the two chains' online shelves on
// 2026-10-06; the method is recorded here so the next quarterly refresh can repeat it.
//
// PRICES
//   * Source: the online shelves of Sklavenitis (sklavenitis.gr) and My market (mymarket.gr), whose
//     search pages state a per-kg / per-litre / per-piece price for every product. The government
//     observatory (e-katanalotis.gov.gr, now posokanei.gov.gr) is the intended primary source but
//     answered 403 to every scripted request on 2026-10-06; AB Vassilopoulos and Masoutis render
//     prices client-side only. Both are named in DECISIONS.md for the next refresh.
//   * Scope: every ingredient used by two or more recipes, plus the Greek products of this overlay.
//     For each, the matching conventional (non-organic, unless only organic is stocked) products of
//     both chains were collected and reviewed by hand; ready meals, snacks, sauces and pet food that
//     merely name the ingredient were excluded. Range = 10th–90th percentile of the per-unit prices
//     when ≥ 5 products match, otherwise lowest–highest. `price_note` names the basis, the chains,
//     the date and the method. `price_as_of` is the observation date (the column is a `date`).
//   * Every other ingredient keeps its value; its `price_note` now says it is an unchecked estimate.
//
// NUTRITION (per 100 g; carbs follow the table's USDA "by difference" convention = EU carbohydrate +
// fibre, so keto and low-carb totals stay comparable across rows)
//   * CIQUAL 2020 (ANSES, the French national table — EU) where it has the food: feta PDO, extra-virgin
//     olive oil, tahini, split pea (fava), dandelion (horta), and the outliers below. Where CIQUAL
//     gives no energy value, energy is computed from its composition with the EU Reg. 1169/2011
//     Annex XIV factors (protein/carbohydrate 4, fat 9, fibre 2 kcal/g).
//   * The Greek food composition tables (Hellenic Health Foundation) were not reachable, so for Greek
//     products CIQUAL lacks, the value is the mean of the EU nutrition declarations on the products
//     on sale (Sklavenitis product pages, 2026-10), deduplicated, keeping only labels whose declared
//     energy agrees with their own macros (±12 %) and that lie within 35 % of the median. The note
//     names the product category, never a brand.
//   * Outliers fixed (energy disagreed with the macros even after fibre and alcohol): chilli flakes,
//     cloves and cocoa powder (CIQUAL), baking powder (CIQUAL composition), allspice (USDA FDC
//     composition, energy recomputed with EU factors) and erythritol (0 kcal/g, EU Annex XIV).
//   * src/content/seed/ingredients-sanity.test.ts pins kcal ≈ 4P + 4C + 9F (±15 % or ±20 kcal) on the
//     overlaid table, with fibre / alcohol / polyol named per row where the plain formula cannot hold.

import type { Overlay } from './types.ts'

export const OVERLAY: Overlay = {
  id: '0004-prices-nutrition',
  summary:
    'Greek retail prices 2026-10 (142 ingredients shelf-checked at Sklavenitis and My market, 180 marked as estimates) and EU-sourced nutrition for 33 ingredients (CIQUAL 2020, EU labels)',
  patches: {
    ingredients: [
      {
        slug: 'allspice',
        set: {
          kcal_100g: 348,
          protein_100g: 6.1,
          carbs_100g: 72.1,
          fat_100g: 8.7,
          source_note:
            'USDA FoodData Central "Spices, allspice, ground" (171315) composition, energy recomputed with EU Reg. 1169/2011 factors (fibre 21.6 g at 2 kcal/g)',
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'almond-butter',
        set: {
          price_eur_min: 29.3,
          price_eur_max: 39.7,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 4 products, lowest–highest',
        },
      },
      {
        slug: 'almond-flour',
        set: {
          price_eur_min: 24.6,
          price_eur_max: 30.3,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 2 products, lowest–highest',
        },
      },
      {
        slug: 'almond-milk',
        set: {
          price_eur_min: 2.07,
          price_eur_max: 2.94,
          price_as_of: '2026-10-06',
          price_note:
            'per l — Sklavenitis & My market online shelf prices, 2026-10-06; 18 products, 10th–90th percentile',
        },
      },
      {
        slug: 'almonds',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'anchovies',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'anchovy-fillets',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'anthotyro',
        set: {
          kcal_100g: 169,
          protein_100g: 12.2,
          carbs_100g: 3.4,
          fat_100g: 11.6,
          source_note:
            'Mean of 4 EU nutrition labels (EU Reg. 1169/2011) of Greek fresh anthotyro cheeses on sale in Greece, 2026-10; carbs incl. fibre',
          price_eur_min: 6.96,
          price_eur_max: 12,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 13 products, 10th–90th percentile',
        },
      },
      {
        slug: 'apple',
        set: {
          price_eur_min: 1.29,
          price_eur_max: 2.49,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 15 products, 10th–90th percentile',
        },
      },
      {
        slug: 'apple-cider-vinegar',
        set: {
          price_eur_min: 3,
          price_eur_max: 6.35,
          price_as_of: '2026-10-06',
          price_note:
            'per l — Sklavenitis & My market online shelf prices, 2026-10-06; 14 products, 10th–90th percentile',
        },
      },
      {
        slug: 'apricot',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'arborio-rice',
        set: {
          price_eur_min: 1.56,
          price_eur_max: 5.44,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06, 12 products: Greek glacé round-grain risotto rice 1.56–4.36, imported arborio 5.44 (lowest–highest)',
        },
      },
      {
        slug: 'artichoke',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per piece',
        },
      },
      {
        slug: 'asparagus',
        set: {
          price_eur_min: 19.8,
          price_eur_max: 19.8,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — My market online shelf prices, 2026-10-06; 1 product, lowest–highest',
        },
      },
      {
        slug: 'avocado',
        set: {
          price_eur_min: 0.59,
          price_eur_max: 1.27,
          price_as_of: '2026-10-06',
          price_note:
            'per piece (~150 g), from per-kg prices — Sklavenitis & My market online shelf prices, 2026-10-06; 4 products, lowest–highest',
        },
      },
      {
        slug: 'avocado-oil',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per l',
        },
      },
      {
        slug: 'bacon',
        set: {
          price_eur_min: 8.19,
          price_eur_max: 27.8,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 15 products, 10th–90th percentile',
        },
      },
      {
        slug: 'baking-powder',
        set: {
          kcal_100g: 146,
          protein_100g: 2,
          carbs_100g: 35.1,
          fat_100g: 0.2,
          source_note:
            'CIQUAL 2020 (ANSES), "Baking powder or raising agent" (11046); energy from the composition with EU Reg. 1169/2011 factors; carbs incl. fibre',
          price_eur_min: 7.47,
          price_eur_max: 8.76,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 5 products, 10th–90th percentile',
        },
      },
      {
        slug: 'baking-soda',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'balsamic-vinegar',
        set: {
          price_eur_min: 4.6,
          price_eur_max: 9.32,
          price_as_of: '2026-10-06',
          price_note:
            'per l — Sklavenitis & My market online shelf prices, 2026-10-06; 11 products, 10th–90th percentile',
        },
      },
      {
        slug: 'banana',
        set: {
          price_eur_min: 1.39,
          price_eur_max: 1.94,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 6 products, 10th–90th percentile',
        },
      },
      {
        slug: 'barley',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'basil',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per bunch',
        },
      },
      {
        slug: 'basmati-rice',
        set: {
          price_eur_min: 3.21,
          price_eur_max: 7.54,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 14 products, 10th–90th percentile',
        },
      },
      {
        slug: 'bay-leaf',
        set: {
          price_eur_min: 98.5,
          price_eur_max: 165,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 3 products, lowest–highest',
        },
      },
      {
        slug: 'beef-heart',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'beef-kidney',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'beef-liver',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'beef-mince',
        set: {
          price_eur_min: 13.2,
          price_eur_max: 17.9,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis online shelf prices, 2026-10-06; 3 products, lowest–highest',
        },
      },
      {
        slug: 'beef-steak',
        set: {
          price_eur_min: 19.9,
          price_eur_max: 24,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 2 products, lowest–highest',
        },
      },
      {
        slug: 'beef-stew',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'beer',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per l',
        },
      },
      {
        slug: 'beetroot',
        set: {
          price_eur_min: 1.57,
          price_eur_max: 1.59,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 2 products, lowest–highest',
        },
      },
      {
        slug: 'bell-pepper',
        set: {
          price_eur_min: 2.05,
          price_eur_max: 4.59,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 10 products, 10th–90th percentile',
        },
      },
      {
        slug: 'black-beans',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'black-eyed-peas',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'black-pepper',
        set: {
          price_eur_min: 14.1,
          price_eur_max: 94.5,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 8 products, 10th–90th percentile',
        },
      },
      {
        slug: 'black-tea',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per l',
        },
      },
      {
        slug: 'blue-cheese',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'blueberry',
        set: {
          price_eur_min: 16,
          price_eur_max: 18.8,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 2 products, lowest–highest',
        },
      },
      {
        slug: 'bone-broth',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per l',
        },
      },
      {
        slug: 'bone-marrow',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'bread',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'breadcrumbs',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'breadsticks',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'broad-beans',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'broccoli',
        set: {
          price_eur_min: 2.9,
          price_eur_max: 3.99,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 3 products, lowest–highest',
        },
      },
      {
        slug: 'brown-rice',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'brown-sugar',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'brussels-sprouts',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'buckwheat',
        set: {
          price_eur_min: 4.56,
          price_eur_max: 6.18,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 3 products, lowest–highest',
        },
      },
      {
        slug: 'bulgur',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'butter',
        set: {
          price_eur_min: 8.56,
          price_eur_max: 21.9,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 14 products, 10th–90th percentile',
        },
      },
      {
        slug: 'cabbage',
        set: {
          price_eur_min: 0.65,
          price_eur_max: 0.8,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 2 products, lowest–highest',
        },
      },
      {
        slug: 'canned-chickpeas',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'canned-sardines',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'canned-tomatoes',
        set: {
          price_eur_min: 1.66,
          price_eur_max: 3.79,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 12 products, 10th–90th percentile',
        },
      },
      {
        slug: 'canned-tuna',
        set: {
          price_eur_min: 17.5,
          price_eur_max: 44.6,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 33 products, 10th–90th percentile',
        },
      },
      {
        slug: 'capers',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'carrot',
        set: {
          price_eur_min: 0.95,
          price_eur_max: 1.98,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 4 products, lowest–highest',
        },
      },
      {
        slug: 'cashews',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'cauliflower',
        set: {
          price_eur_min: 2.15,
          price_eur_max: 2.78,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 2 products, lowest–highest',
        },
      },
      {
        slug: 'celeriac',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'celery',
        set: {
          price_eur_min: 1.98,
          price_eur_max: 1.99,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 2 products, lowest–highest',
        },
      },
      {
        slug: 'chamomile',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per l',
        },
      },
      {
        slug: 'chard',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'cheddar',
        set: {
          price_eur_min: 12.2,
          price_eur_max: 21,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — My market online shelf prices, 2026-10-06; 2 products, lowest–highest',
        },
      },
      {
        slug: 'cherry',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'cherry-tomato',
        set: {
          price_eur_min: 5.19,
          price_eur_max: 9.64,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 8 products, 10th–90th percentile',
        },
      },
      {
        slug: 'chestnuts',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'chia-seeds',
        set: {
          price_eur_min: 8.46,
          price_eur_max: 14.8,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 3 products, lowest–highest',
        },
      },
      {
        slug: 'chicken-breast',
        set: {
          price_eur_min: 9.23,
          price_eur_max: 16,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 11 products, 10th–90th percentile',
        },
      },
      {
        slug: 'chicken-drumstick',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'chicken-liver',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'chicken-thigh',
        set: {
          price_eur_min: 5.19,
          price_eur_max: 18.2,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 13 products, 10th–90th percentile',
        },
      },
      {
        slug: 'chicken-wings',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'chickpea-flour',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'chickpeas',
        set: {
          price_eur_min: 2.8,
          price_eur_max: 5.91,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 10 products, 10th–90th percentile',
        },
      },
      {
        slug: 'chilli-flakes',
        set: {
          kcal_100g: 376,
          protein_100g: 12,
          carbs_100g: 56.6,
          fat_100g: 17.3,
          source_note: 'CIQUAL 2020 (ANSES), "Cayenne pepper" (11088); carbs incl. fibre',
          price_eur_min: 15,
          price_eur_max: 38.9,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 3 products, lowest–highest',
        },
      },
      {
        slug: 'cinnamon',
        set: {
          price_eur_min: 11.8,
          price_eur_max: 36,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 4 products, lowest–highest',
        },
      },
      {
        slug: 'cloves',
        set: {
          kcal_100g: 335,
          protein_100g: 6,
          carbs_100g: 65.5,
          fat_100g: 13,
          source_note: 'CIQUAL 2020 (ANSES), "Cloves" (11052); carbs incl. fibre',
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'cocoa-powder',
        set: {
          kcal_100g: 387,
          protein_100g: 22.4,
          carbs_100g: 41.1,
          fat_100g: 20.6,
          source_note:
            'CIQUAL 2020 (ANSES), "Cocoa powder, without sugar" (18100); carbs incl. fibre',
          price_eur_min: 15.8,
          price_eur_max: 28,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis online shelf prices, 2026-10-06; 3 products, lowest–highest',
        },
      },
      {
        slug: 'coconut-flour',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'coconut-milk',
        set: {
          price_eur_min: 6,
          price_eur_max: 6.05,
          price_as_of: '2026-10-06',
          price_note:
            'per l — Sklavenitis & My market online shelf prices, 2026-10-06; 3 products, lowest–highest',
        },
      },
      {
        slug: 'coconut-oil',
        set: {
          price_eur_min: 13.9,
          price_eur_max: 13.9,
          price_as_of: '2026-10-06',
          price_note:
            'per l — Sklavenitis & My market online shelf prices, 2026-10-06; 2 products, lowest–highest',
        },
      },
      {
        slug: 'cod',
        set: {
          price_eur_min: 6.12,
          price_eur_max: 15.5,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 16 products, 10th–90th percentile',
        },
      },
      {
        slug: 'coffee',
        set: {
          price_eur_min: 1.08,
          price_eur_max: 1.8,
          price_as_of: '2026-10-06',
          price_note:
            'per l brewed, from ground filter coffee at 60 g per litre — Sklavenitis & My market online shelf prices, 2026-10-06; 30 products, 10th–90th percentile',
        },
      },
      {
        slug: 'condensed-milk',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per l',
        },
      },
      {
        slug: 'coriander',
        set: {
          price_eur_min: 0.75,
          price_eur_max: 0.75,
          price_as_of: '2026-10-06',
          price_note:
            'per bunch (~100 g) — Sklavenitis online shelf prices, 2026-10-06; 1 product, lowest–highest',
        },
      },
      {
        slug: 'corn',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'cornmeal',
        set: {
          price_eur_min: 2,
          price_eur_max: 2.2,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 2 products, lowest–highest',
        },
      },
      {
        slug: 'cornstarch',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'cottage-cheese',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'couscous',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'cream-cheese',
        set: {
          price_eur_min: 7.99,
          price_eur_max: 16.8,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 12 products, 10th–90th percentile',
        },
      },
      {
        slug: 'cucumber',
        set: {
          price_eur_min: 0.32,
          price_eur_max: 0.53,
          price_as_of: '2026-10-06',
          price_note:
            'per piece (~300 g) — Sklavenitis & My market online shelf prices, 2026-10-06: 0.53 a piece at both chains; small cucumbers 1.08 €/kg (≈ 0.32 a 300 g piece)',
        },
      },
      {
        slug: 'cumin',
        set: {
          price_eur_min: 21.6,
          price_eur_max: 60,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 5 products, 10th–90th percentile',
        },
      },
      {
        slug: 'curry-powder',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'cuttlefish',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'dark-chocolate',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'dates',
        set: {
          price_eur_min: 6.59,
          price_eur_max: 14.9,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 5 products, 10th–90th percentile',
        },
      },
      {
        slug: 'desiccated-coconut',
        set: {
          price_eur_min: 7.2,
          price_eur_max: 9.69,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 2 products, lowest–highest',
        },
      },
      {
        slug: 'dill',
        set: {
          price_eur_min: 0.75,
          price_eur_max: 0.99,
          price_as_of: '2026-10-06',
          price_note:
            'per bunch (80–100 g) — Sklavenitis & My market online shelf prices, 2026-10-06, 3 products',
        },
      },
      {
        slug: 'dried-fig',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'dry-yeast',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'duck',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'edamame',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'egg',
        set: {
          price_eur_min: 0.24,
          price_eur_max: 0.58,
          price_as_of: '2026-10-06',
          price_note:
            'per egg, from pack prices — Sklavenitis & My market online shelf prices, 2026-10-06; 31 products, 10th–90th percentile',
        },
      },
      {
        slug: 'egg-white',
        set: {
          price_eur_min: 7.1,
          price_eur_max: 7.96,
          price_as_of: '2026-10-06',
          price_note:
            'per l — Sklavenitis & My market online shelf prices, 2026-10-06; 6 products, 10th–90th percentile',
        },
      },
      {
        slug: 'eggplant',
        set: {
          price_eur_min: 1.45,
          price_eur_max: 2.7,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 4 products, lowest–highest',
        },
      },
      {
        slug: 'endive',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'erythritol',
        set: {
          kcal_100g: 0,
          source_note:
            'Composition: USDA FoodData Central reference ranges; energy 0 kcal/g for erythritol per EU Reg. 1169/2011 Annex XIV',
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'evaporated-milk',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per l',
        },
      },
      {
        slug: 'fava',
        set: {
          kcal_100g: 344,
          protein_100g: 22.8,
          carbs_100g: 67.8,
          fat_100g: 1.4,
          source_note:
            'CIQUAL 2020 (ANSES), "Split pea, dried" (20515); energy from the composition with EU Reg. 1169/2011 factors; carbs incl. fibre',
          price_eur_min: 3,
          price_eur_max: 4.78,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 3 products, lowest–highest',
        },
      },
      {
        slug: 'fennel',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'feta',
        set: {
          kcal_100g: 285,
          protein_100g: 15.1,
          carbs_100g: 0.7,
          fat_100g: 24.3,
          source_note: 'CIQUAL 2020 (ANSES), "Feta cheese, PDO" (12066); carbs incl. fibre',
          price_eur_min: 12.4,
          price_eur_max: 17.7,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 23 products, 10th–90th percentile',
        },
      },
      {
        slug: 'fig',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'flaxseed',
        set: {
          price_eur_min: 5.86,
          price_eur_max: 8.88,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 3 products, lowest–highest',
        },
      },
      {
        slug: 'flour',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'garlic',
        set: {
          price_eur_min: 8,
          price_eur_max: 14.4,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — derived from per-head prices (0.40–0.72 € a head, Sklavenitis & My market online shelf prices, 2026-10-06, 4 products) at ~50 g a head',
        },
      },
      {
        slug: 'garlic-powder',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'gelatin',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'ghee',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'gigantes',
        set: {
          kcal_100g: 294,
          protein_100g: 20.4,
          carbs_100g: 60.3,
          fat_100g: 2.4,
          source_note:
            'Mean of 4 EU nutrition labels (EU Reg. 1169/2011) of dried Greek gigantes beans on sale in Greece, 2026-10; carbs incl. fibre',
          price_eur_min: 5.13,
          price_eur_max: 13.2,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 12 products, 10th–90th percentile',
        },
      },
      {
        slug: 'ginger',
        set: {
          price_eur_min: 3.1,
          price_eur_max: 3.99,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 2 products, lowest–highest',
        },
      },
      {
        slug: 'goat',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'goat-milk',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per l',
        },
      },
      {
        slug: 'gouda',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'granola',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'grapefruit',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'grapes',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'graviera',
        set: {
          kcal_100g: 399,
          protein_100g: 25.5,
          carbs_100g: 2.1,
          fat_100g: 32.5,
          source_note:
            'Mean of 4 EU nutrition labels (EU Reg. 1169/2011) of Greek graviera cheeses on sale in Greece, 2026-10; carbs incl. fibre',
          price_eur_min: 12.5,
          price_eur_max: 19.8,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 33 products, 10th–90th percentile',
        },
      },
      {
        slug: 'greek-yoghurt',
        set: {
          kcal_100g: 130,
          protein_100g: 6.1,
          carbs_100g: 3.6,
          fat_100g: 10,
          source_note:
            'Mean of 2 EU nutrition labels (EU Reg. 1169/2011) of Greek strained yoghurts, 10 % fat on sale in Greece, 2026-10; carbs incl. fibre',
          price_eur_min: 2.65,
          price_eur_max: 4.24,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 7 products, 10th–90th percentile',
        },
      },
      {
        slug: 'greek-yoghurt-light',
        set: {
          kcal_100g: 71,
          protein_100g: 9.3,
          carbs_100g: 3.8,
          fat_100g: 2,
          source_note:
            'Mean of 9 EU nutrition labels (EU Reg. 1169/2011) of Greek strained yoghurts, 2 % fat on sale in Greece, 2026-10; carbs incl. fibre',
          price_eur_min: 3.1,
          price_eur_max: 6.63,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 31 products, 10th–90th percentile',
        },
      },
      {
        slug: 'green-beans',
        set: {
          price_eur_min: 3.1,
          price_eur_max: 3.99,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 2 products, lowest–highest',
        },
      },
      {
        slug: 'green-olives',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'grouper',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'halloumi',
        set: {
          price_eur_min: 16.3,
          price_eur_max: 16.3,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — My market online shelf prices, 2026-10-06; 1 product, lowest–highest',
        },
      },
      {
        slug: 'halva',
        set: {
          kcal_100g: 547,
          protein_100g: 12.3,
          carbs_100g: 53.2,
          fat_100g: 32.7,
          source_note:
            'Mean of 2 EU nutrition labels (EU Reg. 1169/2011) of Greek tahini halva, plain/vanilla on sale in Greece, 2026-10; carbs incl. fibre',
          price_eur_min: 6.23,
          price_eur_max: 23.8,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 34 products, 10th–90th percentile',
        },
      },
      {
        slug: 'ham',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'hazelnuts',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'heavy-cream',
        set: {
          price_eur_min: 6.53,
          price_eur_max: 11.3,
          price_as_of: '2026-10-06',
          price_note:
            'per l — Sklavenitis & My market online shelf prices, 2026-10-06; 6 products, 10th–90th percentile',
        },
      },
      {
        slug: 'hilopites',
        set: {
          kcal_100g: 354,
          protein_100g: 12,
          carbs_100g: 72.1,
          fat_100g: 1.5,
          source_note:
            'Mean of 1 EU nutrition label (EU Reg. 1169/2011) of Greek hilopites egg pasta on sale in Greece, 2026-10; carbs incl. fibre',
          price_eur_min: 2.76,
          price_eur_max: 4.23,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 10 products, 10th–90th percentile',
        },
      },
      {
        slug: 'honey',
        set: {
          kcal_100g: 334,
          protein_100g: 0.2,
          carbs_100g: 83.2,
          fat_100g: 0,
          source_note:
            'Mean of 2 EU nutrition labels (EU Reg. 1169/2011) of Greek honeys (thyme, pine, flower) on sale in Greece, 2026-10; carbs incl. fibre',
          price_eur_min: 5.81,
          price_eur_max: 18.5,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 27 products, 10th–90th percentile',
        },
      },
      {
        slug: 'horn-pepper',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'horta',
        set: {
          kcal_100g: 49,
          protein_100g: 2.9,
          carbs_100g: 8.8,
          fat_100g: 0.9,
          source_note:
            'CIQUAL 2020 (ANSES), "Dandelion, raw" (20038), the closest wild green; energy from the composition with EU Reg. 1169/2011 factors; carbs incl. fibre',
          price_eur_min: 1.68,
          price_eur_max: 1.99,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 8 products, 10th–90th percentile',
        },
      },
      {
        slug: 'hot-pepper',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'hot-sauce',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per l',
        },
      },
      {
        slug: 'hummus',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'jam',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'kalamata-olives',
        set: {
          kcal_100g: 236,
          protein_100g: 1.5,
          carbs_100g: 4.1,
          fat_100g: 23.9,
          source_note:
            'Mean of 8 EU nutrition labels (EU Reg. 1169/2011) of Kalamata olives in brine, drained on sale in Greece, 2026-10; carbs incl. fibre',
          price_eur_min: 6.97,
          price_eur_max: 20.8,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 17 products, 10th–90th percentile',
        },
      },
      {
        slug: 'kale',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'kasseri',
        set: {
          kcal_100g: 344,
          protein_100g: 23.9,
          carbs_100g: 0.5,
          fat_100g: 27.3,
          source_note:
            'Mean of 3 EU nutrition labels (EU Reg. 1169/2011) of Greek PDO kasseri cheeses on sale in Greece, 2026-10; carbs incl. fibre',
          price_eur_min: 18,
          price_eur_max: 27.9,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 8 products, 10th–90th percentile',
        },
      },
      {
        slug: 'kefalotyri',
        set: {
          kcal_100g: 363,
          protein_100g: 24.1,
          carbs_100g: 0.8,
          fat_100g: 30.5,
          source_note:
            'Mean of 2 EU nutrition labels (EU Reg. 1169/2011) of Greek kefalotyri cheeses on sale in Greece, 2026-10; carbs incl. fibre',
          price_eur_min: 9.59,
          price_eur_max: 19,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 10 products, 10th–90th percentile',
        },
      },
      {
        slug: 'kefir',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per l',
        },
      },
      {
        slug: 'ketchup',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'kidney-beans',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'kiwi',
        set: {
          price_eur_min: 5.75,
          price_eur_max: 5.99,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 2 products, lowest–highest',
        },
      },
      {
        slug: 'koulouri',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per piece',
        },
      },
      {
        slug: 'lamb-chops',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'lamb-leg',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'lard',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'leek',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'lemon',
        set: {
          price_eur_min: 1.75,
          price_eur_max: 1.85,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 2 products, lowest–highest',
        },
      },
      {
        slug: 'lemon-juice',
        set: {
          price_eur_min: 3.28,
          price_eur_max: 5.02,
          price_as_of: '2026-10-06',
          price_note:
            'per l — Sklavenitis & My market online shelf prices, 2026-10-06; 5 products, 10th–90th percentile',
        },
      },
      {
        slug: 'lentil-pasta',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'lentils',
        set: {
          price_eur_min: 2.24,
          price_eur_max: 5.19,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 18 products, 10th–90th percentile',
        },
      },
      {
        slug: 'lettuce',
        set: {
          price_eur_min: 0.78,
          price_eur_max: 0.84,
          price_as_of: '2026-10-06',
          price_note:
            'per head — Sklavenitis & My market online shelf prices, 2026-10-06; 2 products, lowest–highest',
        },
      },
      {
        slug: 'lime',
        set: {
          price_eur_min: 0.25,
          price_eur_max: 0.29,
          price_as_of: '2026-10-06',
          price_note:
            'per piece (~65 g), from per-kg prices — Sklavenitis & My market online shelf prices, 2026-10-06; 2 products, lowest–highest',
        },
      },
      {
        slug: 'lupini',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'mackerel',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'mandarin',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'mango',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'manouri',
        set: {
          kcal_100g: 451,
          protein_100g: 10,
          carbs_100g: 1.5,
          fat_100g: 45,
          source_note:
            'Mean of 1 EU nutrition label (EU Reg. 1169/2011) of Greek PDO manouri cheeses on sale in Greece, 2026-10; carbs incl. fibre',
          price_eur_min: 14.2,
          price_eur_max: 15.5,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 3 products, lowest–highest',
        },
      },
      {
        slug: 'maple-syrup',
        set: {
          price_eur_min: 24.8,
          price_eur_max: 34.9,
          price_as_of: '2026-10-06',
          price_note:
            'per l — Sklavenitis & My market online shelf prices, 2026-10-06; 2 products, lowest–highest',
        },
      },
      {
        slug: 'margarine',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'mayonnaise',
        set: {
          price_eur_min: 4.97,
          price_eur_max: 10.3,
          price_as_of: '2026-10-06',
          price_note:
            'ml-priced jars converted at 0.92 kg/l — Sklavenitis & My market online shelf prices, 2026-10-06; 29 products, 10th–90th percentile',
        },
      },
      {
        slug: 'melon',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'milk',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per l',
        },
      },
      {
        slug: 'mint',
        set: {
          price_eur_min: 0.85,
          price_eur_max: 1.5,
          price_as_of: '2026-10-06',
          price_note:
            'per bunch (25–50 g) — Sklavenitis online shelf prices, 2026-10-06; 2 products, lowest–highest',
        },
      },
      {
        slug: 'mizithra',
        set: {
          kcal_100g: 269,
          protein_100g: 29.2,
          carbs_100g: 4.4,
          fat_100g: 15,
          source_note:
            'Mean of 2 EU nutrition labels (EU Reg. 1169/2011) of Greek dry mizithra cheeses on sale in Greece, 2026-10; carbs incl. fibre',
          price_eur_min: 8.72,
          price_eur_max: 14.4,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 7 products, 10th–90th percentile',
        },
      },
      {
        slug: 'mountain-tea',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per l',
        },
      },
      {
        slug: 'mozzarella',
        set: {
          price_eur_min: 8.36,
          price_eur_max: 17.6,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 9 products, 10th–90th percentile',
        },
      },
      {
        slug: 'mushrooms',
        set: {
          price_eur_min: 3.6,
          price_eur_max: 6.46,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 8 products, 10th–90th percentile',
        },
      },
      {
        slug: 'mussels',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'mustard',
        set: {
          price_eur_min: 2.21,
          price_eur_max: 12.8,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 38 products, 10th–90th percentile',
        },
      },
      {
        slug: 'nori',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per sheet',
        },
      },
      {
        slug: 'nutmeg',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'nutritional-yeast',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'oat-milk',
        set: {
          price_eur_min: 2.08,
          price_eur_max: 2.74,
          price_as_of: '2026-10-06',
          price_note:
            'per l — Sklavenitis & My market online shelf prices, 2026-10-06; 11 products, 10th–90th percentile',
        },
      },
      {
        slug: 'oats',
        set: {
          price_eur_min: 2.24,
          price_eur_max: 5.89,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 8 products, 10th–90th percentile',
        },
      },
      {
        slug: 'octopus',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'okra',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'olive-oil',
        set: {
          kcal_100g: 900,
          protein_100g: 0,
          carbs_100g: 0,
          fat_100g: 99.9,
          source_note: 'CIQUAL 2020 (ANSES), "Olive oil, extra virgin" (17270); carbs incl. fibre',
          price_eur_min: 6.95,
          price_eur_max: 10.3,
          price_as_of: '2026-10-06',
          price_note:
            'per l — Sklavenitis & My market online shelf prices, 2026-10-06; 56 products, 10th–90th percentile',
        },
      },
      {
        slug: 'olive-paste',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'onion',
        set: {
          price_eur_min: 0.72,
          price_eur_max: 0.79,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 2 products, lowest–highest',
        },
      },
      {
        slug: 'orange',
        set: {
          price_eur_min: 1,
          price_eur_max: 1.25,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 3 products, lowest–highest',
        },
      },
      {
        slug: 'orange-juice',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per l',
        },
      },
      {
        slug: 'oregano',
        set: {
          price_eur_min: 16.8,
          price_eur_max: 67.3,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 8 products, 10th–90th percentile',
        },
      },
      {
        slug: 'orzo',
        set: {
          kcal_100g: 359,
          protein_100g: 12,
          carbs_100g: 75.4,
          fat_100g: 1.7,
          source_note:
            'Mean of 3 EU nutrition labels (EU Reg. 1169/2011) of Greek kritharaki (orzo) durum pasta on sale in Greece, 2026-10; carbs incl. fibre',
          price_eur_min: 1.24,
          price_eur_max: 2.43,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 18 products, 10th–90th percentile',
        },
      },
      {
        slug: 'ouzo',
        set: {
          price_eur_min: 11.8,
          price_eur_max: 20.6,
          price_as_of: '2026-10-06',
          price_note:
            'per l — Sklavenitis & My market online shelf prices, 2026-10-06; 35 products, 10th–90th percentile',
        },
      },
      {
        slug: 'paprika',
        set: {
          price_eur_min: 15.4,
          price_eur_max: 85,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 8 products, 10th–90th percentile',
        },
      },
      {
        slug: 'parmesan',
        set: {
          price_eur_min: 22.3,
          price_eur_max: 41.9,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 26 products, 10th–90th percentile',
        },
      },
      {
        slug: 'parsley',
        set: {
          price_eur_min: 0.75,
          price_eur_max: 0.79,
          price_as_of: '2026-10-06',
          price_note:
            'per bunch (~100 g) — Sklavenitis & My market online shelf prices, 2026-10-06, 2 products',
        },
      },
      {
        slug: 'passata',
        set: {
          price_eur_min: 1.09,
          price_eur_max: 2.1,
          price_as_of: '2026-10-06',
          price_note:
            'per l — Sklavenitis & My market online shelf prices, 2026-10-06; 7 products, 10th–90th percentile',
        },
      },
      {
        slug: 'pasta',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'pastourma',
        set: {
          kcal_100g: 187,
          protein_100g: 28.2,
          carbs_100g: 5.6,
          fat_100g: 4.8,
          source_note:
            'Mean of 2 EU nutrition labels (EU Reg. 1169/2011) of Greek/Armenian-style beef pastourma on sale in Greece, 2026-10; carbs incl. fibre',
          price_eur_min: 37,
          price_eur_max: 65.5,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 4 products, lowest–highest',
        },
      },
      {
        slug: 'pea-protein',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'peach',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'peanut-butter',
        set: {
          price_eur_min: 8.48,
          price_eur_max: 14,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — My market online shelf prices, 2026-10-06; 9 products, 10th–90th percentile',
        },
      },
      {
        slug: 'peanuts',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'pear',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'peas',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'pesto',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'petimezi',
        set: {
          price_eur_min: 13.1,
          price_eur_max: 13.1,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — My market online shelf prices, 2026-10-06; 1 product, lowest–highest',
        },
      },
      {
        slug: 'phyllo',
        set: {
          kcal_100g: 292,
          protein_100g: 8.7,
          carbs_100g: 61.8,
          fat_100g: 1,
          source_note:
            'Mean of 4 EU nutrition labels (EU Reg. 1169/2011) of Greek phyllo (fyllo kroustas) on sale in Greece, 2026-10; carbs incl. fibre',
          price_eur_min: 4.12,
          price_eur_max: 8.5,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 23 products, 10th–90th percentile',
        },
      },
      {
        slug: 'pickles',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'pine-nuts',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'pineapple',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'pistachios',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'pita',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per piece',
        },
      },
      {
        slug: 'plum',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'pomegranate',
        set: {
          price_eur_min: 2.59,
          price_eur_max: 2.6,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 2 products, lowest–highest',
        },
      },
      {
        slug: 'pork-belly',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'pork-chop',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'pork-mince',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'pork-shoulder',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'pork-tenderloin',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'potato',
        set: {
          price_eur_min: 0.68,
          price_eur_max: 1.67,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 9 products, 10th–90th percentile',
        },
      },
      {
        slug: 'prosciutto',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'prunes',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'psyllium-husk',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'pumpkin',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'pumpkin-seeds',
        set: {
          price_eur_min: 7.38,
          price_eur_max: 16.7,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 8 products, 10th–90th percentile',
        },
      },
      {
        slug: 'quince',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'quinoa',
        set: {
          price_eur_min: 10.5,
          price_eur_max: 13.7,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 5 products, 10th–90th percentile',
        },
      },
      {
        slug: 'rabbit',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'radish',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per bunch',
        },
      },
      {
        slug: 'raisins',
        set: {
          price_eur_min: 6.37,
          price_eur_max: 12.7,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 8 products, 10th–90th percentile',
        },
      },
      {
        slug: 'raspberry',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'red-cabbage',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'red-lentils',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'red-mullet',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'red-onion',
        set: {
          price_eur_min: 0.79,
          price_eur_max: 0.99,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — My market online shelf prices, 2026-10-06; 2 products, lowest–highest',
        },
      },
      {
        slug: 'red-wine',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per l',
        },
      },
      {
        slug: 'red-wine-vinegar',
        set: {
          price_eur_min: 0.99,
          price_eur_max: 2.23,
          price_as_of: '2026-10-06',
          price_note:
            'per l — Sklavenitis & My market online shelf prices, 2026-10-06; 6 products, 10th–90th percentile',
        },
      },
      {
        slug: 'rice',
        set: {
          price_eur_min: 1.92,
          price_eur_max: 4.9,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 16 products, 10th–90th percentile',
        },
      },
      {
        slug: 'rice-cakes',
        set: {
          price_eur_min: 15,
          price_eur_max: 17,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 6 products, 10th–90th percentile',
        },
      },
      {
        slug: 'rice-noodles',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'ricotta',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'roasted-red-peppers',
        set: {
          kcal_100g: 23,
          protein_100g: 0.8,
          carbs_100g: 5.6,
          fat_100g: 0,
          source_note:
            'Mean of 2 EU nutrition labels (EU Reg. 1169/2011) of roasted red (Florina-type) peppers in jars on sale in Greece, 2026-10; carbs incl. fibre',
          price_eur_min: 6.53,
          price_eur_max: 8.86,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 6 products, 10th–90th percentile',
        },
      },
      {
        slug: 'rocket',
        set: {
          price_eur_min: 10,
          price_eur_max: 12.9,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis online shelf prices, 2026-10-06; 2 products, lowest–highest',
        },
      },
      {
        slug: 'rosemary',
        set: {
          price_eur_min: 58.4,
          price_eur_max: 79.6,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 3 products, lowest–highest',
        },
      },
      {
        slug: 'rusks',
        set: {
          kcal_100g: 362,
          protein_100g: 13.9,
          carbs_100g: 77.4,
          fat_100g: 2.1,
          source_note:
            'Mean of 4 EU nutrition labels (EU Reg. 1169/2011) of Cretan barley rusks (paximadia) on sale in Greece, 2026-10; carbs incl. fibre',
          price_eur_min: 3.95,
          price_eur_max: 8.55,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 15 products, 10th–90th percentile',
        },
      },
      {
        slug: 'saffron',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per 1 g sachet',
        },
      },
      {
        slug: 'sage',
        set: {
          price_eur_min: 18,
          price_eur_max: 68.7,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 4 products, lowest–highest',
        },
      },
      {
        slug: 'salami',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'salmon',
        set: {
          price_eur_min: 20.5,
          price_eur_max: 30.7,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis online shelf prices, 2026-10-06; 5 products, 10th–90th percentile',
        },
      },
      {
        slug: 'salt',
        set: {
          price_eur_min: 0.79,
          price_eur_max: 3.52,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 20 products, 10th–90th percentile',
        },
      },
      {
        slug: 'salted-cod',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'sardines',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'sauerkraut',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'sausage',
        set: {
          kcal_100g: 276,
          protein_100g: 14,
          carbs_100g: 1.7,
          fat_100g: 23.8,
          source_note:
            'Mean of 3 EU nutrition labels (EU Reg. 1169/2011) of Greek village pork sausages (loukaniko) on sale in Greece, 2026-10; carbs incl. fibre',
          price_eur_min: 8.14,
          price_eur_max: 16.5,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 21 products, 10th–90th percentile',
        },
      },
      {
        slug: 'sea-bass',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'sea-bream',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'seitan',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'semi-skimmed-milk',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per l',
        },
      },
      {
        slug: 'semolina',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'sesame-oil',
        set: {
          price_eur_min: 11.3,
          price_eur_max: 31.8,
          price_as_of: '2026-10-06',
          price_note:
            'per l — Sklavenitis & My market online shelf prices, 2026-10-06; 3 products, lowest–highest',
        },
      },
      {
        slug: 'sesame-seeds',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'sheep-yoghurt',
        set: {
          kcal_100g: 100,
          protein_100g: 5.6,
          carbs_100g: 4.6,
          fat_100g: 6.6,
          source_note:
            'Mean of 7 EU nutrition labels (EU Reg. 1169/2011) of Greek traditional sheep-milk yoghurts on sale in Greece, 2026-10; carbs incl. fibre',
          price_eur_min: 5.64,
          price_eur_max: 7.08,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 13 products, 10th–90th percentile',
        },
      },
      {
        slug: 'shrimp',
        set: {
          price_eur_min: 10.7,
          price_eur_max: 22.2,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 22 products, 10th–90th percentile',
        },
      },
      {
        slug: 'skyr',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'smoked-herring',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'smoked-salmon',
        set: {
          price_eur_min: 40.6,
          price_eur_max: 69,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 11 products, 10th–90th percentile',
        },
      },
      {
        slug: 'sour-cream',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'soy-milk',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per l',
        },
      },
      {
        slug: 'soy-mince',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'soy-sauce',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per l',
        },
      },
      {
        slug: 'sparkling-water',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per l',
        },
      },
      {
        slug: 'spinach',
        set: {
          price_eur_min: 2.6,
          price_eur_max: 5.87,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 3 products, lowest–highest',
        },
      },
      {
        slug: 'spring-onion',
        set: {
          price_eur_min: 0.28,
          price_eur_max: 1.34,
          price_as_of: '2026-10-06',
          price_note:
            'per bunch — Sklavenitis & My market online shelf prices, 2026-10-06: loose 2.75–2.99 €/kg (≈ 0.28–0.30 a 100 g bunch) to 1.34 for a packed 140 g bunch',
        },
      },
      {
        slug: 'squid',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'stevia',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'stock-cube',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per cube',
        },
      },
      {
        slug: 'strawberry',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh (out of season: only a frozen pack on sale 2026-10-06) — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'sugar',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'sun-dried-tomatoes',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'sunflower-oil',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per l',
        },
      },
      {
        slug: 'sunflower-seeds',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'sweet-potato',
        set: {
          price_eur_min: 1.75,
          price_eur_max: 2.3,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 3 products, lowest–highest',
        },
      },
      {
        slug: 'swordfish',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'tahini',
        set: {
          kcal_100g: 621,
          protein_100g: 17.7,
          carbs_100g: 20.8,
          fat_100g: 53.4,
          source_note:
            'CIQUAL 2020 (ANSES), "Tahini (sesame paste)" (15203); energy from the composition with EU Reg. 1169/2011 factors; carbs incl. fibre',
          price_eur_min: 6.26,
          price_eur_max: 16.2,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 19 products, 10th–90th percentile',
        },
      },
      {
        slug: 'tallow',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'tempeh',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'thyme',
        set: {
          price_eur_min: 17.5,
          price_eur_max: 79.6,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 4 products, lowest–highest',
        },
      },
      {
        slug: 'tofu',
        set: {
          price_eur_min: 8.25,
          price_eur_max: 12.3,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 4 products, lowest–highest',
        },
      },
      {
        slug: 'tomato',
        set: {
          price_eur_min: 1.78,
          price_eur_max: 2.62,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 6 products, 10th–90th percentile',
        },
      },
      {
        slug: 'tomato-paste',
        set: {
          price_eur_min: 3.7,
          price_eur_max: 9.74,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 20 products, 10th–90th percentile',
        },
      },
      {
        slug: 'tortilla',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per piece',
        },
      },
      {
        slug: 'trahana',
        set: {
          kcal_100g: 370,
          protein_100g: 12.9,
          carbs_100g: 70.6,
          fat_100g: 3.3,
          source_note:
            'Mean of 2 EU nutrition labels (EU Reg. 1169/2011) of Greek trahanas (sour and sweet) on sale in Greece, 2026-10; carbs incl. fibre',
          price_eur_min: 4.1,
          price_eur_max: 5.2,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 8 products, 10th–90th percentile',
        },
      },
      {
        slug: 'trout',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'tuna-steak',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'turkey-breast',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'turkey-mince',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'turkey-slices',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'turmeric',
        set: {
          price_eur_min: 51.5,
          price_eur_max: 51.5,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — My market online shelf prices, 2026-10-06; 1 product, lowest–highest',
        },
      },
      {
        slug: 'turnip',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'vanilla-extract',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per l',
        },
      },
      {
        slug: 'vine-leaves',
        set: {
          kcal_100g: 52,
          protein_100g: 4,
          carbs_100g: 9.8,
          fat_100g: 0.3,
          source_note:
            'Mean of 3 EU nutrition labels (EU Reg. 1169/2011) of vine leaves in brine on sale in Greece, 2026-10; carbs incl. fibre',
          price_eur_min: 18.3,
          price_eur_max: 26.5,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 3 products, lowest–highest',
        },
      },
      {
        slug: 'vlita',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'walnuts',
        set: {
          price_eur_min: 16,
          price_eur_max: 30.8,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 3 products, lowest–highest',
        },
      },
      {
        slug: 'water',
        set: {
          price_eur_min: 0.18,
          price_eur_max: 0.23,
          price_as_of: '2026-10-06',
          price_note:
            'per l — Sklavenitis & My market online shelf prices, 2026-10-06; 18 products, 10th–90th percentile',
        },
      },
      {
        slug: 'watermelon',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'whey-protein',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'white-beans',
        set: {
          price_eur_min: 2.58,
          price_eur_max: 7.56,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 16 products, 10th–90th percentile',
        },
      },
      {
        slug: 'white-wine',
        set: {
          price_eur_min: 5.09,
          price_eur_max: 22.2,
          price_as_of: '2026-10-06',
          price_note:
            'per l — Sklavenitis & My market online shelf prices, 2026-10-06; 52 products, 10th–90th percentile',
        },
      },
      {
        slug: 'whole-chicken',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'whole-wheat-bread',
        set: {
          price_eur_min: 2.65,
          price_eur_max: 4.43,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 24 products, 10th–90th percentile',
        },
      },
      {
        slug: 'whole-wheat-flour',
        set: {
          price_note:
            'Estimate, not checked against shelf prices in the 2026-10 refresh — typical Greek supermarket range, per kg',
        },
      },
      {
        slug: 'whole-wheat-pasta',
        set: {
          price_eur_min: 1.5,
          price_eur_max: 2.44,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 31 products, 10th–90th percentile',
        },
      },
      {
        slug: 'zucchini',
        set: {
          price_eur_min: 1.3,
          price_eur_max: 1.99,
          price_as_of: '2026-10-06',
          price_note:
            'per kg — Sklavenitis & My market online shelf prices, 2026-10-06; 3 products, lowest–highest',
        },
      },
    ],
  },
}
