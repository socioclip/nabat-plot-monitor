# Syed Sarfaraz Ahmed — AI product portfolio

Live: https://sarfaraz27.vercel.app

Static site, no build step. Every push to `main` deploys to production on Vercel.

## Structure
- `index.html` — homepage: intro, grid of AI products, approach, experience, contact
- `work/*.html` — one case study per product (Cite, Geospatial Plant Monitor, Signal, Tone Coach, Ledger)
- `assets/site.css` — shared styles (light and dark mode)
- `plant-monitor/index.html` — the Geospatial Plant Monitor dashboard (self-contained HTML/CSS/JS). Served at `/plant-monitor` (old `/nabat` links redirect)
- `vercel.json` — clean URLs (e.g. `/work/cite`)

> **The plant monitor uses illustrative data.** Every value is simulated to demonstrate the interface and scoring method.
