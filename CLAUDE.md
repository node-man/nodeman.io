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
