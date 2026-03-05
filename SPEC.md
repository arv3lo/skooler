# Skool — Multi-Tenant National School Management Platform
## Product Specification

---

## 1. Vision

A nationwide SaaS platform for school and student management. Every registered school in the country — from primary to university — is one tenant. The platform is managed centrally by a ministry-level super admin and deployed to a PaaS provider (Railway / Render / Fly.io).

---

## 2. Multi-Tenancy Architecture

### Model
**Shared database, shared schema** with PostgreSQL Row-Level Security (RLS).

All tenants share the same tables. Every tenant-scoped table has a `tenant_id` column. RLS policies at the database level enforce that queries only see rows belonging to the current tenant, set via the session variable `app.current_tenant_id`.

This approach:
- Makes cross-school analytics trivial (bypass RLS via a privileged DB role)
- Keeps migrations simple (one migration for all schools)
- Scales to thousands of schools without ops overhead
- Protects against missing `WHERE tenant_id = ?` at the application layer

### Tenant Resolution
Every request from `[slug].app.com` extracts the subdomain. The server:
1. Reads the subdomain from the `Host` header
2. Validates the tenant exists and is active in the DB
3. Sets `app.current_tenant_id` on the DB connection for the duration of the request

The client (Next.js middleware) extracts the subdomain and passes it to all API calls.

---

## 3. User Personas & Role Model

### Identity Model: Cross-Tenant
One user account works across multiple schools. A user has:
- One platform identity (managed by the external auth provider)
- One or more `TenantMembership` records, each with a role scoped to a specific school

When a user logs in, they receive a list of their tenant memberships. They select a school (or are auto-redirected by subdomain). The server issues a short-lived JWT scoped to that single tenant.

### Roles

| Role | Scope | Description |
|---|---|---|
| `PLATFORM_ADMIN` | Platform-wide | Ministry-level. Manages all schools, regions, bulk imports, subscription tiers, cross-tenant analytics. |
| `REGIONAL_SUPERVISOR` | One or more assigned schools | Read-only view across assigned schools. Cannot modify any school's data. |
| `SCHOOL_ADMIN` | One tenant | Full management of their school: staff, students, classes, configuration, announcements. |
| `TEACHER` | One tenant | Manages assigned classes: attendance, grades (future), timetable view. |
| `STUDENT` | One tenant | Reads own schedule, grades (future), attendance. |
| `PARENT` | Platform-level (linked to student) | Views child data (grades, attendance, schedule). Linked to student records across any school via a platform-level link table. |

---

## 4. Authentication

### Provider
**External identity provider** (Auth0, Clerk, or Supabase Auth). The platform does not manage passwords or sessions directly.

### JWT Flow
1. User authenticates with the external provider.
2. The server validates the external token and retrieves the user's `TenantMembership` list.
3. User selects a tenant (UI) or the subdomain auto-selects it.
4. Server issues a **short-lived JWT** (15 min):
   ```json
   {
     "sub": "user_id",
     "tenantId": "tenant_uuid",
     "role": "TEACHER",
     "subscriptionTier": "PRO"
   }
   ```
5. A **refresh token** (opaque, stored in DB, 30-day TTL) is delivered via `httpOnly` cookie.
6. Switching schools = subdomain redirect + token re-issue via the refresh token endpoint.

### Guards (NestJS)
- `JwtAuthGuard`: validates JWT signature and expiry.
- `TenantGuard`: confirms `tenantId` in JWT matches the subdomain in the request.
- `RolesGuard`: checks `role` against required roles on the route decorator.
- `SubscriptionGuard`: checks `subscriptionTier` against the feature's required tier.

---

## 5. School Onboarding

**Bulk import by ministry.**

The `PLATFORM_ADMIN` uploads a list of registered schools (CSV or JSON) sourced from the national school registry. The import process:
1. Creates a `Tenant` record per school with its `slug` (auto-derived from school name, deduplication enforced).
2. Assigns the school to its pre-defined `Region`.
3. Sets the initial `subscriptionTier` (default: `FREE`).
4. Generates an invitation email to the designated school admin email.

Schools cannot self-register. Subdomain squatting is impossible by design.

---

## 6. Regions

Ministry pre-defines a flat list of regions (e.g. provinces or districts). Each school is assigned to exactly one region at import time.

A `REGIONAL_SUPERVISOR` is assigned to one or more regions via a `SupervisorRegionAssignment` table. They see aggregated, read-only data for all schools within their assigned regions.

---

## 7. Academic Structure (Configurable per School)

```
School
 └── AcademicYear (e.g. "2025-2026")
      └── Term (e.g. "Semester 1", "Q1", "Trimester 2")
           └── Class (subject + teacher + room + schedule)
                └── Enrollment (student ↔ class)
```

Each school configures its own academic year structure (quarters, semesters, trimesters). Primary schools may use a single term per year. Universities may use two semesters. The model is the same; the configuration differs.

