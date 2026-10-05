// SITE HEADER (P3.5): the one `<header>` (banner landmark) every route shares, rendered by
// Layout. Brand link home · primary nav (Recipes · Fridge · Diets · Workouts · Tips) · AccountMenu
// · LangSwitch. `NavLink` sets `aria-current="page"` on the active item; the match is by prefix,
// so `/recipes/<slug>` keeps "Recipes" current. On narrow screens the nav wraps onto its own row of
// chips (`order-last w-full` below `lg`); no disclosure, nothing hidden. Every label is a
// dictionary value (`t.nav.*`); the brand name is the one string that is the same in both
// languages on purpose (it IS the bilingual name).

import { Link, NavLink } from 'react-router-dom'
import { NAV_IDS, type NavId } from '../i18n/dictionary'
import { useLang } from '../i18n/LangProvider'
import { AccountMenu } from './AccountMenu'

const NAV_PATHS: Record<NavId, string> = {
  recipes: '/recipes',
  fridge: '/fridge',
  diets: '/diets',
  workouts: '/workouts',
  tips: '/tips',
}

const PILL =
  'rounded-full border border-olive-900/20 bg-paper-50/70 px-4 py-1.5 text-sm font-medium text-olive-900 shadow-sm backdrop-blur hover:border-olive-900/40 hover:bg-paper-50'

const NAV_ON = 'rounded-full bg-olive-900 px-3.5 py-1.5 text-sm font-medium text-paper-50'
const NAV_OFF =
  'rounded-full px-3.5 py-1.5 text-sm font-medium text-olive-900 hover:bg-paper-200/70 hover:text-olive-950'

export function LangSwitch() {
  const { t, toggle } = useLang()
  return (
    <button type="button" onClick={toggle} className={PILL}>
      {t.switchTo}
    </button>
  )
}

export function SiteHeader() {
  const { t } = useLang()
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-5">
      <Link to="/" className="flex items-baseline gap-2">
        <span className="font-display text-2xl font-bold tracking-tight text-olive-950">
          Hygieia
        </span>
        <span className="font-display text-lg text-sage-700">· Υγίεια</span>
      </Link>

      <nav
        aria-label={t.nav.label}
        className="order-last flex w-full flex-wrap gap-1 lg:order-none lg:w-auto"
      >
        {NAV_IDS.map((id) => (
          <NavLink
            key={id}
            to={NAV_PATHS[id]}
            className={({ isActive }) => (isActive ? NAV_ON : NAV_OFF)}
          >
            {t.nav[id]}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <AccountMenu />
        <LangSwitch />
      </div>
    </header>
  )
}
