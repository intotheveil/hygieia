// SAVE BUTTON (P8.2): "save this workout / routine / tip / diet" on a content card, the way the
// recipe page's favourite button saves a recipe — `aria-pressed` toggle, optimistic, with an
// inline alert when the write fails. Two differences, both deliberate:
//
// - HIDDEN when user data is disabled (local-only build or no session). A card list has many
//   buttons; a row of "sign in to save" notes would drown the content, and the recipe page already
//   explains the rule once. The gates (Lighthouse, a11y matrix) audit the local-only build, so the
//   cards there are byte-identical to before P8.2.
// - ONE list read per page, not per button: pages wrap their cards in `<SavedItemsScope>`, which
//   loads `listSavedItems()` once and shares it. A button rendered outside a scope loads its own
//   list (fine for a single button, as on a detail page).
//
// `itemId` is the content row's `id` (uuid) — the per-user table stores ids, never copies.

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useLang } from '../i18n/LangProvider'
import { useAsyncResult } from '../lib/useAsync'
import type { Result, SavedItem, SavedItemKind, UserDataSource } from '../user/source'
import { useUserData } from '../user/useUserData'

interface Scope {
  enabled: boolean
  /** `null` until the list has loaded (or when it failed). */
  items: readonly SavedItem[] | null
  toggle(kind: SavedItemKind, itemId: string): Promise<Result<void>>
}

const ScopeContext = createContext<Scope | null>(null)

const isSame = (a: SavedItem, kind: SavedItemKind, itemId: string) =>
  a.kind === kind && a.item_id === itemId

/** The shared saved-items list for every `SaveButton` below it. */
function useSavedItemsScope(user: UserDataSource, active: boolean): Scope {
  // `active` is false for a button inside a scope: hooks must run, but it must not load a list.
  const enabled = active && user.kind !== 'disabled'
  const list = useCallback(
    () =>
      enabled
        ? user.listSavedItems()
        : Promise.resolve<Result<SavedItem[]>>({ ok: true, data: [] }),
    [user, enabled],
  )
  const state = useAsyncResult(list)
  const loaded = state.status === 'ready' ? state.data : null
  // Optimistic overlay keyed on the loaded array: a reload replaces it, a write patches it.
  const [overlay, setOverlay] = useState<{ base: readonly SavedItem[]; items: SavedItem[] } | null>(
    null,
  )
  const items = loaded === null ? null : overlay?.base === loaded ? overlay.items : loaded

  const toggle = useCallback(
    async (kind: SavedItemKind, itemId: string): Promise<Result<void>> => {
      if (!enabled || loaded === null) return { ok: false, error: 'disabled' }
      const current = overlay?.base === loaded ? overlay.items : [...loaded]
      const saved = current.some((item) => isSame(item, kind, itemId))
      const optimistic = saved
        ? current.filter((item) => !isSame(item, kind, itemId))
        : [{ kind, item_id: itemId, created_at: new Date().toISOString() }, ...current]
      setOverlay({ base: loaded, items: optimistic })
      const result = saved ? await user.unsaveItem(kind, itemId) : await user.saveItem(kind, itemId)
      if (!result.ok) {
        setOverlay({ base: loaded, items: current })
        return result
      }
      return { ok: true, data: undefined }
    },
    [enabled, loaded, overlay, user],
  )

  return useMemo(() => ({ enabled, items, toggle }), [enabled, items, toggle])
}

export function SavedItemsScope({
  children,
  source,
}: {
  children: ReactNode
  /** Injectable for tests; the app passes nothing. */
  source?: UserDataSource
}) {
  const fromHook = useUserData()
  const user = source ?? fromHook
  const scope = useSavedItemsScope(user, true)
  return <ScopeContext.Provider value={scope}>{children}</ScopeContext.Provider>
}

export interface SaveButtonProps {
  kind: SavedItemKind
  itemId: string
  /** The item's name, for the accessible label (`Save: Morning routine`). */
  label: string
}

const BUTTON =
  'self-start rounded-full px-4 py-1.5 text-sm font-medium transition disabled:opacity-60'

export function SaveButton({ kind, itemId, label }: SaveButtonProps) {
  const fromContext = useContext(ScopeContext)
  const user = useUserData()
  const own = useSavedItemsScope(user, fromContext === null)
  const scope = fromContext ?? own
  const { t } = useLang()
  const [outcome, setOutcome] = useState<'idle' | 'busy' | 'failed'>('idle')

  if (!scope.enabled) return null

  const saved = scope.items?.some((item) => isSame(item, kind, itemId)) ?? false

  async function onClick(): Promise<void> {
    setOutcome('busy')
    const result = await scope.toggle(kind, itemId)
    setOutcome(result.ok ? 'idle' : 'failed')
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        aria-pressed={saved}
        aria-busy={outcome === 'busy'}
        aria-label={`${saved ? t.saveItemRemove : t.saveItemAdd}: ${label}`}
        disabled={scope.items === null}
        onClick={() => void onClick()}
        className={`${BUTTON} ${
          saved
            ? 'bg-olive-900 text-paper-50 hover:bg-olive-700'
            : 'border border-olive-900/20 bg-paper-50/70 text-olive-900 hover:bg-paper-50'
        }`}
      >
        {saved ? t.saveItemRemove : t.saveItemAdd}
      </button>
      {outcome === 'failed' && (
        <p role="alert" className="text-sm text-clay-700">
          {t.saveItemFailed}
        </p>
      )}
    </div>
  )
}
