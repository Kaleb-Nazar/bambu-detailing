# 1. Modular monolith with pragmatic hexagonal architecture

- **Status:** Accepted
- **Date:** 2026-11-23

## Context

The system serves a single car wash with a few panel users (one admin, one or two operators),
built and maintained by one developer. It must be easy to explain and test, and it must be
able to grow: multiple branches, online payments, WhatsApp notifications and an ERP integration.

## Decision

Build **one deployable Node.js API** split into business modules: `catalog`, `vehicles`,
`services`, `bookings`, `reports` and `auth`. Each module has three layers (`domain`,
`application`, `infrastructure`) and only exposes its public `index.ts`.

Apply hexagonal architecture (ports and adapters) **only where there are business rules**:
`services` and `bookings`. `catalog` is thin CRUD and `reports` uses direct SQL queries.

## Alternatives considered

- **Classic MVC** (controllers + ORM models): fastest start, but business rules end up coupled
  to the framework and the ORM, and testing them requires a database.
- **Microservices:** independent deployments, but they add network calls, distributed data and
  operational overhead with no real need for a single developer.
- **Hexagonal everywhere:** consistent, but adds ceremony to simple CRUD screens.

## Consequences

- ✅ Business rules are tested with fast unit tests, without a database.
- ✅ Infrastructure can change without touching the rules (e.g. in-memory events → Redis).
- ✅ A module can be extracted later along its existing boundary.
- ❌ More files and indirection than MVC; the module structure must be documented.
- ❌ Module boundaries must be enforced with tooling (dependency-cruiser, planned).
