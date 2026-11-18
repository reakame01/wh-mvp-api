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

## Master data — Warehouses & Locations (Stage 2.3)

| Method | Path | Permission | Notes |
|--------|------|------------|-------|
| GET | `/warehouses` | `warehouses:read` | paginated list (`page`, `pageSize`, `search`, `sort`, `isActive`) |
| POST | `/warehouses` | `warehouses:write` | create |
| GET | `/warehouses/:id` | `warehouses:read` | detail |
| PATCH | `/warehouses/:id` | `warehouses:write` | update / soft deactivate (`isActive`) |
| GET | `/warehouses/:warehouseId/locations` | `locations:read` | locations under warehouse |
| GET/POST | `/locations` | `locations:read` / `write` | list (filter `warehouseId`) / create |
| GET/PATCH | `/locations/:id` | `locations:read` / `write` | detail / update (tree parent, no cycles) |

Location codes are unique per warehouse. Deactivating a warehouse is blocked while it still has active locations.

## Master data — Catalog (Stage 2.4)

| Method | Path | Permission | Notes |
|--------|------|------------|-------|
| GET/POST | `/categories` | `categories:read` / `write` | list / create |
| GET/PATCH | `/categories/:id` | `categories:read` / `write` | detail / update; deactivate blocked if active products |
| GET/POST | `/suppliers` | `suppliers:read` / `write` | list / create |
| GET/PATCH | `/suppliers/:id` | `suppliers:read` / `write` | detail / update / soft deactivate |
| GET/POST | `/products` | `products:read` / `write` | list (`categoryId`, `search` on sku/name/barcode) / create |
| GET/PATCH | `/products/:id` | `products:read` / `write` | detail / update; blank barcode → null; `reorderPoint` as decimal string |

SKU and codes are trimmed/uppercased. Product create/activate requires an **active** category.

## Stock ledger (Stage 3.1 — schema)

Schema + domain for append-only `stock_movements` and `stock_balances` projection (ADR 0003 in workspace docs). Adjustment APIs land in slice 3.2.

- DB CHECKs: never-negative on-hand/reserved; `reserved <= on_hand`; movement `quantity_delta <> 0`
- Append-only: trigger rejects UPDATE/DELETE on `stock_movements`
- Permissions seeded: `stock:read` / `stock:write`

## Scripts

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Watch mode |
| `npm run build` | Compile (`dist/main.js`) |
| `npm test` | Unit tests |
| `npm run test:cov` | Coverage (domain/application + filters/guards; HTTP via Postman; Prisma repos deferred to Stage 3 integration) |
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
