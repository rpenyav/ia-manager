# Provider Manager IA

Proyecto monorepo con backend NestJS y frontend backoffice en React/Vite.

## Estructura
- `backend`: API administrativa + runtime
- `frontend`: Backoffice UI/UX

## Backend (NestJS)

### Requisitos
- Node 18+
- MySQL 8+
- Redis (cache/queues)
- SQS (opcional, LocalStack en Docker)

### Configuración
- Copia `backend/.env.example` a `backend/.env` y completa valores.

### Scripts
- `npm install`
- `npm run start:dev`
- `npm run migration:run`
- `npm run seed:pricing`
- `npm run seed:demo`

### Endpoints principales
- `POST /auth/token` (JWT admin)
- `POST /auth/api-keys` (API key por tenant)
- `GET /usage/summary` y `GET /usage/alerts`
- `POST /usage/alerts/notify` (email/Slack)
- `GET /audit` (últimos eventos)
- `POST /pricing` (tarifas por proveedor/modelo)
- `POST /webhooks` (webhooks de auditoría)
- `POST /notifications` (canales email/Slack)

### Credenciales de proveedores (JSON)
- OpenAI: `{ "apiKey": "...", "baseUrl": "https://api.openai.com" }`
- Azure OpenAI: `{ "endpoint": "https://<resource>.openai.azure.com", "apiKey": "...", "deployment": "...", "apiVersion": "2024-02-15-preview" }`
- AWS Bedrock: `{ "accessKeyId": "...", "secretAccessKey": "...", "region": "us-east-1", "modelId": "anthropic.claude-3-sonnet-20240229-v1:0" }`
- Google Vertex: `{ "projectId": "...", "location": "us-central1", "model": "gemini-1.5-pro", "client_email": "...", "private_key": "..." }`

### Webhooks
Eventos: `audit.event`. Se envía JSON con firma HMAC opcional (`x-signature`) si el webhook tiene secreto.

### Pricing
Registra tarifas por proveedor/modelo en `/pricing`. Usa `model="*"` para un default por proveedor.
Seed automático en arranque con `PRICING_SEED_ON_STARTUP=true` o manual con `npm run seed:pricing`.

### Notificaciones
Canales `email` y `slack` en `/notifications`. Envío manual con `POST /usage/alerts/notify`.
Envío automático con cron configurable: `ALERTS_CRON` y `ALERTS_MIN_INTERVAL_MINUTES`.

### Demo seed
`npm run seed:demo` crea un tenant demo, provider mock, policy y datos de uso/audit para probar el backoffice.
También puede ejecutarse automáticamente al arrancar con `DEMO_SEED_ON_STARTUP=true`.

### Módulos
AuthModule, TenantsModule, ProvidersModule, PoliciesModule, RuntimeModule, AdaptersModule, RedactionModule, UsageModule, AuditModule, QueuesModule y ObservabilityModule.

## Frontend (Backoffice)

### Requisitos
- Node 18+

### Configuración
- Copia `frontend/.env.example` a `frontend/.env`.
- Define `VITE_API_KEY` o `VITE_AUTH_TOKEN` para autenticar.

### Scripts
- `npm install`
- `npm run dev`

## Criterios de aceptación (MVP)
- Un tenant puede registrar su proveedor.
- Las llamadas pasan por el manager.
- El consumo queda auditado.
- Los límites y el kill switch funcionan (rate limit + cache + validación de consumo diario).

## Postman
Importa `postman/ProviderManagerIA.postman_collection.json`.

## Docker (dev)
1. Copia `backend/.env.example` a `backend/.env` y ajusta hosts para Docker (`DB_HOST=mysql`, `QUEUE_REDIS_HOST=redis`, `CACHE_REDIS_HOST=redis`).
2. Copia `frontend/.env.example` a `frontend/.env`.
3. `docker compose up --build`

SQS local: usa `SQS_QUEUE_URL=http://localstack:4566/000000000000/provider-manager` y crea la cola en LocalStack si la necesitas.
