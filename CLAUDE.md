# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenPlan is a self-hostable, open-source task manager (Todoist-inspired). The repository contains two sub-projects:

- `server/` — .NET 8 Web API (C#), PostgreSQL via EF Core
- `web/` — React 19 + TypeScript SPA, Vite, Tailwind CSS v4, Zustand

The current codebase is the **working prototype**: no refresh tokens, no WebSocket sync, no labels/sections, no recurrence, no drag-and-drop. See `openplan-requirements.md` for the full v1 spec.

---

## Development Commands

### Backend (`server/OpenPlan.API/`)

```bash
# Run the API (auto-applies EF migrations on startup)
dotnet run --project server/OpenPlan.API

# Add a migration
dotnet ef migrations add <Name> --project server/OpenPlan.API

# Apply migrations manually
dotnet ef database update --project server/OpenPlan.API
```

Default API base: `http://localhost:5000/api/v1`

Database defaults (from `appsettings.json`): `Host=localhost;Port=5432;Database=openplan;Username=openplan;Password=openplan`

### Frontend (`web/`)

```bash
cd web
npm install
npm run dev      # Vite dev server at http://localhost:5173
npm run build    # tsc -b && vite build
npm run lint     # ESLint
```

Configure the API URL via `web/.env`:
```
VITE_API_URL=http://localhost:5000/api/v1
```

---

## Architecture

### Backend

```
server/OpenPlan.API/
  Program.cs              — DI setup, CORS, JWT, EF migration on startup
  Models/                 — EF entities: TaskItem, Project, User
  Data/AppDbContext.cs    — EF DbContext
  Controllers/            — AuthController, TasksController, ProjectsController
  Services/
    AuthService.cs        — BCrypt password hashing, JWT issuance
    TaskService.cs        — All task CRUD + tick logic
    TaskProgressService.cs— Pure-static: progress, effectivePriority, nextChildTitle
    ProjectService.cs     — Project CRUD
  DTOs/                   — Request/response records (separate from EF models)
  Migrations/             — EF Core migrations
```

**Key design: computed fields.** `progress`, `effectivePriority`, `completedChildCount`, `totalChildCount`, and `nextChildTitle` are computed at read time by `TaskProgressService` — never stored in the DB. `TaskService.MapToResponse` calls these before constructing the `TaskResponse` DTO.

**Task tree loading.** EF does not eagerly load the full subtree. `TaskService.LoadChildrenRecursiveAsync` executes one DB query per depth level to fully populate `TaskItem.Children` before mapping. Any code that maps tasks to responses must call this first.

**Tick semantics.** `POST /api/v1/tasks/{id}/tick` (handled by `TaskService.TickAsync`):
- Leaf task → complete it directly
- Sequential task with children → complete the next uncompleted child (by `SortOrder`), then `TryAutoCompleteAncestorsAsync`
- Parallel task with children → complete all children recursively, then `TryAutoCompleteAncestorsAsync`

**Auto-complete.** After any mutation, `TryAutoCompleteAncestorsAsync` walks up the parent chain and auto-completes any parent whose all children are completed/cancelled.

### Frontend

```
web/src/
  api/          — axios wrappers: client.ts (auth interceptor), auth.ts, tasks.ts, projects.ts
  store/        — Zustand stores: auth.ts, tasks.ts
  types/        — index.ts: all shared TypeScript interfaces (Task, Project, AuthUser, payloads)
  pages/        — Today, Upcoming, Inbox, ProjectView, Login, Register
  components/
    Layout/     — AppLayout (route shell + sidebar), Sidebar
    Task/       — TaskRow, TaskList, AddTaskForm, ProgressRing
```

**State management.** `useTasksStore` (Zustand) holds the flat-ish task tree as returned by the API (`Task[]` where each `Task` has a nested `children: Task[]`). Tree mutations (`replaceTask`, `removeTask`, `insertChild`) walk the nested structure recursively. All API calls go through the store; pages call store actions, not the API layer directly.

**Auth.** JWT is stored in `localStorage` under `openplan_token`. The axios interceptor in `client.ts` attaches it to every request and redirects to `/login` on 401. Auth state lives in `store/auth.ts`.

**Routing.** React Router v7. All app views are children of `AppLayout` (which renders `Sidebar` + `<Outlet>`). Login/Register are standalone routes.

---

## Task Model Rules

These invariants are enforced server-side and must be preserved in any UI or API changes:

1. **Sequential task checkbox**: ticking a sequential parent completes its *next uncompleted child*, not the parent itself. The parent auto-completes only when all children are done.
2. **Parallel task checkbox**: ticking a parallel parent with children completes *all children* recursively.
3. **Progress for sequential tasks**: children after the first uncompleted one contribute their weight to the denominator but 0 to the numerator (so progress never overstates).
4. **`effectivePriority`**: minimum P-number across all uncompleted descendants (including self). Bubbles up urgency.
5. **Cancellation cascades**: cancelling a task recursively cancels all its descendants.
6. **`completed_at`** is set automatically; never set it manually in the client.
