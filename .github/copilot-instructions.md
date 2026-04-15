# Copilot instructions for Kaffza-Web

## Build, test, and lint commands

Use Node 20+ and pnpm 9+ (`packageManager: pnpm@9.15.0`).

```bash
pnpm install
docker compose up -d                  # postgres, redis, minio for local dev
pnpm db:migrate
pnpm db:seed
```

Monorepo (Turbo) commands from repo root:

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

API test commands (Jest):

```bash
pnpm --filter @kaffza/api test
pnpm --filter @kaffza/api test -- --runTestsByPath test/regressions.spec.ts
pnpm --filter @kaffza/api test -- --testNamePattern="critical regressions"
```

## High-level architecture

- This is a **pnpm workspace + Turborepo monorepo** with three apps: `apps/api` (NestJS), `apps/web` (Next.js App Router), and `apps/mobile` (Expo), plus shared packages (`@kaffza/types`, `@kaffza/validators`, `@kaffza/tsconfig`).
- Backend is a **modular monolith** (`apps/api/src/app.module.ts`) with domain modules (auth, stores, products, cart, orders, payments, shipping, wallets, disputes, admin, etc.), global throttling, and scheduled jobs.
- API runtime entry (`apps/api/src/main.ts`) applies `helmet`, `compression`, `cookie-parser`, global validation pipe, CORS allowlist, and global prefix `api/v1`; Swagger is served at `/api/docs`.
- Web app has multiple surfaces in one Next.js app: storefront (`/store/[subdomain]/*`), merchant dashboard (`/dashboard/*`), customer account (`/account/*`), and admin (`/admin/*`), with auth/role checks centralized in `apps/web/src/middleware.ts`.
- Storefront flow is subdomain-path based: web resolves store via `GET /stores/subdomain/:subdomain`, then uses store-scoped APIs (cart, checkout, payments).
- Data layer uses PostgreSQL + Prisma (`BigInt` IDs, `Decimal(10,3)` for OMR money) and Redis (OTP/session-like data and cart state).

## Key conventions in this repository

- **Store-scoped commerce endpoints are the default pattern**: prefer routes like `/stores/:storeId/...` for cart/orders/payments and keep storefront pages keyed by `/store/[subdomain]`.
- **Auth token cookie compatibility is intentional**: web code reads the same cookie candidates in multiple layers (`kaffza_access`, `accessToken`, `access_token`, `token`) across `middleware.ts`, `lib/auth.ts`, and `lib/api.ts`. Keep these in sync if changed.
- **Client type headers are relied on by backend logic**: web requests commonly send `x-client: web`; backend uses `x-client`/`x-platform` in auth/payments controllers for platform-specific behavior.
- **API IDs are BigInt in backend boundaries**: controllers/services frequently convert params with `BigInt(...)`, and response payloads often stringify IDs before returning to frontend.
- **Bilingual domain model is built into schema and UI**: entities commonly carry `nameAr/nameEn` and storefront pages are Arabic-first (`dir="rtl"`) while preserving English fields and routes.
