# Setup & Self-Hosting

## Local Development

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- PostgreSQL 14+
- Node.js 20+ and npm

### 1. Database

Create a PostgreSQL database and user:

```sql
CREATE USER openplan WITH PASSWORD 'openplan';
CREATE DATABASE openplan OWNER openplan;
```

Or adjust `ConnectionStrings:DefaultConnection` in `server/OpenPlan.API/appsettings.json`.

### 2. Backend

```bash
# Run (applies migrations automatically on startup)
dotnet run --project server/OpenPlan.API

# Run migrations manually
dotnet ef database update --project server/OpenPlan.API

# Add a new migration
dotnet ef migrations add <MigrationName> --project server/OpenPlan.API
```

API is available at `http://localhost:5000`.

### 3. Web Client

```bash
cd web
npm install
npm run dev          # http://localhost:5173
npm run build        # production build → web/dist/
npm run lint         # ESLint
```

Create `web/.env` to override defaults:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

---

## Environment Variables

All backend configuration is via `appsettings.json` or environment variables (environment variables take precedence).

| Variable | Default | Description |
|---|---|---|
| `ConnectionStrings__DefaultConnection` | (see appsettings.json) | PostgreSQL connection string |
| `Jwt__Secret` | *(must change)* | JWT signing secret — **must be at least 32 characters** |
| `Jwt__Issuer` | `openplan` | JWT issuer claim |
| `Jwt__Audience` | `openplan-clients` | JWT audience claim |
| `Cors__Origins` | `http://localhost:5173` | Comma-separated list of allowed CORS origins |

> **Security:** Never use the default `Jwt__Secret` in production. Generate a strong random secret with `openssl rand -base64 32`.

---

## Docker Compose (Self-Hosting)

> Docker Compose support is on the [roadmap](roadmap.md) and not yet available. The instructions below describe the planned setup.

A `docker-compose.yml` at the project root will bring up:

- **api** — .NET 8 API server
- **db** — PostgreSQL 16
- **proxy** — Caddy reverse proxy with automatic HTTPS

```bash
# Copy and edit environment config
cp config.example.env config.env
# Edit config.env: set JWT_SECRET, POSTGRES_PASSWORD, domain, SMTP, etc.

docker compose up -d
```

The web client will be served as static files from the API container, so only one public port (443) needs to be exposed.

### Planned environment variables for Docker

| Variable | Description |
|---|---|
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `JWT_SECRET` | 32+ char random secret |
| `PUBLIC_URL` | Public HTTPS URL (e.g. `https://tasks.example.com`) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Optional email notifications |
