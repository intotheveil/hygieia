// SKINCARE DICTIONARY (P7.2 UI) — every string the `/skincare` page shows, in both languages
// (ADR-0002 at feature scale). Part of the full `Dictionary` (./index.ts). Every enum label table
// is keyed by its content enum (`Audience`, `SkinType`, `SkinConcern`, `Region`, `RoutineTime`,
// `StepTime`, `CareArea`, `SkincareCategory`, `PriceBand`), so a new enum member without a label is
// a type error. Counted strings are `PluralForms` filled by `plural()` (../fill.ts).
//
// Reused from their owners, never re-declared (one owner per key): `sourcePending` (tips),
// `duration` + `minutesUnit` (workouts), `retry` (plans), `loading` + `notMedicalAdvice` (base).
// Greek: loanwords the Greek shopper uses stay Latin-script (SPF, PA, retinol); everything else is
// written as a Greek pharmacist would say it.
//
// ROUTE FEATURE (perf, 2026-10-06): read only by `/skincare`, so it is NOT composed into the
// dictionary every page gets from `useLang()` — the route's components call `useLang(skincareCopy)`
// and these strings ship in that route's lazy chunk (./routeFeatures.ts).

import type {
  Audience,
  CareArea,
  PriceBand,
  Region,
  RoutineTime,
  SkinConcern,
  SkinType,
  SkincareCategory,
  StepTime,
} from '../../content/enums.ts'
import type { PluralForms } from '../fill.ts'
import type { FeatureCopy } from '../app.ts'

export interface SkincareDictionary {
  skincareTitle: string
  skincareIntro: string
  /** `aria-label` of the filter toolbar. */
  skincareFilters: string
  skincareAreaLabel: string
  skincareArea: Record<CareArea, string>
  skincareAudienceLabel: string
  /** `all` is the "everyone" option (= no audience filter). */
  skincareAudience: Record<Audience, string>
  skincareSkinTypeLabel: string
  /** `all` is the "every skin type" option (= no filter) and the chip for universal content. */
  skincareSkinType: Record<SkinType, string>
  skincareConcernLabel: string
  skincareAnyConcern: string
  skincareConcern: Record<SkinConcern, string>
  skincareRegionLabel: string
  /** The same control under the nails area. */
  skincareRegionLabelNails: string
  skincareAnyRegion: string
  /** `global` is the chip for content that applies everywhere. */
  skincareRegion: Record<Region, string>
  skincareTime: Record<RoutineTime, string>
  skincareStepTime: Record<StepTime, string>
  skincareCategory: Record<SkincareCategory, string>
  skincarePriceBand: Record<PriceBand, string>
  skincareRoutinesHeading: string
  skincareRoutinesCount: PluralForms
  skincareGuideHeading: string
  skincareGuideCount: PluralForms
  skincareTipsHeading: string
  skincareTipsCount: PluralForms
  skincareShowSteps: string
  skincareHideSteps: string
  /** `aria-label` of a routine's ordered step list. */
  skincareSteps: string
  skincareOptionalStep: string
  /** A step whose product type is not visible (pending review). */
  skincareStepUnavailable: string
  skincareKeyIngredients: string
  skincareAvoidWith: string
  skincareRegions: string
  skincareNote: string
  skincareSources: string
  skincareRoutinesEmpty: string
  skincareGuideEmpty: string
  skincareTipsEmpty: string
  skincareLoadFailed: string
  skincareDisclaimer: string
}

