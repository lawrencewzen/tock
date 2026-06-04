# tock

A machine-friendly CLI for [TickTick](https://ticktick.com) / [滴答清单
(Dida365)](https://dida365.com), built for AI-skill todo workflows.

`tock` is a clean-room implementation against the official Open API
(see `docs/api-reference.md`) — TypeScript + Bun, MIT licensed.

## Why

- **Machine-first**: every read command supports `-o json`; empty lists print
  `[]`; errors go to stderr with non-zero exit codes.
- **Dual provider**: TickTick (international) and Dida365 (China) share one
  API — pick per account with `--provider`.
- **Safe updates**: `task update` is read-modify-write and always carries the
  task's `projectId`, avoiding the API quirk where an empty `projectId`
  silently creates a duplicate task.

## Install

Requires [Bun](https://bun.sh) >= 1.3.14 (earlier versions emit
broken-signature binaries on macOS).

```bash
bun install
bun run build          # produces the single-file ./tock binary
mv tock ~/bin/         # or anywhere on PATH
```

## Setup

Create an OAuth app at [developer.ticktick.com](https://developer.ticktick.com)
(or developer.dida365.com) with redirect URI `http://localhost:8080`, then:

```bash
export TOCK_CLIENT_ID=...        # TICKTICK_CLIENT_ID also accepted
export TOCK_CLIENT_SECRET=...    # (or keep them in a .env in the cwd)
tock init                        # opens the browser; --provider dida for 滴答清单
```

Tokens live in `~/.config/tock/` (0600) and refresh automatically.

## Commands

```bash
tock project list [-f text] [-o json]   # all projects incl. Inbox
tock project use <name|id>              # set the default project

tock task create -t "Title" [-c notes] [-p high] [--tags a,b] \
                 [--start 2026-06-05T09:00:00Z] [--due 2026-06-05T18:00:00Z] \
                 [--all-day] [--tz Asia/Shanghai] [-o json]
tock task list [-p medium] [-t tag] [-o json]
tock task show <id> [-o json]
tock task update <id> [field flags]     # only passed flags change
tock task complete <id>
tock task delete <id>                   # immediate, no confirmation

# every task command accepts -P <project-id> to override the default
```

Priorities: `none|low|medium|high`. Dates: RFC3339 in, API format out.

## Development

```bash
bun test               # unit + mock-server integration tests
bunx tsc --noEmit      # typecheck
scripts/e2e.sh         # full lifecycle against the real account (needs init)
```

## License

MIT
