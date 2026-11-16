# Postman — Auth & RBAC smoke tests

Files for manual runs in Postman Desktop and for CI (Jenkins Postman CLI).

## Cloud (already created via Postman MCP)

| Resource | ID / link |
|----------|-----------|
| Workspace **Warehouse MVP** | `3bdd4302-3f1f-4865-8bb5-d0999eff8c57` |
| Collection **Warehouse MVP — Auth & RBAC** | `5006774-8ff6c4f4-df03-4401-b7ce-e7012fc6d2bd` |
| Environment **Local (localhost:3000)** | `5006774-8bbc867c-e099-4fd4-8bd7-a68c24db19a5` |
| Open in app | [Warehouse MVP workspace](https://web.postman.co/workspace/3bdd4302-3f1f-4865-8bb5-d0999eff8c57) |

### One-click run (Desktop / Web)

1. Start API on `:3000` (`migrate deploy` + `db seed` + `start:dev`)
2. Open workspace → select env **Local (localhost:3000)**
3. Open collection → **Run** (Collection Runner) → **Run Warehouse MVP — Auth & RBAC**

| File | Purpose |
|------|---------|
| `warehouse-auth.postman_collection.json` | Collection + test scripts (repo mirror) |
| `local.postman_environment.json` | Local env (`baseUrl`, admin creds) |
| `Jenkinsfile` | Sample Jenkins pipeline using Postman CLI |

## Run from JSON import (offline)

1. Start API: Postgres up → `npx prisma migrate deploy && npx prisma db seed` → `npm run start:dev`
2. Postman → **Import** both JSON files in this folder
3. Select environment **Warehouse MVP Local**
4. Run collection (**Runner** → select collection → Run)

## Run with Postman CLI (local)

```bash
# install CLI once: https://learning.postman.com/docs/postman-cli/postman-cli-installation/
postman collection run postman/warehouse-auth.postman_collection.json \
  -e postman/local.postman_environment.json \
  --env-var "baseUrl=http://localhost:3000" \
  --env-var "adminEmail=admin@warehouse.local" \
  --env-var "adminPassword=ChangeMeAdmin123!"
```

## Jenkins

1. Create a Pipeline job pointing at `postman/Jenkinsfile` (or copy its contents)
2. Set tool name `YOUR_NODEJS_TOOL_NAME` to match Jenkins Node.js installation
3. Ensure the API under test is reachable from the agent (`BASE_URL` parameter)
4. Prefer **local collection file** in-repo (no cloud UUID required)

To mirror Postman’s cloud sample instead: publish the collection, then uncomment the Login + cloud UUID stages and set `POSTMAN_API_KEY`.

## What the collection checks

1. Admin login → tokens  
2. `GET /auth/me` includes `users:write`  
3. Admin creates a Manager (unique email each run)  
4. Manager login  
5. Manager `POST /users` → `403 AUTH_FORBIDDEN`  
6. Refresh rotates; old refresh → `401`  
7. Logout → `204`
