// THEME DICTIONARY (operator request 2026-10-06) — the header's theme switcher, in both languages
// (ADR-0002 at feature scale). Composed into the app `Dictionary` by ./index.ts. `theme` is keyed
// by `Theme`, so a new theme without a label is a type error. "Gamer" is the same word in Greek
// gaming culture and stays Latin-script on purpose (allow-listed in dictionary.test.ts).

import type { Theme } from '../../theme/themes.ts'

export interface ThemeCopy extends Record<Theme, string> {
  /** `aria-label` of the theme `<select>`. */
  label: string
}

export interface ThemeDictionary {
  theme: ThemeCopy
  /**
   * The home hero picture follows the theme (src/App.tsx: one image set per theme, the three
   * non-default ones rendered on the operator's ComfyUI), so the `alt` must describe the picture
   * actually shown. The default theme keeps the base dictionary's `heroImageAlt` (the salmon plate).
   */
  themeHeroAlt: Record<Exclude<Theme, 'default'>, string>
}

export const themeEn: ThemeDictionary = {
  theme: {
    label: 'Theme',
    default: 'Kitchen',
    dark: 'Dark',
    athletic: 'Athletic',
    gamer: 'Gamer',
  },
  themeHeroAlt: {
    dark: 'Grilled salmon with roasted vegetables, herbs and lemon on a dark slate plate.',
    athletic:
      'Meal-prep box with grilled chicken, quinoa and broccoli, a jar of greens and blueberries, on a grey towel.',
    gamer:
      'Top-down view of a desk mat glowing green: a backlit keyboard, headphones, green apples and a bowl of almonds.',
  },
}

export const themeEl: ThemeDictionary = {
  theme: {
    label: 'Θέμα',
    default: 'Κουζίνα',
    dark: 'Σκοτεινό',
    athletic: 'Αθλητικό',
    gamer: 'Gamer',
  },
  themeHeroAlt: {
    dark: 'Ψητός σολομός με ψητά λαχανικά, μυρωδικά και λεμόνι σε σκούρο πιάτο από σχιστόλιθο.',
    athletic:
      'Δοχείο γεύματος με ψητό κοτόπουλο, κινόα και μπρόκολο, βάζο με πράσινα και μύρτιλα, πάνω σε γκρι πετσέτα.',
    gamer:
      'Κάτοψη γραφείου με πράσινο φωτισμό: φωτιζόμενο πληκτρολόγιο, ακουστικά, πράσινα μήλα και ένα μπολ αμύγδαλα.',
  },
}
