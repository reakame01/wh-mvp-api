# wh-mvp-api

Warehouse management MVP API (portfolio / interview demo).

**Stack:** NestJS · Prisma · PostgreSQL · Docker  
**Architecture:** pragmatic Clean Architecture (`domain` / `application` / `infrastructure` / `presentation`)

Companion UI: [wh-mvp-ui](https://github.com/reakame01/wh-mvp-ui)

## Quick start

### Prerequisites

- Node.js 22+
- Docker Desktop (for PostgreSQL)

### 1. Environment

```bash
cp .env.example .env
```

### 2. Start PostgreSQL

```bash
docker compose up -d postgres
```

### 3. Install, migrate, seed, run

```bash
npm install
npx prisma migrate deploy
npx prisma db seed
npm run start:dev
```

- Health: [http://localhost:3000/health](http://localhost:3000/health)
- Default seeded admin (local/demo only):
  - Email: `admin@warehouse.local`
  - Password: `ChangeMeAdmin123!`

### Full stack in Docker (API + Postgres)

```bash
cp .env.example .env
docker compose up --build
```

Optional Redis + RabbitMQ (later tiers):

```bash
docker compose --profile full up -d
```

## Auth & RBAC (Stage 2)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/auth/login` | public | `{ email, password }` → access + refresh |
| POST | `/auth/refresh` | public | rotate refresh token |
| POST | `/auth/logout` | Bearer | revoke refresh |
| GET | `/auth/me` | Bearer | profile + permission codes for role |
| POST | `/users` | `users:write` | create user (Admin in seed matrix) |

Access JWT ~15m; refresh ~7d (hash stored server-side, rotated on refresh).

Authorization uses DB tables `permissions` + `role_permissions` (seeded). Guards use `@RequirePermissions('…')`; role→permission map is loaded into memory on boot.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Watch mode |
| `npm run build` | Compile (`dist/main.js`) |
| `npm test` | Unit tests |
| `npm run test:cov` | Coverage |
| `npm run lint` | ESLint |
| `npm run prisma:deploy` | Apply migrations |
| `npm run prisma:seed` | Seed admin user |

## Project layout

```
src/
  domain/           # entities, errors, roles
  application/      # use cases + ports
  infrastructure/   # Prisma, bcrypt, JWT
  presentation/     # HTTP controllers, guards, DTOs
```

## License

UNLICENSED — portfolio demo, not a commercial product.
