# Hygieia · Υγίεια

A bilingual (Greek / English) health, diet, recipe and workout tool.

Named for Hygieia, the Greek goddess of health and preventive wellbeing, whose name gave English the
word "hygiene". Fleet product of `intotheveil`; the product name is Hygieia, the repo is `hygieia`.

**Live:** https://intotheveil.github.io/hygieia/ (GitHub Pages, deployed from `main` by CI).

## What it will do

- **Health tips** — short, sourced everyday guidance.
- **Diets and meal plans** — what each diet is (Mediterranean, Atkins, paleo, low-carb, keto,
  carnivore, …) and weekly plans built on it.
- **Recipes** tagged by diet, plus **"What's in my fridge?"** — meals you can make from the
  ingredients you already have.
- **Meal cost** and **calories / macros** estimates per recipe.
- **Workouts** — home, gym or calisthenics; beginner / intermediate / advanced; three intensities.

The current build is the foundation (P0): the bilingual shell, the module map and the toolchain.
No module holds content yet, and the page says so.

## Stack

React 19 · Vite 8 · TypeScript (strict) · Tailwind 4 · Vitest + Testing Library · ESLint + Prettier.
Supabase client wired but no project yet (`DECISIONS.md` ADR-0001). Hosting: GitHub Pages.

## Commands

```
npm install
npm run dev          # local dev server
npm run lint         # eslint
npm run typecheck    # tsc -b
npm test             # vitest
npm run build        # tsc -b && vite build → dist/
```

## Working here

Read `BRAIN.md` first, every session (`.claude/CLAUDE.md` §0). Env var NAMES only in tracked
files; `.env.example` lists them. Never commit a value.
