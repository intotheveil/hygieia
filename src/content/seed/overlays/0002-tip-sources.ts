// OVERLAY 0002 — a real, checked source for every tip that shipped with `needs_source: true`
// (2026-10-06): 17 health tips and 26 skincare tips. Every URL below was opened on 2026-10-06 and
// read against the tip's claims. Where a tip said more than its source, the wording (EL + EN) was
// softened to what the source supports; where no reputable page supported the claim at all, the
// tip was rewritten into a claim one does (the title too, when the old title carried the claim).
// The slug → host → kept / softened / rewritten table is in BUILD_LOG.md (### SOURCES).
//
// Hosts used (all already on the seed allow-lists): sleepfoundation.org, nhs.uk, mayoclinic.org,
// cdc.gov, hsph.harvard.edu, nih.gov (newsinhealth, pmc.ncbi.nlm), aad.org, medlineplus.gov,
// fda.gov. Each patch sets ONLY editable columns: source_url / sources + needs_source, plus the
// title/body pair where the wording changed. Slugs cannot change; where a rewrite leaves a slug
// that no longer describes the tip, BUILD_LOG.md lists it for the lead.
//
// The patches live in ./0002-tip-sources/<table>.ts, one module per bundled table loader, so the
// tips page does not download the skincare patches and vice versa (perf, 2026-10-06 —
// ./by-table/ re-exports each table's slice). This module assembles the overlay the generator,
// the gate and the tests read.

import type { Overlay } from './types.ts'
import { HEALTH_TIPS } from './0002-tip-sources/health_tips.ts'
import { SKINCARE_TIPS } from './0002-tip-sources/skincare_tips.ts'

export const OVERLAY: Overlay = {
  id: '0002-tip-sources',
  summary:
    'real, checked sources for the 43 unsourced tips (17 health, 26 skincare); wording softened or rewritten to match',
  patches: {
    health_tips: HEALTH_TIPS,
    skincare_tips: SKINCARE_TIPS,
  },
}
