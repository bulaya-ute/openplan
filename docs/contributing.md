# Contributing

OpenPlan welcomes contributions. This guide covers what you need to know before opening a PR.

---

## Getting Started

1. Fork the repository and clone your fork
2. Follow [Setup & Self-Hosting](setup.md) to get the project running locally
3. Create a feature branch from `main`: `git checkout -b feat/your-feature`

---

## Project Principles

- **Prototype first, v1 second** — the current codebase is a prototype. Before adding a feature, check [roadmap.md](roadmap.md) to see if it's already planned and how it fits in.
- **Don't over-engineer** — prefer the simplest implementation that works. Avoid abstractions that aren't justified by the current requirements.
- **Computed fields stay computed** — `progress`, `effectivePriority`, `completedChildCount`, `totalChildCount`, and `nextChildTitle` are intentionally derived at read time. Do not add stored columns for these.
- **Subtree invariants** — any code that maps `TaskItem` to `TaskResponse` must first call `LoadChildrenRecursiveAsync`. The tick and cancel cascades must be preserved exactly as specified in the requirements.

---

## Backend Conventions (.NET)

- Services live in `Services/`, one file per service. Business logic belongs in services, not controllers.
- Controllers are thin: validate auth, call a service method, return the result.
- DTOs (request/response records) live in `DTOs/`, separate from EF entities.
- New EF columns require a migration: `dotnet ef migrations add <Name> --project server/OpenPlan.API`.
- Use `DateTimeOffset` (not `DateTime`) for all timestamps. Store everything in UTC.

## Frontend Conventions (React/TypeScript)

- **No inline API calls in components** — use the Zustand store actions which call the `api/` wrappers.
- **Tree mutations are recursive** — use `replaceTask`, `removeTask`, `insertChild` helpers in `store/tasks.ts`; never mutate task objects in place.
- **Types first** — update `src/types/index.ts` when the API response shape changes.
- **Tailwind only** — no additional CSS files or CSS-in-JS. Use `dark:` variants for dark mode.
- **Icons** — use `lucide-react`; do not add other icon libraries.

---

## Pull Requests

- Target `main`.
- Keep PRs focused — one feature or fix per PR.
- Include a short description of *why* the change is needed, not just what it does.
- If a PR implements a roadmap item, reference it in the description.

---

## Reporting Issues

Open a GitHub issue with:
- Steps to reproduce
- Expected vs. actual behaviour
- Browser / OS / .NET version (if relevant)
