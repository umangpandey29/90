# AGENTS.md

## Project overview

pnpm workspace monorepo for "Class 9 90-Day Blueprint" — a client-side React app that helps students plan a 90-day study schedule. State persists to localStorage; no backend calls.

## Structure

- `artifacts/class9-blueprint` — **the main user-facing app** (Vite + React + wouter + Tailwind v4). Purely client-side (localStorage). This is what runs on port 3000.
- `artifacts/api-server` — Express 5 API server (port 5000). Currently only has `/api/healthz`. Depends on `@workspace/db` which requires `DATABASE_URL`. Not needed for the frontend to render.
- `artifacts/mockup-sandbox` — internal design/mockup tool, not part of the main app.
- `lib/db` — Drizzle ORM + PostgreSQL. Schema is currently empty (`export {}`).
- `lib/api-client-react`, `lib/api-zod`, `lib/api-spec` — generated API client and Zod schemas (Orval codegen from OpenAPI). Not used by the frontend at runtime.

## Running the app (Base44 dev environment)

```sh
docker compose -f docker-compose.base44.yml up -d
```

- Uses `node:22-bookworm` with the repo bind-mounted at `/app`.
- Installs pnpm 10 globally, then `pnpm install --frozen-lockfile`, then runs the Vite dev server for `@workspace/class9-blueprint`.
- Vite dev server listens on port 5173 inside the container, mapped to host port 3000.
- Live reload is active (Vite HMR).

## Required env vars for the frontend

- `PORT` — the Vite server port (set to 5173 in compose). **Required** by `vite.config.ts` (throws if missing).
- `BASE_PATH` — the Vite `base` path (set to `/` in compose). **Required** by `vite.config.ts` (throws if missing).
- `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` — passed through for Vite host allowlisting (the config also has `allowedHosts: true`).

## Key quirks

- **Do NOT set `REPL_ID`** — the vite config conditionally loads `@replit/vite-plugin-cartographer` and `@replit/vite-plugin-dev-banner` only when `REPL_ID` is defined. Without it, those plugins are skipped (which is what we want outside Replit).
- `@replit/vite-plugin-runtime-error-modal` is always loaded (top-level import in vite.config.ts).
- `pnpm-workspace.yaml` has `minimumReleaseAge: 1440` (1-day supply-chain defense). With `--frozen-lockfile` this doesn't block installs since resolution is skipped.
- The root `package.json` has a `preinstall` script that enforces pnpm usage (rejects npm/yarn).
- The `pnpm-workspace.yaml` overrides exclude all non-linux-x64 platform binaries (Replit is linux-x64 only).
- No external secrets or credentials are needed — the frontend is entirely client-side.

## Verification

```sh
curl -sf http://localhost:3000/         # should return HTML with Vite client
curl -sf http://localhost:3000/src/main.tsx  # should return transpiled source
docker compose -f docker-compose.base44.yml ps  # should show "healthy"
```
