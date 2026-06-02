# OpenPlan — Product Requirements Document

**Version:** 1.1
**Status:** Draft
**Project:** OpenPlan — Self-hosted, open-source task manager

---

## 1. Overview

OpenPlan is a self-hostable, open-source task management application inspired by Todoist. It provides a structured way to manage tasks with sub-tasks, weighted progress tracking, and real-time sync across devices. The UI is modern and clean, defaulting to the system theme with the ability to explicitly set light or dark mode.

---

## 2. Tech Stack

| Layer              | Technology                                      |
|--------------------|-------------------------------------------------|
| Backend            | .NET Core (C#)                                  |
| Database           | PostgreSQL                                      |
| Mobile & Desktop   | Kotlin Multiplatform (KMP) + Compose Multiplatform |
| Web Client         | React + TypeScript                              |
| Auth               | JWT (access + refresh tokens)                   |
| Sync Transport     | WebSockets (push) with HTTP REST fallback       |
| Containerisation   | Docker + Docker Compose                         |

---

## 3. Authentication & User Management

- **Registration** — email and password. Password hashed with bcrypt or Argon2.
- **Login** — returns a short-lived JWT access token and a long-lived refresh token stored server-side.
- **Token refresh** — clients silently refresh the access token using the refresh token.
- **Logout** — invalidates the refresh token server-side.
- **Multi-device** — a user may be logged in on many devices simultaneously; each holds its own refresh token.
- **Account settings** — change display name, email, and password.
- **Optional (v2):** email verification, password reset via email.

---

## 4. Core Data Model

### 4.1 Task

| Field             | Type                                                              | Notes                                                                 |
|-------------------|-------------------------------------------------------------------|-----------------------------------------------------------------------|
| `id`              | UUID                                                              |                                                                       |
| `owner_id`        | UUID (FK → User)                                                  |                                                                       |
| `project_id`      | UUID (FK → Project)                                               | Nullable                                                              |
| `parent_id`       | UUID (FK → Task)                                                  | Null = root task                                                      |
| `title`           | string                                                            | Required                                                              |
| `description`     | string                                                            | Optional; rich text                                                   |
| `task_type`       | enum: `sequential` / `parallel`                                   | Applies when task has sub-tasks; default `parallel`                   |
| `weight`          | float                                                             | Default 1.0; used in parent progress calculation                      |
| `priority`        | enum: `P1` / `P2` / `P3` / `P4`                                  | P1 = highest; P4 = default                                            |
| `status`          | enum: `scheduled` / `active` / `completed` / `cancelled`          |                                                                       |
| `start_at`        | timestamptz                                                       | Required; defaults to 09:00 local time if time is omitted             |
| `due_at`          | timestamptz                                                       | Required; defaults to 17:00 local time if time is omitted             |
| `completed_at`    | timestamptz                                                       | Set automatically when status changes to `completed`                  |
| `created_at`      | timestamptz                                                       |                                                                       |
| `updated_at`      | timestamptz                                                       |                                                                       |
| `section_id`      | UUID (FK → Section)                                               | Nullable                                                              |
| `labels`          | string[]                                                          |                                                                       |
| `assignee_id`     | UUID (FK → User)                                                  | Nullable; for shared projects                                         |
| `recurrence_rule` | string                                                            | iCal RRULE format; nullable                                           |

**Status definitions:**
- `scheduled` — task is planned; `start_at` may be in the future. Progress can already accrue.
- `active` — user has explicitly started the task.
- `completed` — all work done. Auto-set when all children complete (see Section 5).
- `cancelled` — task abandoned. Recursively cancels all children.

### 4.2 Computed Fields (derived on read, not stored)

- **`effective_priority`** — the highest priority (lowest P-number) across the flattened set of all uncompleted descendants, including the task's own `priority`.
- **`progress`** — weighted completion ratio across direct sub-tasks (see Section 6).

### 4.3 Project

| Field         | Type    | Notes                        |
|---------------|---------|------------------------------|
| `id`          | UUID    |                              |
| `owner_id`    | UUID    |                              |
| `name`        | string  |                              |
| `color`       | string  | Hex color                    |
| `is_shared`   | bool    | Enables collaborators        |
| `is_archived` | bool    |                              |
| `sort_order`  | int     | User-defined ordering        |

### 4.4 Section

Sections are named groupings within a project.

| Field        | Type   |
|--------------|--------|
| `id`         | UUID   |
| `project_id` | UUID   |
| `name`       | string |
| `sort_order` | int    |

### 4.5 Label

Global per-user labels with a name and color, reusable across tasks.

---

## 5. Task Hierarchy & Types

- Tasks may have zero or more sub-tasks. Sub-tasks may themselves have sub-tasks — the tree is unbounded in depth.
- Every task has a `task_type` (`parallel` by default). It is only meaningful when the task has children.
- **Sequential tasks must have at least one child** — `task_type = sequential` is invalid on a leaf task.

### 5.1 Task type behaviour

#### Parallel
- All sub-tasks can be worked on simultaneously.
- Ticking the checkbox on a parallel task with children marks **all children as completed**, cascading recursively down the full subtree (same logic as cancellation).
- Ticking the checkbox on a leaf task marks it completed directly.

#### Sequential
- Sub-tasks must be completed in order. Only the first uncompleted sub-task is active at any time.
- **Ticking the checkbox on a sequential task does not mark the parent completed.** Instead it marks the next uncompleted child as completed.
- When that child itself has children, completing it cascades recursively through its subtree.
- A sequential task completes automatically when all its children are completed.
- For sequential tasks, sub-tasks after the first uncompleted one contribute 0 to progress.

### 5.2 Completion rules (apply to all task types)

- **A task that has children is never directly completed by a user action on the parent.** Completion is always derived from children.
- **Auto-complete:** When all children of any task are completed, the parent is automatically set to `completed`, regardless of its current status (`scheduled` or `active`). `completed_at` is set at this moment.
- **Cascading cancel:** Cancelling a task recursively cancels all its sub-tasks.

### 5.3 UI hints

- Sequential tasks display a **stepped/arrow icon** in place of the standard checkbox to signal the different tap behaviour.
- Sequential tasks display a subtitle beneath the title: **`Next: [title of next uncompleted child]`** (muted text, truncated to one line with ellipsis). Hidden once the task is completed.

---

## 6. Progress Calculation

Progress for a task with sub-tasks is a weighted ratio:

```
progress = Σ(weight_i × completion_i) / Σ(weight_i)
```

Where:
- `weight_i` is the `weight` of each direct sub-task (default 1.0).
- `completion_i` is the recursive progress of sub-task `i` (0.0–1.0); for a leaf task it is 1.0 if `completed` or `cancelled`, otherwise 0.0.
- For a **sequential** task, sub-tasks after the first uncompleted one contribute 0 to progress.

**Progress is independent of status.** A `scheduled` task can have non-zero progress if some children have been completed ahead of time.

This is displayed as:
- A **circular progress indicator** (similar to Todoist's ring).
- A **fraction** showing completed count / total direct children (e.g. `3/5`).
- A **slim horizontal progress bar** beneath the task row (only when children exist).

---

## 7. Priority System

- Each task has an explicit `priority` field (P1–P4; P4 = default/lowest).
- **`effective_priority`** is computed recursively:
  - Collect the `priority` values of all uncompleted descendants (full subtree), plus the task's own `priority`.
  - `effective_priority` = the minimum P-number in that set (i.e. highest urgency).
- The UI displays `effective_priority` on parent tasks so urgency bubbles up the tree.
- Priority colour coding:
  - P1 = Red
  - P2 = Orange
  - P3 = Blue
  - P4 = No colour (default)

---

## 8. Dates & Recurrence

- Both `start_at` and `due_at` are required on every task.
- **Default time rules** when only a date is provided:
  - `start_at` defaults to 09:00 local time.
  - `due_at` defaults to 17:00 local time.
- Overdue tasks (past `due_at` and not completed) are visually highlighted.
- **Recurring tasks** are defined via an iCal RRULE string (e.g. `FREQ=WEEKLY;BYDAY=MO`). On completion, the server automatically creates the next occurrence with updated start and due dates.
- Clients support natural language date input (e.g. "next Monday at 3pm", "every weekday").

---

## 9. Sync & Real-Time Updates

- The server maintains a **sync log** table: every mutation (create, update, delete) is appended with a `sequence_number` scoped per user/project.
- **Connected clients** receive changes via WebSocket push immediately.
- **Reconnecting clients** send their last known `sequence_number`; the server replays all missed events since that point.
- **Conflict resolution** — last-write-wins by `updated_at` timestamp at the field level (field-level merging, not whole-record replacement).
- Clients operate **optimistically**: changes are applied locally immediately, then confirmed or corrected by the server response.
- **Offline support**: mutations made while offline are queued locally and replayed on reconnect.

---

## 10. API Design

- RESTful HTTP API for all CRUD operations (tasks, projects, sections, labels, users).
- WebSocket endpoint (`/ws`) for real-time sync events.
- All endpoints require a valid JWT except `/auth/register` and `/auth/login`.
- API versioned under `/api/v1/`.
- Responses in JSON. Pagination via cursor (not offset).

### Key Endpoints

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout

GET    /api/v1/tasks
POST   /api/v1/tasks
GET    /api/v1/tasks/{id}
PUT    /api/v1/tasks/{id}
DELETE /api/v1/tasks/{id}
GET    /api/v1/tasks/{id}/subtasks

GET    /api/v1/projects
POST   /api/v1/projects
PUT    /api/v1/projects/{id}
DELETE /api/v1/projects/{id}

GET    /api/v1/projects/{id}/sections
POST   /api/v1/projects/{id}/sections

GET    /api/v1/labels
POST   /api/v1/labels
```

---

## 11. Client Features

Applies to all clients: React web app, KMP Android/iOS, and KMP desktop.

### 11.1 Views

- **Today** — tasks due or starting today.
- **Upcoming** — tasks in a calendar-style view (next 7 days and by month).
- **Inbox** — tasks not assigned to any project.
- **Projects sidebar** — list of all projects; click to view project tasks grouped by section.
- **Filters & Labels** — filter tasks by label, priority, assignee, and due date range.
- **Search** — full-text search across task titles and descriptions.

### 11.2 Task Detail

- Edit all task fields inline.
- Add, reorder, and delete sub-tasks.
- Toggle `task_type` between sequential and parallel.
- Circular progress indicator with fraction count.
- Comment thread (per task).
- Activity log showing who changed what and when.

### 11.3 UX & Interaction

- Drag-and-drop reordering of tasks and sections.
- Natural language date input.
- Quick-add task bar (keyboard shortcut on desktop).
- Offline indicator with queued-changes badge.

---

## 12. UI Style & Theming

- **Visual style:** Modern, clean, and minimal. Uncluttered layouts, consistent spacing, readable typography, and purposeful use of colour.
- **Theme:** Defaults to the system theme (light or dark based on OS/browser preference).
- **Explicit override:** Users can explicitly set the theme to light or dark in settings. The preference is stored per account and synced across devices.
- **Priority colour coding:** P1 = Red, P2 = Orange, P3 = Blue, P4 = No colour.
- **Status visual treatment:**
  - `scheduled` — muted/grey styling
  - `active` — default styling, subtle left accent border
  - `completed` — strikethrough title, faded
  - `cancelled` — strikethrough + greyed out with cancelled badge

---

## 13. Comments & Activity

- Each task has a **comment thread** (author, text, timestamp).
- An **activity log** records all changes to a task: field changed, old value, new value, who made the change, and when. This is displayed in the task detail view.

---

## 14. Notifications

- **In-app notifications** for: task due soon (configurable lead time), task assigned to you, and comments on your tasks.
- **Push notifications** on mobile (FCM for Android, APNs for iOS) — optional; can be disabled per device.
- **Email notifications** — optional; requires SMTP configuration in the self-host environment config.

---

## 15. Self-Hosting & Deployment

- Full deployment via **Docker Compose** with one service each for the API server, PostgreSQL, and an optional reverse proxy (Caddy or Nginx).
- All configuration via environment variables (DB connection string, JWT secret, SMTP settings, etc.).
- A `config.example.env` file documents all available variables.
- Database migrations run automatically on server startup (via EF Core Migrations or Flyway).
- The React web client is served as static files from the API container or a dedicated static-file container.

---

## 16. Out of Scope for v1

The following are explicitly deferred to future versions:

- Third-party OAuth login (Google, GitHub, etc.)
- End-to-end encryption
- Public task sharing via link
- External integrations (Slack, GitHub, calendar sync) — the architecture should not preclude these

---

## 17. Prototype Scope (working prototype — deferred from v1)

The following are deferred from the initial working prototype to reduce time-to-ship:

- Refresh tokens / multi-device session management (prototype uses access token only)
- Labels and Sections
- Recurrence (RRULE)
- WebSocket real-time sync (prototype uses plain REST)
- Offline support and sync queue
- Comments and activity log
- Notifications (in-app, push, email)
- Search and Filters view
- Drag-and-drop reordering
- Natural language date input
- KMP mobile / desktop clients
- Shared projects and assignees
- Docker Compose / self-hosting configuration

---

*Document last updated: 2026-06-01*