---

## 8. School Types & Subscription Tiers

### School Types
Set at import time by the ministry. Drives which UI modules are visible.

| Type | Description |
|---|---|
| `PRIMARY` | Simple schedule, one teacher per class, no credit hours. |
| `SECONDARY` | Full schedule, grade levels, multiple teachers per subject. |
| `UNIVERSITY` | Departments, faculties, credit hours, course codes (PRO+ only). |

### Subscription Tiers
Features are gated by subscription tier. Ministry or school admin can upgrade.

| Feature | FREE | PRO | ENTERPRISE |
|---|---|---|---|
| Student enrollment | Yes | Yes | Yes |
| Class & schedule management | Basic | Full (conflict detection) | Full |
| Email notifications | Yes | Yes | Yes |
| SMS notifications | No | Yes | Yes |
| Student transfers | No | Yes | Yes |
| Ministry analytics dashboard | N/A | N/A | Yes |
| University features (departments, credits) | No | Yes | Yes |
| Multiple school admins | No | No | Yes |
| Custom branding | No | No | Yes |

---

## 9. Feature Modules (MVP)

### Phase 1 (MVP)
1. **Tenant & Region Management** — school records, region assignment, subdomain setup, subscription tier.
2. **User & Auth** — identity via external provider, cross-tenant memberships, JWT scoping, tenant-switching.
3. **Student Enrollment** — student profiles, national ID, class enrollment, status management.
4. **Class & Schedule Management** — academic years, terms, rooms, class creation, teacher assignment, timetable, conflict warnings.
5. **Staff Management** — teacher and admin profiles, subject assignments.
6. **Public School Profile** — school name/logo, contact info, rich announcements managed by school admin.

### Phase 2 (Post-MVP)
- Grades & assessments (report cards, GPA, transcripts)
- Attendance tracking (daily/period, absence alerts)
- Parent portal (parent-student linking, child data access)
- Notifications (email + SMS + in-app push)
- Student transfers
- Ministry analytics dashboard
- File uploads (profile pictures, documents)
- Audit logging

---

## 10. Student Identity & Transfers

### Identity
Every student has a `nationalId` (national ID or birth certificate number). This is the unique cross-school identifier. If a student has an app account, their `User` record links to their `Student` record via `userId`.

### Transfers
1. Receiving school admin initiates a transfer request, providing the student's `nationalId`.
2. Source school admin receives a notification and approves or rejects.
3. On approval: a `historySnapshot` (JSONB of academic records) is attached to the `TransferRequest` record.
4. The receiving school imports the snapshot — the student's history from the previous school is preserved.
5. The student's record at the source school is soft-deleted.

---

## 11. Parent-Student Linking (Phase 2)

The parent-student relationship is stored at the **platform level** (outside any single tenant). A parent can have children at different schools.

Linking flow (invitation-based):
1. School admin sends a parent invitation by email, linked to a specific student.
2. Parent creates/connects their account via the external auth provider.
3. A `ParentStudentLink` record is created with the relationship type.
4. Parent can now view that child's data from their school's subdomain.

---

## 12. Notifications (Phase 2)

Three channels: **email**, **SMS**, **in-app push**.

- Email: Resend or SendGrid
- SMS: Twilio
- In-app: WebSocket (NestJS + Socket.io gateway) or Server-Sent Events

Notifications are tenant-scoped. Channel delivery depends on subscription tier (SMS is PRO+).

---

## 13. Data Model (Prisma Schema Overview)

### Platform-Level Tables (no tenant_id, no RLS)
```
User               — platform identity, links to external auth provider
TenantMembership   — user ↔ tenant ↔ role (the cross-tenant membership)
Tenant             — school record (slug, type, region, tier, active)
Region             — ministry-defined regions
SupervisorRegionAssignment — regional supervisor ↔ region
RefreshToken       — opaque refresh tokens per user+tenant
ParentStudentLink  — parent user ↔ student (cross-tenant, Phase 2)
```

### Tenant-Scoped Tables (all have tenant_id, covered by RLS)
```
Student            — profile, nationalId (unique globally), enrollmentStatus
AcademicYear       — per school, isCurrent flag
Term               — belongs to AcademicYear
Room               — name, capacity
Class              — term, teacher, room, schedule (JSONB)
ClassEnrollment    — student ↔ class
StaffProfile       — teacher/admin details, subject assignments
TransferRequest    — fromTenant, toTenant, historySnapshot (JSONB), status
SchoolAnnouncement — public profile announcements
Notification       — in-app notifications (Phase 2)
```

### Soft Deletes
All entities have a `deletedAt` timestamp. Nothing is physically deleted. All queries must include `WHERE deleted_at IS NULL` (enforced via Prisma middleware).

---

## 14. Server Architecture (NestJS)

### Hexagonal Modular Architecture
One module per major domain. Each module follows ports/adapters:

