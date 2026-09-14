# QuickSpend contributor guide

## Product

QuickSpend is a Slovak, mobile-first expense tracker. It is a client-only React/TypeScript PWA deployed at `https://zrebec.github.io/calc/`. Version `0.0.1` stores all data in the browser and has exactly three bottom-navigation views: New entry, monthly overview, and Export/Import.

Do not add a backend, authentication, cloud synchronization, category filters, or currencies other than EUR unless the user explicitly expands the scope. Do not modify or remove the user's untracked `zadanie.md`.

## Non-negotiable behavior

- A fresh load always opens New entry. Groceries is the default category and the amount field receives best-effort focus with a decimal mobile keyboard.
- Categories are dining, household, groceries, health, car, pets, entertainment, recurring, and other. UI copy is Slovak and formatting is `sk-SK`/EUR.
- Amounts are positive, accept `,` or `.`, have at most two decimal places, and are stored as integer cents. Notes are at most 64 UTF-16 characters. Date and time must round-trip to a valid local `Date`.
- Saving opens Overview. Overview defaults to the current month, shows its total, sorts newest first, and supports edit and confirmed delete.
- Persist the versioned envelope in the single localStorage key `quickspend:data:v1`. Never overwrite unreadable stored data.
- Export uses the `QuickSpendExportV1` JSON contract. Import is validate-first and atomic: one invalid record rejects the whole file. Match by UUID first, then by amount/category/date/time. An imported conflict wins. If fallback matching finds multiple local candidates, reject the import as ambiguous.
- Local records with otherwise identical values are allowed because UUID is their identity.
- The light/dark theme toggle is globally visible. Persist the explicit choice under `quickspend:theme`; when absent, use the system color-scheme preference.
- New entry uses an always-visible floating `✓ Hotovo` submit action above the bottom navigation. Editing keeps conventional dialog actions.
- Preserve iOS safe areas, avoid body overscroll, and keep touch targets at least 44 px.
- Keep package, web manifest, and service-worker cache versions aligned at `0.0.1` until intentionally releasing a new version.

## Commands and quality gate

Use npm and commit `package-lock.json`.

- `npm run dev` — development server
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript
- `npm test` — Vitest suite
- `npm run build` — production bundle in `dist`

Before handing off a change, run lint, typecheck, tests, and build. For UI/PWA changes also inspect the production output and, when available, manually test installed iOS Safari and Android Chrome behavior. CI must run the same checks and only deploy `dist` from `main` through the official GitHub Pages artifact workflow.

## Architecture

- UI components may not access localStorage directly. All persistence goes through the storage module.
- Keep parsing, validation, import normalization, and merge logic as pure functions so they remain unit-testable.
- Use native `Date`/`Intl`; do not add Moment.js.
- Do not introduce URL routing for the three tabs. Refresh must naturally reset to New entry, and avoiding routes keeps GitHub Pages fallback-free.
- Keep the original vector icon and generated PNG variants in `public`; the Apple touch icon must be explicitly linked from HTML.

## Acceptance checklist

Verify decimal parsing, all nine categories, theme fallback/persistence, the floating save action, validation boundaries, CRUD persistence, monthly totals, edit/delete, export round-trip, every merge branch, transactional rejection, corrupt-storage protection, `/calc/` asset paths, manifest and service-worker versioning, offline reload, update prompt, safe-area layout, and GitHub Pages build/deploy configuration.
