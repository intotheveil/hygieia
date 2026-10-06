// THE OVERLAY LIST — every overlay module, in order (see ./types.ts). Adding an overlay = a new
// `NNNN-<name>.ts` in this directory exporting `OVERLAY`, plus ONE line below, then `npm run
// seed:gen` (writes its migration). The generator refuses a module in this directory that is not
// listed here, or a list out of NNNN order. Never edit or remove a shipped overlay: like the
// migration it generated, it is applied live — correct it with a NEW overlay.
//
// This module is what the bundled source imports lazily (one small chunk), so it also re-exports
// `overlayTable`: the applier ships with the overlays and costs the entry chunk nothing.

import { OVERLAY as O0001 } from './0001-fix-typos.ts'
import { OVERLAY as O0003 } from './0003-greek-kitchen.ts'
import type { Overlay } from './types.ts'

export const OVERLAYS: readonly Overlay[] = [O0001, O0003]

export { applyOverlays, overlayTable } from './apply.ts'
