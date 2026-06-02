# API Reference

All endpoints are under `/api/v1/`. All endpoints except `/auth/register` and `/auth/login` require a JWT in the `Authorization: Bearer <token>` header.

Responses are JSON. Enums are returned as strings (e.g. `"Parallel"`, `"P1"`, `"Scheduled"`).

---

## Auth

### `POST /auth/register`

Register a new account.

**Request**
```json
{ "email": "user@example.com", "password": "secret", "displayName": "Alice" }
```

**Response `200`**
```json
{
  "accessToken": "eyJ...",
  "userId": "uuid",
  "email": "user@example.com",
  "displayName": "Alice"
}
```

---

### `POST /auth/login`

**Request**
```json
{ "email": "user@example.com", "password": "secret" }
```

**Response `200`** — same shape as register.

---

## Tasks

### Task object

```json
{
  "id": "uuid",
  "ownerId": "uuid",
  "projectId": "uuid | null",
  "parentId": "uuid | null",
  "title": "string",
  "description": "string | null",
  "taskType": "Parallel | Sequential",
  "weight": 1.0,
  "priority": "P1 | P2 | P3 | P4",
  "effectivePriority": "P1 | P2 | P3 | P4",
  "status": "Scheduled | Active | Completed | Cancelled",
  "startAt": "ISO 8601",
  "dueAt": "ISO 8601",
  "completedAt": "ISO 8601 | null",
  "sortOrder": 0,
  "progress": 0.6,
  "completedChildCount": 3,
  "totalChildCount": 5,
  "nextChildTitle": "string | null",
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601",
  "children": [/* recursive Task[] */]
}
```

**Computed fields** (derived on read, not stored):
- `effectivePriority` — minimum P-number across all uncompleted descendants
- `progress` — weighted completion ratio (0.0–1.0)
- `completedChildCount` / `totalChildCount` — direct children counts
- `nextChildTitle` — title of the next uncompleted child (sequential tasks only)
- `children` — fully loaded recursive subtree

---

### `GET /tasks?view=<view>`

Returns root tasks (no parent) filtered by view. Each task includes its full subtree.

**Views:** `today`, `upcoming`, `inbox`, `project` (used internally), or any other string returns all root tasks.

---

### `GET /tasks/project/{projectId}`

Returns root tasks belonging to the given project, with full subtrees.

---

### `GET /tasks/{id}`

Returns a single task with its full subtree.

**Responses:** `200` Task object · `404` Not found

---

### `POST /tasks`

Create a task.

**Request**
```json
{
  "title": "string",
  "description": "string (optional)",
  "projectId": "uuid (optional)",
  "parentId": "uuid (optional)",
  "taskType": "Parallel",
  "weight": 1.0,
  "priority": "P4",
  "startAt": "ISO 8601",
  "dueAt": "ISO 8601",
  "sortOrder": 0
}
```

**Response `200`** — Task object.

---

### `PUT /tasks/{id}`

Update a task. All fields are optional; only provided fields are changed.

**Request**
```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "projectId": "uuid (optional)",
  "taskType": "Parallel | Sequential (optional)",
  "weight": 1.0,
  "priority": "P1 | P2 | P3 | P4 (optional)",
  "status": "Scheduled | Active | Completed | Cancelled (optional)",
  "startAt": "ISO 8601 (optional)",
  "dueAt": "ISO 8601 (optional)",
  "sortOrder": 0
}
```

**Status change side effects:**
- Setting `status: "Completed"` sets `completedAt` to now.
- Setting `status: "Cancelled"` recursively cancels all descendants.
- Completing the last child of a parent auto-completes the parent (cascade up).

**Response `200`** — Updated Task object · `404` Not found

---

### `POST /tasks/{id}/tick`

Advance a task's completion state:

- **Leaf task** → marked `Completed`
- **Sequential task with children** → next uncompleted child is completed (cascades through its subtree)
- **Parallel task with children** → all children completed recursively

After any completion, ancestors are auto-completed if all their children are now done.

**Response `200`** — Updated Task object · `404` Not found

---

### `DELETE /tasks/{id}`

Delete a task and all its descendants.

**Response `204`** · `404` Not found

---

## Projects

### Project object

```json
{
  "id": "uuid",
  "ownerId": "uuid",
  "name": "string",
  "color": "#6366f1",
  "isArchived": false,
  "sortOrder": 0,
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601"
}
```

---

### `GET /projects`

Returns all non-archived projects owned by the authenticated user, ordered by `sortOrder`.

---

### `POST /projects`

**Request**
```json
{ "name": "string", "color": "#hexcolor" }
```

**Response `200`** — Project object.

---

### `PUT /projects/{id}`

**Request** — same optional fields as POST.

**Response `200`** — Updated Project object · `404` Not found

---

### `DELETE /projects/{id}`

**Response `204`** · `404` Not found
