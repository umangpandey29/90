# AGENTS.md

## What this repo is

Monorepo for **Final Comeback** (formerly "Class 9: 90-Day Blueprint"), a React + Vite study tracker.

- The app that runs in the preview is `artifacts/class9-blueprint` — the root `npm run dev` script points Vite at `artifacts/class9-blueprint/vite.config.ts`.
- `artifacts/api-server` is an unused Express scaffold (health route only) and `artifacts/mockup-sandbox` is a design sandbox; neither is needed to run the app.
- Study-plan content lives in `artifacts/class9-blueprint/src/lib/blueprint.ts` (single source of truth for all 90 days).

## Running it here

- `docker compose -f docker-compose.base44.yml up -d --build` — one `web` service on host port 3000 (`node:22`, repo bind-mounted at `/app`, `npm install` into a named `node_modules` volume, then `npm run dev`).
- Dependencies are installed at container start (no lockfile is used by npm; `bun.lock` belongs to the original Replit workspace). First boot needs a couple of minutes.
- The dev server binds `0.0.0.0` and `allowedHosts: true` is already set in the Vite config, so the preview host works unchanged.
- `CHOKIDAR_USEPOLLING=1` is set in compose so file changes hot-reload reliably through the bind mount.

## Verification notes

- The tracker UI is gated behind Firebase Google sign-in (`src/lib/firebase.ts`, config in `src/lib/firebase-applet-config.json`). An anonymous visitor gets the public landing page; the sign-in popup cannot be completed from automation.
- Progress is stored in `localStorage` and mirrored to Firestore when a user is signed in.
