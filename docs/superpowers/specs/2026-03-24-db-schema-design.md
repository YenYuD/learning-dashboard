# Database Schema Design

**Date:** 2026-03-24
**Project:** Learning & Growth Dashboard

## Overview

Four tables: `board`, `list`, `task`, `time_entry`.
Two board types supported: task-based (Kanban-style) and time-only (skill tracking).
Auth is deferred to Phase 2 — `user_id` is reserved on `board` but no `user` table yet.

## Enums

```prisma
enum BoardType {
  TASK_BASED  // default — language learning, programming, etc.
  TIME_ONLY   // skill tracking without tasks — skiing, dancing, etc.
}
```

## Tables

### board
| Field | Type | Notes |
|---|---|---|
| id | String (uuid) | Primary key |
| name | String | Board name |
| type | BoardType | Default: TASK_BASED |
| icon | String? | Lucide icon name e.g. "BookOpen" |
| color | String? | Background color hex |
| order | Int | Display order (drag-and-drop) |
| user_id | String | Reserved for Phase 2 auth |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto-updated |

### list
| Field | Type | Notes |
|---|---|---|
| id | String (uuid) | Primary key |
| board_id | String | FK → board |
| name | String | Column name e.g. "To Do" |
| order | Int | Display order (drag-and-drop) |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto-updated |

### task
| Field | Type | Notes |
|---|---|---|
| id | String (uuid) | Primary key |
| list_id | String | FK → list |
| name | String | Task name |
| order | Int | Display order (drag-and-drop) |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto-updated |

### time_entry
| Field | Type | Notes |
|---|---|---|
| id | String (uuid) | Primary key |
| board_id | String | FK → board (required) |
| task_id | String? | FK → task (null for TIME_ONLY boards) |
| start_time | DateTime? | Timer start |
| end_time | DateTime? | Timer end |
| duration | Int | Minutes (required) |
| note | String? | Optional note |
| createdAt | DateTime | Auto |

## Key Decisions

- **No icon table** — Lucide icon names are stored as plain strings; no need for a separate table
- **No entry type field** — Skipped for MVP; TIMER vs MANUAL distinction not needed yet
- **order on board/list/task** — Required for drag-and-drop reordering at all three levels
- **task_id optional on time_entry** — Allows TIME_ONLY boards to log time without tasks
- **user_id on board** — Placeholder for Phase 2 NextAuth.js integration (Google OAuth planned)
