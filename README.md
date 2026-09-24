# Nabat Monitor

Field-triage dashboard for **mangrove restoration plots** (Jubail Mangrove Park, Abu Dhabi) and **irrigated farm crops** (date palm, greenhouse vegetables, fodder).

Live: https://nabat-plot-monitor.vercel.app

> **Illustrative data.** Every value is simulated to demonstrate the interface and the scoring method. Nothing is derived from real satellite imagery, sensors or farm records.

## What's inside
- `index.html` — the whole site: HTML, CSS and JavaScript in one self-contained file, no build step.
- **Mangrove plots** — each plot's vegetation index benchmarked against same-age plots; flags plots needing a field visit.
- **Farm crops** — weekly checks on canopy vigour, root-zone moisture, water delivered vs crop demand, heat stress and pest traps, with an action queue.
- **Method & limits** — scoring rules and what the measurements cannot tell you.

## Deploying
The repo is connected to Vercel (project `nabat-plot-monitor`): every push to `main` deploys to production automatically. To change the site, edit `index.html` on GitHub (pencil icon) and commit.