export const skincareEn: SkincareDictionary = {
  skincareTitle: 'Skin and nail care',
  skincareIntro:
    'Routines, a guide to product types and practical tips for men and women, by skin type and concern, in the European, American, Korean and Japanese styles — plus nails. Generic product types, never brands.',
  skincareFilters: 'Filters',
  skincareAreaLabel: 'Area',
  skincareArea: { face: 'Face', nails: 'Nails' },
  skincareAudienceLabel: 'For',
  skincareAudience: { men: 'Men', women: 'Women', all: 'Everyone' },
  skincareSkinTypeLabel: 'Skin type',
  skincareSkinType: {
    normal: 'Normal',
    dry: 'Dry',
    oily: 'Oily',
    combination: 'Combination',
    sensitive: 'Sensitive',
    all: 'All skin types',
  },
  skincareConcernLabel: 'Concern',
  skincareAnyConcern: 'All concerns',
  skincareConcern: {
    acne: 'Acne and spots',
    aging: 'Fine lines and ageing',
    hydration: 'Hydration',
    sun: 'Sun protection',
    pigmentation: 'Dark spots',
    redness: 'Redness and sensitivity',
    shaving: 'Shaving',
    beard: 'Beard',
    pores: 'Pores',
    texture: 'Texture',
    nails: 'Nails',
    hands: 'Hands',
    general: 'General care',
  },
  skincareRegionLabel: 'Routine style',
  skincareRegionLabelNails: 'Nail-care style',
  skincareAnyRegion: 'All styles',
  skincareRegion: {
    eu: 'European',
    us: 'American',
    kr: 'Korean',
    jp: 'Japanese',
    global: 'Worldwide',
  },
  skincareTime: { am: 'Morning', pm: 'Evening', weekly: 'Weekly' },
  skincareStepTime: { am: 'Morning', pm: 'Evening', both: 'Morning and evening' },
  skincareCategory: {
    cleanser: 'Cleanser',
    toner: 'Toner',
    essence: 'Essence',
    serum: 'Serum',
    moisturizer: 'Moisturiser',
    sunscreen: 'Sunscreen',
    exfoliant: 'Exfoliant',
    mask: 'Mask',
    eye: 'Eye care',
    treatment: 'Treatment',
    shaving: 'Shaving',
    beard: 'Beard care',
    lip: 'Lip care',
    cuticle_oil: 'Cuticle oil',
    nail_treatment: 'Nail treatment',
    hand_cream: 'Hand cream',
    base_coat: 'Base coat',
    nail_file: 'Nail file',
    nail_remover: 'Polish remover',
  },
  skincarePriceBand: { low: 'Budget', mid: 'Mid-range', high: 'Premium' },
  skincareRoutinesHeading: 'Routines',
  skincareRoutinesCount: { one: '{n} routine', other: '{n} routines' },
  skincareGuideHeading: 'Product guide',
  skincareGuideCount: { one: '{n} product type', other: '{n} product types' },
  skincareTipsHeading: 'Tips',
  skincareTipsCount: { one: '{n} tip', other: '{n} tips' },
  skincareShowSteps: 'Show steps',
  skincareHideSteps: 'Hide steps',
  skincareSteps: 'Steps',
  skincareOptionalStep: 'optional',
  skincareStepUnavailable: 'This product type is not available yet',
  skincareKeyIngredients: 'Key ingredients',
  skincareAvoidWith: 'Do not combine with',
  skincareRegions: 'Typical in',
  skincareNote: 'Good to know',
  skincareSources: 'Sources',
  skincareRoutinesEmpty: 'No routine matches these filters yet.',
  skincareGuideEmpty: 'No product type matches these filters.',
  skincareTipsEmpty: 'No tip matches these filters.',
  skincareLoadFailed:
    'The skincare content could not be loaded. Check your connection and try again.',
  skincareDisclaimer:
    'This is general information about skin and nail care, not dermatological advice. For anything persistent, painful or spreading, see a dermatologist.',
}