```
modules/
  platform/          — ministry admin, tenant CRUD, region management, bulk import
  auth/              — external provider integration, JWT scoping, refresh tokens
  user/              — user profiles, cross-tenant memberships, role management
  enrollment/        — students, national ID validation, class enrollment, transfers
  schedule/          — academic years, terms, rooms, classes, timetable, conflict detection
  staff/             — teacher profiles, subject assignments
  notification/      — email/SMS/in-app dispatcher (Phase 2)
  public/            — school public profiles, announcements
  analytics/         — aggregated ministry dashboard (Phase 2)
```

Each module structure:
```
modules/[name]/
  domain/
    entities/        — domain entities and value objects
    ports/           — repository interfaces and service interfaces
  application/
    use-cases/       — one class per use case
    services/        — orchestration services
  infrastructure/
    prisma/          — PrismaRepository implementations
    external/        — third-party adapters (Twilio, Resend, etc.)
  presentation/
    controllers/     — NestJS REST controllers
    gateways/        — WebSocket gateways (notifications)
    dto/             — request/response DTOs with class-validator
    guards/          — module-specific guards if needed
```

### Middleware
- `TenantMiddleware` — extracts subdomain, validates tenant, sets `app.current_tenant_id` session var on the DB connection.
- Global `JwtAuthGuard` on all routes except public profile endpoints and auth endpoints.

### API
- **REST** for all CRUD operations, documented with Swagger (`@nestjs/swagger`).
- **WebSocket** (Socket.io) for real-time in-app notifications (Phase 2).

---

## 15. Client Architecture (Next.js 16)

### Subdomain Routing
Next.js middleware reads the `Host` header, extracts the subdomain, and:
- Routes to the public school profile if the user is not logged in.
- Redirects to the auth flow if accessing a protected route.
- Injects `X-Tenant-Id` into server component fetch requests.

### Route Structure
```
app/
  (public)/
    page.tsx              — school public profile (accessible without login)
  (auth)/
    login/page.tsx
    select-school/page.tsx  — school picker after login (multi-membership users)
  (app)/
    dashboard/page.tsx
    students/
    schedule/
    staff/
    admin/                — school admin panel
  (platform)/             — ministry admin (platform subdomain only)
    schools/
    regions/
    analytics/
```

### State & Data Fetching
- Server components for initial data loads (schedule, student list).
- Client components for interactive elements (timetable builder, forms).
- No file uploads in MVP — no multipart form handling needed.

---

## 16. Infrastructure & Deployment

### Docker (local development)
- `docker-compose.yml` runs: `postgres`, `server` (NestJS), optionally `pgadmin`.
- Environment variables via `.env` files.

### PaaS Deployment
- Server → Railway / Render / Fly.io (Dockerfile-based deploy).
- Database → Managed PostgreSQL (Railway Postgres, Supabase, or Neon).
- Client → Vercel (wildcard subdomain support: `*.app.com`).

### Environment Variables
All secrets in `.env`. Every entry mirrored in `.env.example` with a placeholder value.

Required variables include (non-exhaustive):
```
DATABASE_URL
AUTH_PROVIDER_DOMAIN
AUTH_PROVIDER_CLIENT_ID
AUTH_PROVIDER_CLIENT_SECRET
JWT_SECRET
JWT_EXPIRY
REFRESH_TOKEN_EXPIRY
SMS_PROVIDER_API_KEY     (Phase 2)
EMAIL_PROVIDER_API_KEY   (Phase 2)
```

---

## 17. Security Considerations

- **RLS as last line of defense**: even a buggy query cannot leak cross-tenant data.
- **JWT is tenant-scoped**: a stolen token is limited to one school.
- **Subdomain validation in DB**: no client-controlled tenant ID injection.
- **Role-based access on every endpoint**: no security by obscurity.
- **Soft deletes**: no accidental data destruction.
- **httpOnly cookies** for refresh tokens: not accessible to JavaScript.
- **Rate limiting** on auth and public endpoints (NestJS `@nestjs/throttler`).
- **Input validation** via `class-validator` on all DTOs.

---

## 18. Open Questions / Future Phases

- **Offline support**: Currently not planned. If rural schools require it, a PWA with background sync would be the approach.
- **File storage**: Deferred from MVP. S3-compatible storage (MinIO or Cloudflare R2) when needed.
- **Audit logging**: Deferred from MVP. When added, use a separate `AuditLog` table with before/after JSONB diff.
- **GDPR / national privacy law**: Not in scope for MVP. Right-to-erasure and consent flows to be added when legally required.
- **Hierarchical regions**: Currently flat regions. Can be extended to a self-referential `parentRegionId` tree for province > district > school hierarchies.
- **University-specific features**: Departments, faculties, credit hours, course registration — gated behind PRO/ENTERPRISE tier.
- **Grades & assessments**: Weighted averages, report cards, transcripts — Phase 2.
- **Attendance**: Daily/period tracking, absence alerts — Phase 2.
