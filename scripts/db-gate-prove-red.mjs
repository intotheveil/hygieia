// PROVE THE GATE RED — `npm run db:gate:prove-red` (PLAN.md P1.14)
//
// P1.1 reserves the npm script so CI and the `G1+` gate can name it from day one. The real
// prove-red harness (sabotage copies of the archive, one per known-bad shape, each asserting the
// gate's exact FAIL line) lands in P1.14 and REPLACES this file. Until then: a no-op that says so.
//
// Exit 0 on purpose: a reserved-but-unimplemented step must not turn the pipeline red.

console.log('db:gate:prove-red — not implemented yet (P1.14)')
process.exitCode = 0
