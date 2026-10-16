# CLAUDE.md

Personal homepage (`nodeman.io`) — single-page portfolio, terminal/galaxy theme.

## Stack
- Next.js 16 (App Router) + React 19 + TypeScript, statically exported (`output: "export"` → `./out`).
- Tailwind v4 + custom CSS in `src/app/globals.css` (design tokens + `.nm-*` classes).
- Fonts via `next/font` exposed as CSS vars (`--font-space-grotesk`, `--font-jetbrains-mono`).

## Commands
- `npm run dev` / `npm run build` / `npm run lint` — build emits static files to `./out`.

## Architecture
- `src/app/page.tsx` is one `"use client"` component; interactions (galaxy canvas, boot, clock, typing, parallax, reveal, timeline) live in a single `useEffect` operating on a root `ref`, with full timer/listener/RAF cleanup.

## Gotchas
- Static export: any client component using `useSearchParams` (e.g. `GoogleAnalytics`) MUST be wrapped in `<Suspense>`, or `npm run build` fails prerendering `/_not-found`.
- `next-env.d.ts` flips between `.next/dev/...` and `.next/types/...` paths across dev/build runs — don't commit that churn.
- GA: set `NEXT_PUBLIC_GA_MEASUREMENT_ID`; CI injects it from the GitHub Actions repo variable.

## Deploy
- Push to `main` → GitHub Actions builds and deploys to GitHub Pages (also `workflow_dispatch`). This repo commits directly to `main`.

## Tech Radar (`/radar`)
- AI-written daily brief published with no human review. Data in `content/radar/` (`issues/<date>.json`, `ledger.json`, `raw/<date>.json`); format in `src/lib/radar/types.ts`; renderers in `src/app/radar/_components/blocks.tsx`.
- Raw inputs come only from `.github/workflows/radar-collect.yml` (`scripts/radar/collect.mjs`, ~06:40 KST, or on demand by pushing `content/radar/requests/latest.txt`). Sandboxed sessions cannot fetch github.com/trending directly, and WebFetch copies can be stale — never take numbers from them.
- `scripts/radar/validate.mjs` gates every deploy: numbers must match raw, raw must be fresh, excluded topics and conflict-of-interest rules are enforced.
- Daily procedure: `docs/radar/routine.md`. Local check: `npm run radar:check` (offline build via `next build --webpack` with mocked Google Fonts).
- Magazine layout: each issue renders as cover (blue) → 차례 → one sheet per section (running head + folio) → colophon; light with a prefers-color-scheme dark variant. Styles in `src/app/radar/radar.css`.
- Issue pages are `noindex`; index, ledger and about pages are indexable.
