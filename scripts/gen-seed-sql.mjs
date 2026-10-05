// THE SEED GENERATOR — `npm run seed:gen` and `npm run seed:check` (PLAN.md P1.12)
//
// P1.1 reserves both npm scripts so the `G1` gate (`… && npm run seed:check`) can name them from
// day one. The real generator (TS seed modules → deterministic seed migrations, `--check`
// regenerating and diffing byte-for-byte against the committed files) lands in P1.12 and REPLACES
// this file. Until then: a no-op that says so.
//
// Exit 0 on purpose: a reserved-but-unimplemented step must not turn the pipeline red.

const mode = process.argv.includes('--check') ? 'seed:check' : 'seed:gen'
console.log(`${mode} — not implemented yet (P1.12)`)
process.exitCode = 0
