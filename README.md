# nodeman.io

Nodeman's personal homepage — a single-page portfolio with a terminal / galaxy aesthetic.

A one-page site telling a 17-year technology journey (engineer → leader → founder → educator). Statically built with Next.js and deployed to GitHub Pages.

## ✨ Features

- **Galaxy canvas background** — spiral-galaxy particles with twinkling stars and shooting stars (Canvas 2D)
- **Boot sequence** — `NODEMAN` letter animation (once per session) and a chromatic glitch on the hero title
- **Live HUD** — KST clock, mouse coordinates, corner registration marks
- **Self-typing terminal** — `whoami` / `mission.txt` / `ready_`
- **Interactions** — mouse-tracking glow, parallax grid, scroll-reveal animations
- **Content sections** — Hero · About (count-up stats) · Roles · Journey (scroll-progress timeline) · AI · Contact
- Bilingual (KO/EN) copy, responsive layout, `prefers-reduced-motion` support

## 🛠 Tech Stack

| Area | Technology |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org/) (App Router, static export) |
| Language | TypeScript, React 19 |
| Styling | Tailwind CSS v4 + custom CSS (`globals.css`) |
| Fonts | Space Grotesk, JetBrains Mono (`next/font`) |
| Analytics | Google Analytics 4 |
| Deployment | GitHub Pages (GitHub Actions) |

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start the dev server (http://localhost:3000)
npm run dev

# Production build (static files are emitted to ./out)
npm run build

# Lint
npm run lint
```

## 📁 Project Structure

```
src/
├─ app/
│  ├─ layout.tsx      # Root layout, fonts, GA integration
│  ├─ page.tsx        # Full page + interaction scripts (single client component)
│  └─ globals.css     # Design tokens, keyframes, .nm-* component classes
├─ components/
│  └─ GoogleAnalytics.tsx
└─ lib/
   └─ constants.ts    # Content data
```

## ⚙️ Environment Variables

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 measurement ID (`G-XXXXXXXXXX`). GA is disabled when unset. |

Locally it is read from `.env.local`; in CI it is injected via the GitHub Actions variable `vars.NEXT_PUBLIC_GA_MEASUREMENT_ID`.

## 📦 Deployment

Pushing to the `main` branch triggers the GitHub Actions workflow in [`.github/workflows`](.github/workflows), which builds the site (`npm run build` → `./out`) and deploys it to GitHub Pages. Manual deploys are also available via the workflow's `workflow_dispatch`.

## 🎨 Design

The UI is a Next.js implementation of the `Nodeman.dc.html` design created in [Claude Design](https://claude.ai/design).
