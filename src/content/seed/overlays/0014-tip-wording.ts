// OVERLAY 0014 — two base-seed skincare tips said more than their (0012) sources (2026-10-12):
//   * face-all-patch-test-every-new-product — "behind the ear": the AAD page names the underside of
//     the arm or the bend of the elbow, so the test spot follows it.
//   * nails-gel-and-acrylic-take-breaks — "sunscreen on your hands before the UV lamp" is not on the
//     AAD page; the clause is dropped (overlay 0011's `nails-gel-manicure-hand-sunscreen-or-gloves`
//     covers hand protection with its own source).
// Wording only; sources unchanged. Only one table is touched, so the by-table index imports this
// module whole.

import type { Overlay, SlugPatch } from './types.ts'

const SKINCARE_TIPS: readonly SlugPatch<'skincare_tips'>[] = [
  {
    slug: 'face-all-patch-test-every-new-product',
    set: {
      title_el:
        'Patch test σε κάθε νέο προϊόν — στο εσωτερικό του βραχίονα ή στην κλίση του αγκώνα',
      title_en: 'Patch test every new product — on the inner arm or the bend of the elbow',
      body_el:
        'Βάλε λίγο προϊόν σε ένα σημείο στο μέγεθος νομίσματος στο εσωτερικό του βραχίονα ή στην κλίση του αγκώνα, δύο φορές τη μέρα για 7–10 μέρες, και κοίτα για κοκκινίλα, φαγούρα ή πρήξιμο. Οι αλλεργίες επαφής αργούν να εμφανιστούν, γι’ αυτό μία μέρα δεν αρκεί. Ένα προϊόν τη φορά, αλλιώς δεν θα ξέρεις ποιο έφταιξε.',
      body_en:
        'Apply a little product to a coin-sized spot on the inner arm or the bend of the elbow, twice a day for 7–10 days, and watch for redness, itching or swelling. Contact allergies take time to show, so one day is not enough. One new product at a time, or you will not know which one was to blame.',
    },
  },
  {
    slug: 'nails-gel-and-acrylic-take-breaks',
    set: {
      body_el:
        'Το πρόβλημα με το ημιμόνιμο δεν είναι το προϊόν αλλά η αφαίρεση: το λιμάρισμα και το ξύσιμο λεπταίνουν την πλάκα κάθε φορά. Μετά από δύο-τρεις εφαρμογές άφησε τα νύχια γυμνά για δύο εβδομάδες με λάδι επωνυχίων κάθε βράδυ. Στο σαλόνι ζήτα αφαίρεση με μούλιασμα, όχι ξύσιμο.',
      body_en:
        'The problem with semi-permanent polish is not the product but the removal: filing and scraping thin the plate every time. After two or three applications leave the nails bare for two weeks with cuticle oil every night. At the salon ask for soak-off removal, not scraping.',
    },
  },
]

export const OVERLAY: Overlay = {
  id: '0014-tip-wording',
  summary:
    'two skincare tips aligned with their sources: patch-test spot (inner arm / elbow), no UV-lamp sunscreen claim',
  patches: { skincare_tips: SKINCARE_TIPS },
}
