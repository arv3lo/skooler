# Skool

National School Management Platform — multi-tenant SaaS for managing schools, students, staff and schedules at a ministry level.

## Stack

| Layer | Technology |
|-------|-----------|
| Server | NestJS 11, Prisma 7, PostgreSQL 16 |
| Client | Next.js 16, React 19, Tailwind CSS 4 |
| Auth | External provider (Auth0 / Clerk / Supabase Auth) + tenant-scoped JWTs |
| Package manager | pnpm |

## Repository layout

```
skool/
├── server/          # NestJS API
├── client/          # Next.js app
└── docker-compose.yml
```

## Prerequisites

- Node.js ≥ 22
- pnpm ≥ 9
- Docker & Docker Compose (for the database)

---

## Quick start (local development)

### 1. Start the database

```bash
docker compose up postgres -d
```

> Add `-d --profile debug` to also start pgAdmin at <http://localhost:5050> (login: `admin@skool.dev` / `admin`).

### 2. Set up the server

```bash
cd server
cp .env.example .env   # fill in the values (see server/README.md)
pnpm install
pnpm exec prisma migrate dev
pnpm db:seed           # optional — loads realistic demo data
pnpm start:dev         # http://localhost:3000
```

### 3. Set up the client

```bash
cd client
pnpm install
pnpm dev               # http://localhost:3001
```

---

## Running with Docker (all services)

```bash
cp server/.env.example server/.env   # fill in the values
docker compose up --build
```

The API will be available at <http://localhost:3000>.

---

## API documentation

Swagger UI is served at <http://localhost:3000/docs> when the server is running.
