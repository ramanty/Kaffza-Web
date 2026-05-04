# Copilot instructions for Kaffza-Web

## Build, test, and lint commands

Use **Node 20+** and **pnpm 9+** (`packageManager: pnpm@9.15.0`).

Initial local setup from repo root:

```bash
pnpm install
docker compose up -d                  # postgres, redis, minio
pnpm db:migrate
pnpm db:seed
```

Monorepo commands (Turbo):

```bash
pnpm dev
pnpm lint
pnpm build
pnpm test
```

Targeted app commands:

```bash
pnpm dev:api
pnpm dev:web
pnpm dev:mobile
pnpm build:api
pnpm build:web
```

API/Jest test commands (including single-test execution):

```bash
pnpm --filter @kaffza/api test
pnpm --filter @kaffza/api test -- --runTestsByPath test/regressions.spec.ts
pnpm --filter @kaffza/api test -- --runTestsByPath test/regressions.spec.ts --testNamePattern="uses store-scoped checkout payment endpoint in web checkout"
```

## High-level architecture

- Monorepo is organized as `apps/api` (NestJS), `apps/web` (Next.js App Router), `apps/mobile` (Expo), with shared workspace packages `@kaffza/types`, `@kaffza/validators`, and `@kaffza/tsconfig`.
- Backend is a **modular monolith** (`apps/api/src/app.module.ts`) with domain modules for auth, stores, products, cart, orders, payments, shipping, wallets, disputes, admin, notifications, escrow, integrations, and uploads. Global throttling and scheduled jobs are enabled at app level.
- API bootstrap (`apps/api/src/main.ts`) sets global prefix `api/v1`, global validation pipe, `helmet`/`compression`/`cookie-parser`, environment-based CORS allowlist, and Swagger at `/api/docs`.
- Web app hosts multiple product surfaces in one Next.js app: storefront (`/store/[subdomain]/*`), merchant dashboard (`/dashboard/*`), customer account (`/account/*`), and admin (`/admin/*`), with route protection and role checks centralized in `apps/web/src/middleware.ts`.
- Storefront request flow is: resolve store via `GET /stores/subdomain/:subdomain`, then operate on **store-scoped** commerce endpoints (cart, checkout, payments, orders) using the resolved `storeId`.
- Persistence stack: PostgreSQL via Prisma + Redis. Prisma models use `BigInt` IDs heavily, and financial values are OMR with 3-decimal precision in the data model and UI formatting.

## Key conventions in this repository

- Prefer **store-scoped commerce routes** (`/stores/:storeId/...`) for cart/order/payment operations; this pattern is also guarded by API regression tests.
- Keep auth cookie compatibility aligned across web layers: `kaffza_access`, `accessToken`, `access_token`, `token` are intentionally read in middleware and client auth helpers.
- Include `x-client: web` on web-originated API calls. Backend auth/payment logic checks `x-client` / `x-platform` to branch web vs mobile behavior.
- For auth flows, backend returns different token behavior by client type: web uses refresh-token cookie path `/api/v1/auth/refresh`; mobile uses token payloads directly.
- Convert route params to `BigInt` at API boundaries and preserve safe serialization (BigInt is stringified in API bootstrap).
- Domain entities and UI are bilingual-first: `nameAr`/`nameEn` are standard fields; storefront defaults to Arabic/RTL while keeping English route variants and labels.
- Production deploy flow uses `production/.env` as runtime source of truth with `production/docker-compose.yml` and `deploy_kaffza.sh`.
