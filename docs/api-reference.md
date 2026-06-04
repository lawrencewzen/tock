# TickTick / Dida365 Open API Reference

Single source of truth for tock's implementation. Compiled from the official
Open API documentation (developer.ticktick.com / developer.dida365.com) plus
behaviors verified against the live TickTick API on 2026-06-03. tock is a
clean-room implementation based solely on this document — not on any existing
client's source code.

## Providers

TickTick (international) and Dida365 (China) expose the identical API on
different domains:

| | ticktick | dida |
|---|---|---|
| Authorize | `https://ticktick.com/oauth/authorize` | `https://dida365.com/oauth/authorize` |
| Token | `https://ticktick.com/oauth/token` | `https://dida365.com/oauth/token` |
| API base | `https://api.ticktick.com/open/v1` | `https://api.dida365.com/open/v1` |

Accounts are separate between the two providers.

## OAuth 2.0

1. **Authorize** (browser): `GET {authorize}?client_id=...&scope=tasks:write tasks:read&state=...&redirect_uri=...&response_type=code`
2. **Token exchange**: `POST {token}` — form-urlencoded body
   `grant_type=authorization_code, code, redirect_uri` with HTTP Basic auth
   (`client_id:client_secret`).
3. **Refresh**: `POST {token}` — `grant_type=refresh_token, refresh_token`,
   same Basic auth. (Verified working against live TickTick.)
4. Token response JSON: `access_token`, `refresh_token`, `expires_in`
   (seconds), `token_type`.
5. All API requests: header `Authorization: Bearer {access_token}`.

## Task endpoints

| Operation | Method & path | Notes |
|---|---|---|
| Get | `GET /project/{projectId}/task/{taskId}` | returns Task |
| Create | `POST /task` | body: Task; required `title`, `projectId` |
| Update | `POST /task/{taskId}` | body: Task; required `id`, `projectId` — **see warning** |
| Complete | `POST /project/{projectId}/task/{taskId}/complete` | empty body |
| Delete | `DELETE /project/{projectId}/task/{taskId}` | no response body |

> ⚠️ **Update warning (verified live)**: the update body MUST carry a
> non-empty `projectId`. If `projectId` is empty/missing, the API silently
> creates a NEW task instead of updating the existing one. tock therefore
> always updates via read-modify-write: GET the task, mutate the requested
> fields, POST the whole object back with `id` + `projectId` intact.

Additional endpoints documented but not used in v0.1: `POST /task/move`,
`POST /task/completed`, `POST /task/filter`.

## Project endpoints

| Operation | Method & path | Notes |
|---|---|---|
| List | `GET /project` | returns Project[]; **does NOT include Inbox** |
| Get | `GET /project/{projectId}` | |
| Data (with tasks) | `GET /project/{projectId}/data` | returns `{project, tasks, columns}`; accepts the literal id `inbox` |
| Create | `POST /project` | required `name` |
| Update | `POST /project/{projectId}` | |
| Delete | `DELETE /project/{projectId}` | |

The Inbox is a real project with the well-known id `inbox` but is omitted from
`GET /project`; clients that want it in listings must append it manually.

## Task object

| Field | Type | Notes |
|---|---|---|
| id | string | |
| projectId | string | |
| title | string | |
| content | string | free-form notes |
| desc | string | checklist description |
| isAllDay | boolean | |
| startDate | datetime | format below |
| dueDate | datetime | format below |
| completedTime | datetime | |
| timeZone | string | e.g. `America/Los_Angeles` |
| priority | int | 0=None, 1=Low, 3=Medium, 5=High |
| status | int | 0=Open, 2=Completed |
| reminders | string[] | e.g. `TRIGGER:P0DT9H0M0S` |
| repeatFlag | string | e.g. `RRULE:FREQ=DAILY;INTERVAL=1` |
| sortOrder | int64 | |
| tags | string[] | |
| items | ChecklistItem[] | subtasks |
| kind | string | `TEXT` / `NOTE` / `CHECKLIST` |

ChecklistItem: `id, title, status, completedTime, isAllDay, sortOrder,
startDate, timeZone`.

## Project object

| Field | Type | Notes |
|---|---|---|
| id | string | |
| name | string | |
| color | string | hex, e.g. `#F18181` |
| sortOrder | int64 | |
| closed | boolean | |
| groupId | string | |
| viewMode | string | `list` / `kanban` / `timeline` |
| permission | string | `read` / `write` / `comment` |
| kind | string | `TASK` / `NOTE` |

## Date format

API datetimes use `yyyy-MM-dd'T'HH:mm:ssZ` with a numeric zone offset and no
milliseconds, e.g. `2026-06-02T15:04:05+0000`. Note this differs from JS
`Date.toISOString()` (`2026-06-02T15:04:05.000Z`) — clients must format
explicitly.

## Error behavior

Errors come back as non-2xx with a JSON or text body; 401/403/404 are the
documented codes. Treat any non-2xx as failure and surface the body.