export const skincareEl: SkincareDictionary = {
  skincareTitle: 'Περιποίηση δέρματος και νυχιών',
  skincareIntro:
    'Ρουτίνες, οδηγός για τύπους προϊόντων και πρακτικές συμβουλές για άντρες και γυναίκες, ανά τύπο επιδερμίδας και ανάγκη, σε ευρωπαϊκό, αμερικανικό, κορεατικό και ιαπωνικό στιλ — και για τα νύχια. Γενικοί τύποι προϊόντων, ποτέ μάρκες.',
  skincareFilters: 'Φίλτρα',
  skincareAreaLabel: 'Περιοχή',
  skincareArea: { face: 'Πρόσωπο', nails: 'Νύχια' },
  skincareAudienceLabel: 'Για',
  skincareAudience: { men: 'Άντρες', women: 'Γυναίκες', all: 'Όλους' },
  skincareSkinTypeLabel: 'Τύπος επιδερμίδας',
  skincareSkinType: {
    normal: 'Κανονική',
    dry: 'Ξηρή',
    oily: 'Λιπαρή',
    combination: 'Μικτή',
    sensitive: 'Ευαίσθητη',
    all: 'Όλοι οι τύποι',
  },
  skincareConcernLabel: 'Ανάγκη',
  skincareAnyConcern: 'Όλες οι ανάγκες',
  skincareConcern: {
    acne: 'Ακμή και σπυράκια',
    aging: 'Λεπτές γραμμές και γήρανση',
    hydration: 'Ενυδάτωση',
    sun: 'Αντηλιακή προστασία',
    pigmentation: 'Πανάδες και κηλίδες',
    redness: 'Ερυθρότητα και ευαισθησία',
    shaving: 'Ξύρισμα',
    beard: 'Γένια',
    pores: 'Πόροι',
    texture: 'Υφή',
    nails: 'Νύχια',
    hands: 'Χέρια',
    general: 'Γενική φροντίδα',
  },
  skincareRegionLabel: 'Στιλ ρουτίνας',
  skincareRegionLabelNails: 'Στιλ περιποίησης νυχιών',
  skincareAnyRegion: 'Όλα τα στιλ',
  skincareRegion: {
    eu: 'Ευρωπαϊκό',
    us: 'Αμερικανικό',
    kr: 'Κορεατικό',
    jp: 'Ιαπωνικό',
    global: 'Παντού',
  },
  skincareTime: { am: 'Πρωί', pm: 'Βράδυ', weekly: 'Εβδομαδιαία' },
  skincareStepTime: { am: 'Πρωί', pm: 'Βράδυ', both: 'Πρωί και βράδυ' },
  skincareCategory: {
    cleanser: 'Καθαριστικό',
    toner: 'Τόνερ',
    essence: 'Essence',
    serum: 'Ορός',
    moisturizer: 'Ενυδατική',
    sunscreen: 'Αντηλιακό',
    exfoliant: 'Απολέπιση',
    mask: 'Μάσκα',
    eye: 'Φροντίδα ματιών',
    treatment: 'Θεραπεία',
    shaving: 'Ξύρισμα',
    beard: 'Φροντίδα γενειάδας',
    lip: 'Φροντίδα χειλιών',
    cuticle_oil: 'Λάδι επωνυχίων',
    nail_treatment: 'Θεραπεία νυχιών',
    hand_cream: 'Κρέμα χεριών',
    base_coat: 'Βάση νυχιών',
    nail_file: 'Λίμα νυχιών',
    nail_remover: 'Ασετόν και αφαιρετικά',
  },
  skincarePriceBand: { low: 'Οικονομικό', mid: 'Μεσαίας τιμής', high: 'Ακριβό' },
  skincareRoutinesHeading: 'Ρουτίνες',
  skincareRoutinesCount: { one: '{n} ρουτίνα', other: '{n} ρουτίνες' },
  skincareGuideHeading: 'Οδηγός προϊόντων',
  skincareGuideCount: { one: '{n} τύπος προϊόντος', other: '{n} τύποι προϊόντων' },
  skincareTipsHeading: 'Συμβουλές',
  skincareTipsCount: { one: '{n} συμβουλή', other: '{n} συμβουλές' },
  skincareShowSteps: 'Δες τα βήματα',
  skincareHideSteps: 'Κρύψε τα βήματα',
  skincareSteps: 'Βήματα',
  skincareOptionalStep: 'προαιρετικό',
  skincareStepUnavailable: 'Αυτός ο τύπος προϊόντος δεν είναι διαθέσιμος ακόμη',
  skincareKeyIngredients: 'Βασικά συστατικά',
  skincareAvoidWith: 'Μην το συνδυάζεις με',
  skincareRegions: 'Συνηθίζεται σε',
  skincareNote: 'Καλό να ξέρεις',
  skincareSources: 'Πηγές',
  skincareRoutinesEmpty: 'Καμία ρουτίνα δεν ταιριάζει με αυτά τα φίλτρα ακόμη.',
  skincareGuideEmpty: 'Κανένας τύπος προϊόντος δεν ταιριάζει με αυτά τα φίλτρα.',
  skincareTipsEmpty: 'Καμία συμβουλή δεν ταιριάζει με αυτά τα φίλτρα.',
  skincareLoadFailed:
    'Το περιεχόμενο περιποίησης δεν φορτώθηκε. Έλεγξε τη σύνδεσή σου και δοκίμασε ξανά.',
  skincareDisclaimer:
    'Πρόκειται για γενικές πληροφορίες περιποίησης δέρματος και νυχιών, όχι για δερματολογικές συμβουλές. Για οτιδήποτε επίμονο, επώδυνο ή που εξαπλώνεται, επισκέψου δερματολόγο.',
}

/** Both literals, for `useLang(skincareCopy)` on the `/skincare` route. */
export const skincareCopy: FeatureCopy<SkincareDictionary> = { el: skincareEl, en: skincareEn }
