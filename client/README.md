# Skool — Client

Next.js 16 frontend for the Skool platform.

## Prerequisites

- Node.js ≥ 22
- pnpm ≥ 9
- The server running at `http://localhost:3000` (see `../server/README.md`)

## Setup

```bash
pnpm install
cp .env.local.example .env.local   # when the file exists
```

## Running

```bash
# Development
pnpm dev      # http://localhost:3001

# Production build
pnpm build
pnpm start
```

## Subdomain routing (local development)

The app uses subdomain routing (`<slug>.app.com`) to identify tenants. In local development the server accepts the `X-Tenant-Slug` header as a fallback — no DNS configuration is required.

For a closer-to-production setup, add wildcard entries to `/etc/hosts`:

```
127.0.0.1  app.localhost
127.0.0.1  sunrise-primary-school.app.localhost
127.0.0.1  central-high-school.app.localhost
```

Then update `NEXT_PUBLIC_APP_DOMAIN` in `.env.local` to `app.localhost`.
