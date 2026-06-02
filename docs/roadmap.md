# Roadmap

This document tracks features planned for future versions. The current codebase is a working **prototype** — see the [requirements doc](../openplan-requirements.md) for the full v1 spec.

---

## v1 — Full Release

These are deferred from the prototype but required for the v1 release:

### Auth & Sessions
- **Refresh tokens** — silent token renewal without re-login; each device holds its own refresh token
- **Multi-device session management** — list and revoke sessions per device
- **Email verification** on registration
- **Password reset** via email link

### Task Features
- **Labels** — global per-user labels with name and color, reusable across tasks
- **Sections** — named groups within a project with drag-and-drop ordering
- **Recurrence (RRULE)** — repeating tasks defined by iCal RRULE strings; on completion the server auto-creates the next occurrence
- **Natural language date input** — "next Monday at 3pm", "every weekday"
- **Drag-and-drop** — reorder tasks and sections within a view

### Sync & Offline
- **WebSocket real-time sync** — `POST /ws` push channel; server maintains a sync log with sequence numbers so reconnecting clients can replay missed events
- **Offline support** — mutations made while offline are queued locally and replayed on reconnect
- **Field-level conflict resolution** — last-write-wins by `updatedAt` at the field level

### Social / Collaboration
- **Shared projects** — invite collaborators with per-project roles
- **Assignees** — assign tasks to project collaborators
- **Comments** — per-task comment threads (author, text, timestamp)
- **Activity log** — records every field change, who made it, and when

### Notifications
- **In-app notifications** — task due soon (configurable lead time), assigned to you, comments on your tasks
- **Push notifications** — FCM (Android), APNs (iOS)
- **Email notifications** — requires SMTP config in self-host environment

### Views
- **Filters & Labels view** — filter tasks by label, priority, assignee, due date range
- **Search** — full-text search across task titles and descriptions

### Infrastructure
- **Docker Compose** — one-command self-hosting with API, PostgreSQL, and Caddy reverse proxy
- **Automated HTTPS** via Caddy with Let's Encrypt

---

## v2 — Future Enhancements

These are explicitly out of scope for v1 but may be added later:

### Native Clients
- **Android** — Kotlin Multiplatform + Compose Multiplatform
- **iOS** — Kotlin Multiplatform + Compose Multiplatform
- **Desktop** (macOS, Windows, Linux) — Kotlin Multiplatform + Compose Multiplatform

All native clients will share business logic and sync over the same REST/WebSocket API.

### Integrations
- **Calendar sync** — export tasks to CalDAV / iCal feeds
- **Slack integration** — receive notifications and create tasks from Slack
- **GitHub integration** — link tasks to issues and PRs

### Auth
- **Third-party OAuth** — Sign in with Google, GitHub, etc.

### Privacy
- **End-to-end encryption** — optional; encrypts task content before it reaches the server
- **Public task sharing** — share a task or project via a public read-only link
