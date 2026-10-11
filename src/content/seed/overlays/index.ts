// THE OVERLAY LIST — every overlay module, in order (see ./types.ts). Adding an overlay = a new
// `NNNN-<name>.ts` in this directory exporting `OVERLAY`, plus ONE line below, then `npm run
// seed:gen` (writes its migration). The generator refuses a module in this directory that is not
// listed here, or a list out of NNNN order. Never edit or remove a shipped overlay: like the
// migration it generated, it is applied live — correct it with a NEW overlay.
//
// This module is what the bundled source imports lazily (one small chunk), so it also re-exports
// `overlayTable`: the applier ships with the overlays and costs the entry chunk nothing.

import { OVERLAY as O0001 } from './0001-fix-typos.ts'
import { OVERLAY as O0002 } from './0002-tip-sources.ts'
import { OVERLAY as O0003 } from './0003-greek-kitchen.ts'
import { OVERLAY as O0004 } from './0004-prices-nutrition.ts'
import { OVERLAY as O0005 } from './0005-recipe-photos.ts'
import { OVERLAY as O0006 } from './0006-thin-diets.ts'
import { OVERLAY as O0007 } from './0007-breakfast-snacks-world.ts'
import { OVERLAY as O0008 } from './0008-recipe-photos-2.ts'
import { OVERLAY as O0009 } from './0009-crepes.ts'
import { OVERLAY as O0010 } from './0010-recipe-photos-3.ts'
import { OVERLAY as O0011 } from './0011-skincare-more.ts'
import { OVERLAY as O0012 } from './0012-fix-aad-links.ts'
import type { Overlay } from './types.ts'

export const OVERLAYS: readonly Overlay[] = [
  O0001,
  O0002,
  O0003,
  O0004,
  O0005,
  O0006,
  O0007,
  O0008,
  O0009,
  O0010,
  O0011,
  O0012,
]

export { applyOverlays, overlayTable } from './apply.ts'
