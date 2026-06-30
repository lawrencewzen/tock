<div align="center">

# 🕐 tock

**A machine-friendly TickTick / Dida365 CLI, built for AI-skill todo workflows**

_Manage your todos in natural language — from any agent, in a single command._

<p>
  <a href="https://github.com/aisparkedu/tock/releases"><img src="https://img.shields.io/badge/version-0.1.1-d83931?style=flat-square" alt="version"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-22863a?style=flat-square" alt="license"></a>
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/Bun-1.3.14%2B-000000?style=flat-square&logo=bun&logoColor=white" alt="bun"></a>
  <img src="https://img.shields.io/badge/TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="typescript">
  <img src="https://img.shields.io/badge/platform-macOS%20%26%20Linux-555555?style=flat-square" alt="platform">
</p>

<p>
  <img src="https://img.shields.io/badge/TickTick-international-4772fa?style=flat-square" alt="ticktick">
  <img src="https://img.shields.io/badge/Dida365-%E6%BB%B4%E7%AD%94%E6%B8%85%E5%8D%95-ffb400?style=flat-square" alt="dida365">
  <img src="https://img.shields.io/badge/Claude%20Code%20%26%20Agents-ready-8a3ffc?style=flat-square&logo=anthropic&logoColor=white" alt="agents">
</p>

<p>
  <a href="https://github.com/aisparkedu"><img src="https://img.shields.io/badge/AI%20Spark-Open%20Knowledge%20Community-d83931?style=for-the-badge" alt="AI Spark"></a>
  <a href="https://github.com/aisparkedu/knowledge-base"><img src="https://img.shields.io/badge/Knowledge%20Base-2b6cb0?style=for-the-badge&logo=readthedocs&logoColor=white" alt="Knowledge Base"></a>
</p>

🤖 Machine-first&nbsp;&nbsp;·&nbsp;&nbsp;🌐 Dual provider&nbsp;&nbsp;·&nbsp;&nbsp;🛡️ Safe updates&nbsp;&nbsp;·&nbsp;&nbsp;🗣️ Agent skill built in

[English](./README.md) · [中文](./README_CN.md) · An [AI Spark](https://github.com/aisparkedu) open-source project

</div>

---

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

### 1. Register an OAuth app

Sign in with your normal account at
[developer.ticktick.com](https://developer.ticktick.com) for TickTick, or
[developer.dida365.com](https://developer.dida365.com) for 滴答清单, create a
new app, and fill in **App Setting**:

| Field              | Value                                                             |
| ------------------ | ----------------------------------------------------------------- |
| Name (required)    | anything, e.g. `tock`                                             |
| OAuth redirect URL | `http://localhost:8080` — must be exact; `tock init` listens here |
| App Icon           | leave empty                                                       |
| App Service URL    | leave empty                                                       |
| Description        | leave empty                                                       |

Click **Save**; the page then shows the generated **Client ID** and
**Client Secret** with Copy buttons (the *Reset* link regenerates the secret
if it ever leaks).

### 2. Authenticate

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

## Agent skill

`skill/SKILL.md` teaches [Claude Code](https://claude.com/claude-code) — and any
agent that can load a `SKILL.md` — to manage your todos through tock:
natural-language create/query/complete, provider switching, and guided OAuth
setup. Install it with:

```bash
scripts/install-skill.sh        # copies to ~/.claude/skills/tock/
                                # -f overwrites a locally customized copy
```

Then just tell your agent things like 「明天下午3点提醒我给客户回电话」 or
「今天有什么任务」.

## Development

```bash
bun test               # unit + mock-server integration tests
bunx tsc --noEmit      # typecheck
scripts/e2e.sh         # full lifecycle against the real account (needs init)
```

## About AI Spark

> **AI Spark is an open-source knowledge community focused on hands-on AI and
> super-individual growth**, maintained by people building real AI products. It
> covers AI fundamentals, tools & models, AI coding & agents, content creation,
> and productivity — from getting started, to practical workflows, to turning
> AI into income. All materials are public and free.

`tock` is one of AI Spark's open-source tools — turning *"manage your todos with
AI"* into a machine-friendly, agent-callable CLI.

- 📚 **Knowledge base** (中文): https://github.com/aisparkedu/knowledge-base
- 🧑‍💻 **GitHub org**: https://github.com/aisparkedu

## License

MIT
