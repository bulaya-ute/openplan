# Architecture

## Overview

OpenPlan is a monorepo with two sub-projects:

```
openplan/
  server/OpenPlan.API/    — .NET 8 Web API
  web/                    — React 19 SPA
```

---

## Backend

### Stack

- **.NET 8** web API, controllers style
- **EF Core 8** with Npgsql for PostgreSQL
- **BCrypt.Net** for password hashing
- **JWT Bearer** for authentication
- Migrations applied automatically on startup via `db.Database.Migrate()`

### Project layout

```
Controllers/       — HTTP layer: AuthController, TasksController, ProjectsController
Models/            — EF entities: User, TaskItem, Project
Data/              — AppDbContext
DTOs/              — Request/response records (Auth, Tasks, Projects)
Services/          — Business logic
  AuthService      — Registration, login, JWT issuance
  TaskService      — All task CRUD, tick logic, cascades
  TaskProgressService — Pure-static computed fields
  ProjectService   — Project CRUD
Migrations/        — EF Core migrations
```

### Key design decisions

#### Computed fields, not stored columns

`progress`, `effectivePriority`, `completedChildCount`, `totalChildCount`, and `nextChildTitle` are computed at read time by `TaskProgressService` — never persisted. This keeps the DB schema simple and avoids synchronization bugs.

`TaskService.MapToResponse` calls `TaskProgressService` before building the `TaskResponse` DTO.

#### Recursive subtree loading

EF does not automatically eager-load the full task tree. `TaskService.LoadChildrenRecursiveAsync` issues one DB query per depth level to fully populate `TaskItem.Children` before mapping. Any code path that maps tasks to responses must call this first.

#### Tick semantics

`POST /tasks/{id}/tick` implements the checkbox behavior defined in the requirements:

- **Leaf** → complete directly
- **Sequential parent** → find the first uncompleted child by `SortOrder`; complete it recursively (which cascades through that child's subtree); then run `TryAutoCompleteAncestorsAsync`
- **Parallel parent** → complete all children recursively; then run `TryAutoCompleteAncestorsAsync`

#### Auto-complete cascade

`TryAutoCompleteAncestorsAsync` walks up the `ParentId` chain. At each level, if all direct children are `Completed` or `Cancelled`, the parent is auto-completed. This recurses all the way to the root.

#### Sequential progress

For sequential tasks, `TaskProgressService.GetSequentialChildren` includes children up to and including the first uncompleted one in the numerator, but adds placeholder entries (zero-progress leaf tasks) for all subsequent children so their weight still appears in the denominator. This prevents sequential progress from appearing higher than it truly is.

---

## Frontend

### Stack

- **React 19**, TypeScript
- **Vite 8** + `@tailwindcss/vite` (Tailwind v4)
- **Zustand 5** for state management
- **Axios** for HTTP with a request interceptor for JWT attachment and a response interceptor for 401 redirect
- **React Router v7** for routing
- **date-fns** for date formatting
- **lucide-react** for icons

### Project layout

```
src/
  api/          — Axios wrappers: client.ts, auth.ts, tasks.ts, projects.ts
  store/        — Zustand stores: auth.ts, tasks.ts, theme.ts
  types/        — index.ts: all shared TypeScript types
  pages/        — Today, Upcoming, Inbox, ProjectView, Login, Register
  components/
    Layout/     — AppLayout (route shell), Sidebar
    Task/       — TaskRow, TaskList, TaskDetailModal, AddTaskForm, ProgressRing
```

### State management

`useTasksStore` (Zustand) holds the task tree returned by the API as `Task[]`, where each `Task` has a nested `children: Task[]`. The full subtree is always present because the API always returns tasks with all descendants loaded.

Tree mutations (`replaceTask`, `removeTask`, `insertChild`) walk the nested structure recursively and return a new tree — they never mutate in place.

Modal state (`modalTaskId`) lives in the tasks store so it can be triggered from any component in the tree.

### Auth

JWT is stored in `localStorage` under `openplan_token`. The axios interceptor in `client.ts` attaches it to every request and redirects to `/login` on 401. The user object is stored under `openplan_user` and rehydrated into the auth store on page load.

### Routing

React Router v7. All authenticated views are children of `AppLayout`, which renders the sidebar and an `<Outlet>`. Login/Register are standalone routes. `AppLayout` also renders `TaskDetailModal` when `modalTaskId` is set.

### Theme

Theme preference (`system` / `light` / `dark`) is stored in `localStorage` under `openplan_theme`. The `useThemeStore` store manages it. On load, `main.tsx` applies the initial theme by adding or removing the `.dark` class from `document.documentElement`. Tailwind v4 uses `@custom-variant dark` for class-based dark mode.

### Task model rules (frontend invariants)

These match the server-side rules and must be preserved in any UI or API changes:

1. **Sequential checkbox** — ticking a sequential parent completes its *next uncompleted child*, not the parent itself
2. **Parallel checkbox** — ticking a parallel parent with children completes *all children* recursively
3. **Sequential progress** — children after the first uncompleted one count toward the denominator but contribute 0 to the numerator
4. **`effectivePriority`** — minimum P-number across all uncompleted descendants (including self)
5. **Cascading cancel** — cancelling a task recursively cancels all descendants
6. **`completedAt`** — set automatically by the server; never set it from the client
