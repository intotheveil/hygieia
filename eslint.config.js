import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

// --- THE SERVER/CLIENT SECRET BOUNDARY (carried from Themis) -----------------------------------
// Hygieia is a static site: everything under src/** ends up in the public bundle, and Vite inlines
// `import.meta.env.X` at build time. Server-only secrets belong in Edge Functions
// (supabase/functions/**) or scripts (scripts/**), never in src/**.
const SERVER_SECRET =
  '/^(HYGIEIA_)?(ANTHROPIC_API_KEY|OPENAI_API_KEY)$|^SUPABASE_SERVICE_ROLE_KEY$|^SUPABASE_ACCESS_TOKEN$/'
// Any VITE_ name except the allow-list: the Supabase URL + anon key, the Google sign-in flag
// (VITE_AUTH_GOOGLE, src/lib/env.ts) and the fleet-telemetry names.
const VITE_NOT_ALLOWED =
  '/^VITE_(?!(SUPABASE_URL|SUPABASE_ANON_KEY|AUTH_GOOGLE)$|FLEET_[A-Z0-9_]+$)/'

const META_ENV =
  "[object.type='MemberExpression'][object.object.type='MetaProperty'][object.property.name='env']"
const PROCESS_ENV =
  "[object.type='MemberExpression'][object.object.name='process'][object.property.name='env']"

const SECRET_MSG =
  'Server-only secret in browser code. Vite inlines env reads into the public bundle. This name belongs in supabase/functions/** or scripts/**, never in src/**.'
const VITE_MSG =
  'VITE_ name outside the allow-list. Every VITE_ var is inlined into the public bundle. Browser code may read only VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_AUTH_GOOGLE and VITE_FLEET_*.'

/** @param {string} name regex literal for the env var name  @param {string} message */
const envReads = (name, message) =>
  [META_ENV, PROCESS_ENV].flatMap((obj) => [
    {
      selector: `MemberExpression${obj}[computed=false] > Identifier.property[name=${name}]`,
      message,
    },
    {
      selector: `MemberExpression${obj}[computed=true] > Literal.property[value=${name}]`,
      message,
    },
  ])

/** const { X } = import.meta.env / process.env */
const envDestructures = (name, message) => [
  {
    selector: `VariableDeclarator[init.type='MemberExpression'][init.object.type='MetaProperty'][init.property.name='env'] > ObjectPattern > Property > Identifier.key[name=${name}]`,
    message,
  },
  {
    selector: `VariableDeclarator[init.type='MemberExpression'][init.object.name='process'][init.property.name='env'] > ObjectPattern > Property > Identifier.key[name=${name}]`,
    message,
  },
]

export default tseslint.config(
  { ignores: ['dist', 'coverage', '.claude'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2023, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    // Browser code only. supabase/functions/** and scripts/** are deliberately outside `files`:
    // that is where server-side names are legitimately read.
    files: ['src/**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...envReads(SERVER_SECRET, SECRET_MSG),
        ...envDestructures(SERVER_SECRET, SECRET_MSG),
        ...envReads(VITE_NOT_ALLOWED, VITE_MSG),
        ...envDestructures(VITE_NOT_ALLOWED, VITE_MSG),
      ],
    },
  },
  {
    // THE EAGER-CHUNK BOUNDARY FOR COPY (perf, 2026-10-06; src/i18n/app.ts). App code reads the APP
    // dictionary (`i18n/app`) and merges a route feature with `useLang(<feature>Copy)`. The FULL
    // dictionary (`i18n/dictionary`) and the route-feature composition (`features/routeFeatures`)
    // import every route feature's strings; one static import of either from app code puts them all
    // back into the chunk every page downloads before its first paint (11 kB gzip, measured: CI
    // Lighthouse diet 84). Tests and e2e use the full dictionary freely.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/i18n/dictionary.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex:
                '(^|/)i18n/dictionary(\\.ts)?$|^\\.{1,2}/dictionary(\\.ts)?$|(^|/)routeFeatures(\\.ts)?$',
              message:
                'App code imports the app dictionary from i18n/app (route features via useLang(<feature>Copy)); the full dictionary is for tests and e2e only.',
            },
          ],
        },
      ],
    },
  },
)
