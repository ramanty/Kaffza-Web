# Kaffza Release Notes

## What was fixed in this release
- Checkout payment session is store-scoped: `/stores/:storeId/payments/create-session`.
- Admin withdrawals page added to the web admin panel.
- Admin settings page connected to `/admin/settings` GET/PATCH.
- Admin module imports fixed to resolve `RedisService` and `WalletsService` dependency injection.
- Production deployment hardened with healthchecks, internal-only DB/Redis, HSTS and stricter nginx config.
- CI workflow and regression tests added.
- Pricing docs unified to Starter 5 OMR, Growth 8 OMR, Pro 35 OMR.

## External items still required from the owner before public launch
- Real production secrets in `.env.production` (JWT, DB password, Thawani live keys, webhook secret).
- Real DNS records for `kaffza.om` and wildcard subdomains (or your final production domain).
- Running `pnpm install` once on your machine/CI and committing the generated `pnpm-lock.yaml` for reproducible builds.
- Live Thawani production account verification and webhook endpoint registration.
- Final legal sign-off on Terms / Privacy by a qualified legal reviewer if required.
