# 2. Monorepo with pnpm workspaces and Turborepo

- **Status:** Accepted
- **Date:** 2026-11-23

## Context

The project has a backend API and a frontend web app. Both need the same data shapes:
for example, the form that registers a service and the API endpoint that receives it must
agree on the same fields and validation rules.

The project is built by one developer. A single change often touches both sides
(a new field goes from the database to the screen).

## Decision

Keep everything in **one Git repository** (a monorepo) using **pnpm workspaces**:

- `apps/api`: the Node.js API.
- `apps/web`: the React app.
- `packages/contracts`: shared Zod schemas and types, used by both apps.

**Turborepo** runs tasks (`build`, `typecheck`, `test`) across all packages in the right
order and caches the results.

The apps are still **deployed separately**: the web app to Cloudflare and the API to its
own container. One repository does not mean one deployment.

## Alternatives considered

- **Two repositories** (one for the API, one for the web): the shared types would need to be
  published as an npm package or copied by hand, and a change that touches both sides would
  need two coordinated pull requests.
- **Nx:** a more powerful monorepo tool, but with more configuration and concepts than this
  project needs.
- **No shared package:** each app defines its own types. Simple at first, but the API and
  the web can silently drift apart.

## Consequences

- ✅ Shared types are imported directly: if the API contract changes, the web app fails to
  compile instead of failing in production.
- ✅ One pull request per feature, one CI pipeline, one place for issues and releases.
- ✅ One link in the portfolio shows the whole project.
- ❌ More initial setup: workspaces, a shared TypeScript config and Turborepo.
- ❌ CI must be aware of which package changed to avoid running everything on every change.

---
