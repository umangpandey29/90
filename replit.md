# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `npm run dev` — run the class9-blueprint web app (port 3000, `PORT` overrides)
- `npm run build` — production build to `artifacts/class9-blueprint/dist/public`
- `npm run typecheck` — typecheck the web app
- Required env: none for the web app (Firebase config is committed); the unused
  `artifacts/api-server` package still expects `DATABASE_URL`
- Note: the pnpm workspace was flattened into the root `package.json` (bun lockfile),
  so the old `pnpm --filter @workspace/...` commands no longer apply

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
