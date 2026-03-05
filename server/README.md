# Skool — Server

NestJS API for the Skool platform.

## Prerequisites

- Node.js ≥ 22
- pnpm ≥ 9
- PostgreSQL 16 (or `docker compose up postgres -d` from the repo root)

## Setup

```bash
pnpm install
cp .env.example .env
```

Edit `.env` and fill in all values (see [Environment variables](#environment-variables) below).

## Database

```bash
# Run migrations
pnpm exec prisma migrate dev

# Apply RLS policies (run once after the first migration)
psql $DATABASE_URL -f prisma/rls.sql

# Seed with demo data
pnpm db:seed
```

## Running

```bash
# Development (watch mode)
pnpm start:dev

# Production build
pnpm build
pnpm start:prod
```

The server starts on the port defined by `PORT` (default `3000`).
Swagger UI is available at <http://localhost:3000/docs>.

## Testing

```bash
# Unit tests
pnpm test

# Single test file
pnpm test -- src/modules/auth/auth.service.spec.ts

# e2e tests
pnpm test:e2e

# Coverage
pnpm test:cov
```

## Environment variables

Copy `.env.example` to `.env` and fill in each value.

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (`postgresql://user:pass@host:5432/db`) |
| `JWT_SECRET` | Secret used to sign platform JWTs (min. 32 chars) |
| `JWT_EXPIRY` | Access token lifetime, e.g. `15m` |
| `REFRESH_TOKEN_EXPIRY` | Refresh token lifetime in days, e.g. `30d` |
| `AUTH_PROVIDER_DOMAIN` | Issuer URL of the external auth provider (e.g. `https://your-tenant.auth0.com`) |
| `AUTH_PROVIDER_JWKS_URI` | JWKS endpoint for verifying external tokens (e.g. `https://your-tenant.auth0.com/.well-known/jwks.json`) |
| `AUTH_PROVIDER_AUDIENCE` | Expected audience claim on external tokens |
| `PORT` | HTTP port (default `3000`) |

## Module structure

```
src/
├── common/
│   ├── decorators/    @Roles, @CurrentUser, @Public, @RequireSubscription
│   ├── enums/         Role, SubscriptionTier, SchoolType, EnrollmentStatus
│   ├── guards/        JwtAuthGuard, TenantGuard, RolesGuard, SubscriptionGuard
│   ├── interfaces/    JwtPayload, AuthenticatedRequest
│   └── middleware/    TenantMiddleware (subdomain → tenant_id)
└── modules/
    ├── prisma/        PrismaService with withTenant() RLS helper
    ├── auth/          Login, tenant selection, JWT refresh
    ├── platform/      Ministry admin: tenants, regions, supervisor views
    ├── user/          User profiles, tenant memberships
    ├── enrollment/    Students, class enrollments, transfers
    ├── schedule/      Academic years, terms, rooms, classes (conflict detection)
    ├── staff/         Staff profiles, subject assignments
    └── public/        Public school profile, announcements
```

## Multi-tenancy

Every request is resolved to a tenant via subdomain (`<slug>.app.com`) or the `X-Tenant-Slug` header (local development).

The `PrismaService.withTenant(tenantId, fn)` helper wraps every tenant-scoped query in a transaction that sets `app.current_tenant_id` for PostgreSQL RLS, preventing any cross-tenant data leak at the database level.
