# Syed Sarfaraz Ahmed — AI product portfolio

Live: https://sarfaraz27.vercel.app

Static site, no build step. Every push to `main` deploys to production on Vercel.

## Structure
- `index.html` — homepage: intro, grid of AI products, approach, experience, contact
- `work/*.html` — one case study per product (Cite, Nabat Plot Monitor, Signal, Tone Coach, Ledger)
- `assets/site.css` — shared styles (light and dark mode)
- `nabat/index.html` — the Nabat Plot Monitor dashboard (self-contained HTML/CSS/JS). Served at `/nabat`
- `vercel.json` — clean URLs (e.g. `/work/cite`)

> **Nabat uses illustrative data.** Every value is simulated to demonstrate the interface and scoring method.
