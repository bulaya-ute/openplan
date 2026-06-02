# OpenPlan

A self-hostable, open-source task manager inspired by Todoist. Manage tasks with nested sub-tasks, weighted progress tracking, sequential and parallel task workflows, and real-time sync across devices.

**License:** MIT · **Status:** Working prototype

---

## Features

- **Nested tasks** — unlimited depth subtask trees
- **Sequential & parallel tasks** — sequential tasks advance one step at a time; parallel tasks can be worked on simultaneously
- **Weighted progress** — each subtask can carry a different weight; progress rolls up automatically
- **Priority bubbling** — effective priority (P1–P4) of a parent reflects the highest-urgency descendant
- **Auto-complete** — a parent completes automatically when all its children are done
- **JWT auth** — short-lived access tokens; multi-device friendly
- **Theme** — system / light / dark, synced to your account

## Tech Stack

| Layer    | Technology                            |
|----------|---------------------------------------|
| Backend  | .NET 8, C#, EF Core, PostgreSQL       |
| Web      | React 19, TypeScript, Vite, Tailwind  |
| Auth     | JWT (access + refresh tokens)         |
| Future   | Kotlin Multiplatform (Android/iOS/Desktop) |

## Quick Start

### Prerequisites

- .NET 8 SDK
- PostgreSQL (default: `localhost:5432`, database `openplan`, user `openplan`, password `openplan`)
- Node.js 20+

### Backend

```bash
dotnet run --project server/OpenPlan.API
```

The API runs at `http://localhost:5000`. Migrations apply automatically on startup.

### Web client

```bash
cd web
npm install
npm run dev
```

The app opens at `http://localhost:5173`.

To point the client at a non-default API URL, create `web/.env`:

```
VITE_API_URL=http://localhost:5000/api/v1
```

## Documentation

| Document | Description |
|---|---|
| [Setup & Self-Hosting](docs/setup.md) | Local dev, Docker Compose, environment variables |
| [API Reference](docs/api-reference.md) | All REST endpoints with request/response shapes |
| [Architecture](docs/architecture.md) | Backend and frontend design decisions |
| [Roadmap](docs/roadmap.md) | Planned features (mobile, WebSocket sync, labels, etc.) |
| [Contributing](docs/contributing.md) | How to contribute, code style, PR process |
| [Requirements](openplan-requirements.md) | Full v1 product requirements document |

## License

[MIT](LICENSE)
