# Provider Manager IA (Neria Manager)

Monorepo con backoffice en React/Vite y backend Java (Spring Boot) como stack principal. El backend NestJS queda como legacy.

## Estado actual (balance funcional)
- Backend activo: `backend-java` (Spring Boot + JPA).
- Backend legacy: `backend-javascript` (NestJS).
- Frontend: `frontend` (React/Vite), login con cookies + fallback `Authorization: Bearer` (token en `localStorage`).
- Autenticación: admin + tenant (JWT), API key para runtime.
- Módulos core replicados: tenants, providers, policies, pricing, usage, audit, webhooks, notifications, subscriptions + billing.
- Servicios por tenant: tablas y endpoints para `tenant_services`, `tenant_service_users`, `tenant_service_configs`, `tenant_service_endpoints`.
- Migraciones manuales en carpeta `migrations/`.

## Estructura
- `backend-java`: API principal (Spring Boot).
- `backend-javascript`: backend legacy (NestJS).
- `frontend`: Backoffice UI/UX.
- `migrations`: SQL incremental para cambios recientes.

## Backend (Spring Boot)

### Requisitos
- Java 17
- MySQL 8+

### Configuración
Variables principales (ejemplos):
- `APP_PORT`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `AUTH_JWT_SECRET` (>= 32 chars)
- `CHAT_JWT_SECRET` (>= 32 chars)
- `CORS_ORIGINS` (CSV, ej: `https://frontend-production-ad1f.up.railway.app,http://localhost:5173`)
- `AUTH_COOKIE_SECURE` / `AUTH_COOKIE_SAMESITE`

### Ejecutar local
```bash
cd backend-java
set -a; source .env; set +a
mvn spring-boot:run
```

### Endpoints principales (paridad con NestJS)
- `POST /auth/token` (JWT admin)
- `POST /auth/login` (admin/tenant)
- `GET /auth/session` (session actual)
- `GET /tenants`, `PATCH /tenants/:id`
- `GET /policies`, `PUT /policies`
- `GET /usage/summary`, `GET /usage/alerts`, `POST /usage/alerts/notify`
- `GET /audit`
- `GET /pricing`
- `GET /services/catalog`
- `GET|POST|PATCH /tenants/:tenantId/subscription`
- `POST /billing/confirm` (mock/Stripe)

## Migraciones SQL (manuales)
Archivos recientes:
- `migrations/2026-02-11_tenant_service_tables.sql`
- `migrations/2026-02-11_add_service_code_to_usage_events.sql`

### Aplicar (local)
```bash
/Applications/XAMPP/bin/mysql -h localhost -P 3306 -u <user> -p <db_name> < migrations/2026-02-11_tenant_service_tables.sql
/Applications/XAMPP/bin/mysql -h localhost -P 3306 -u <user> -p <db_name> < migrations/2026-02-11_add_service_code_to_usage_events.sql
```

### Aplicar (Railway)
Usa `railway connect mysql` y dentro del monitor:
```
SOURCE /path/absoluto/migrations/2026-02-11_tenant_service_tables.sql;
SOURCE /path/absoluto/migrations/2026-02-11_add_service_code_to_usage_events.sql;
```

## Frontend (Backoffice)

### Requisitos
- Node 18+

### Configuración
- `VITE_API_BASE_URL`
- `VITE_API_KEY` (si aplica)
- `VITE_AUTH_CLIENT_ID` / `VITE_AUTH_CLIENT_SECRET` (refresh token opcional)

### Ejecutar local
```bash
cd frontend
npm install
npm run dev
```

## Postman
Importa `postman/ProviderManagerIA.postman_collection.json`.

## Notas de seguridad
- Para producción: `AUTH_COOKIE_SECURE=true` y `AUTH_COOKIE_SAMESITE=none`.
- CORS con `*` + cookies no funciona; usa dominios explícitos.
