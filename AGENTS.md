# Agent notes

## Layout / install

- The repo was originally a pnpm workspace (`pnpm-workspace.yaml`, `pnpm-lock.yaml`,
  `catalog:` specs). Commit `b2061c2d` flattened it: the **root `package.json`** now owns
  every web dependency and **`bun.lock`** is the only lockfile. The artifact's own
  `artifacts/class9-blueprint/package.json` still lists the same deps but is not
  installed independently — always install from the repo root.
- Because the workspace is gone, `pnpm --filter @workspace/...` commands fail. The
  artifact run/build commands in `artifacts/class9-blueprint/.replit-artifact/artifact.toml`
  now use the root `npm run dev` / `npm run build`.
- `artifacts/mockup-sandbox/package.json` still contains `catalog:` specs. A root-level
  `pnpm install` fails on it; use bun/npm at the root instead.
- `artifacts/api-server` (Express + Drizzle, needs `DATABASE_URL`) and `lib/*` are not
  used by the web app — the frontend talks to Firebase directly. Don't boot them just
  to preview.

## Running it

- `docker-compose.base44.yml` runs one `web` service (`oven/bun:1`) that installs with
  `bun install --frozen-lockfile` into a named `node_modules` volume and runs the Vite
  dev server from the bind-mounted source on host port 3000.
- Vite config: `PORT` (default 3000) and `BASE_PATH` (default `/`) — no longer required
  env vars. `server.allowedHosts` is `true`, so the preview proxy host is accepted as-is.
- Checks inside the running service:
  - `docker compose -f docker-compose.base44.yml exec -T web bun run typecheck`
  - `docker compose -f docker-compose.base44.yml exec -T web bun run build`

## Verifying the UI

- Firebase config is committed and real, and the router gates **all** tracker routes
  behind Google auth: while signed out, every path renders `LandingPage` (`/login` renders
  `LoginPage`). Navigating to `/journey`, `/today`, etc. as an anonymous visitor is
  expected to show the landing page — that is not a missing route.
- The tracker screens (`/`, `/journey`, `/schedule`, `/backlog`, `/analytics`, ...) can
  only be checked with a signed-in Google session; automation can't complete the popup.
- Ad slots are placeholders: no AdSense loader script is included in `index.html`, so the
  `adsbygoogle` push in `AdSlots.tsx` never runs (no `adClient`/`adSlotId` is passed).
