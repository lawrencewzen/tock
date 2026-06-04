---
name: tock
description: 用 tock CLI 管理用户的 TickTick / 滴答清单待办。当用户想添加、查询、修改、完成或删除待办/任务/提醒时使用——例如「加个待办」「明天下午提醒我…」「今天有什么任务」「把 X 标记完成」「购物清单里加上牛奶」「这周的任务安排」。即使用户没有提到 TickTick、滴答清单或 tock，只要意图是管理个人待办、任务清单或提醒事项，就使用本 skill。
---

# tock — TickTick / 滴答清单待办管理

`tock` 是一个 machine-friendly 的 TickTick CLI，需在 PATH 上（安装与 OAuth
配置见 <https://github.com/lawrencewzen/tock> 的 README）。token 配置好后会
自动刷新；如遇认证错误，引导用户按下文「注册 OAuth app」操作并自己运行
`tock init`（交互式，会打开浏览器）。

## 核心约定

- 所有读命令都加 `-o json`，解析 JSON 而不是抓取文本输出。空列表输出 `[]`。
- 错误走 stderr + 非零退出码，检查后向用户转述要点即可。
- 向用户展示结果时用简洁的总结（标题、时间、优先级），不要直接贴 JSON。

## 账号与 provider 切换

tock 支持两个服务：TickTick（国际版）和滴答清单（Dida365）。默认账号是
`~/.config/tock/` 里初始化的那个；如果用户有第二个账号，用 `TOCK_CONFIG_DIR`
实现双账号共存（约定目录 `~/.config/tock-dida` 或 `~/.config/tock-ticktick`）：

```bash
tock task list                                        # 默认账号
TOCK_CONFIG_DIR=~/.config/tock-dida tock task list    # 第二账号
```

用户说「切到滴答清单」「切到 TickTick」时，本次会话内后续 tock 命令都加
（或去掉）对应前缀。每次会话开始用默认账号。

如果加前缀后报错且对应目录下没有 `token.json`，说明该账号还没初始化——按
「注册 OAuth app」引导用户拿到凭据，然后让用户自己在对话里运行：
`! TOCK_CONFIG_DIR=<目录> TOCK_CLIENT_ID=<id> TOCK_CLIENT_SECRET=<secret> tock init --provider <ticktick|dida>`
（client 凭据只在 init 时需要，token 里会留存供自动刷新。）

### 注册 OAuth app（引导用户操作）

用户需要 client 凭据时，告诉用户：用平时的账号登录
developer.ticktick.com（TickTick）或 developer.dida365.com（滴答清单），
新建一个 app，在 **App Setting** 表单里填：

- **Name**（必填）：随便起，如 `tock`
- **OAuth redirect URL**：`http://localhost:8080` —— 必须一字不差，
  `tock init` 会在本地监听这个端口接收授权回调
- App Icon / App Service URL / Description：留空即可

点 **Save** 后页面顶部会生成 **Client ID** 和 **Client Secret**（有 Copy
按钮）。提醒用户：Secret 旁的 *Reset* 链接可以在泄露时重新生成；截图发给
别人前注意遮挡这两个值。

## 项目（清单）模型

TickTick 的「清单」在 API 里叫 project。tock 有一个默认项目
（存于 `~/.config/tock/config.json`），所有 task 命令默认作用于它。

- `tock project list -o json` — 列出全部清单（含 Inbox，id 为 `inbox`）。
- `tock project use <名称|id>` — 切换默认项目（持久化，影响以后的会话）。
- 临时针对其他清单操作用全局 `-P`，**放在子命令之前**：
  `tock -P <projectId> task list -o json`。

优先用 `-P` 而不是 `project use`——后者会改变用户的持久默认值。用户说
「购物清单」「工作任务」这类名字时，先 `project list` 按名称找到 id 再 `-P`。

## 任务命令

```bash
tock task create -t "标题" [-c 备注] [-p none|low|medium|high] [--tags a,b] \
                 [--start RFC3339] [--due RFC3339] [--all-day] [--tz Asia/Shanghai] -o json
tock task list [-p <最低优先级>] [-t <tag>] -o json   # 仅列当前/指定项目的未完成任务
tock task show <id> -o json
tock task update <id> [同 create 的字段 flag]          # 只改传入的 flag，其余不动
tock task complete <id>
tock task delete <id>                                  # 立即删除，无确认
```

JSON 里的字段对照：`priority` 是数字（none=0, low=1, medium=3, high=5）；
`status` 0=未完成；`isAllDay` 全天任务。

## 日期与时间

- `--start` / `--due` 接收 RFC3339。用户说「明天下午 3 点」这类相对时间，
  先用 `date` 命令算出当前日期再换算成具体时间，不要凭感觉猜今天是几号。
- 带时间的任务加 `--tz <IANA 时区>` 并用该时区的 offset 写时间（如
  `2026-06-05T15:00:00+08:00`）。时区以用户说明为准，未说明时用系统本地
  时区（macOS/Linux 看 `readlink /etc/localtime`）。
- 只有日期没有时刻的（「周五前」「明天要做」）用 `--due` + `--all-day`。
- 输出里的时间是 `+0000` UTC，向用户转述时换算回用户时区。

## 常见工作流

- **「今天/这周有什么任务」**：`task list` 只覆盖一个项目。先 `project list`，
  再对每个项目 `tock -P <id> task list -o json`，合并后按 due 日期过滤排序。
  没有截止日期的任务单独列一组，不要丢掉。跳过 `closed: true` 的归档清单。
- **「把 X 标记完成 / 改一下 X」**：先 `task list` 按标题模糊匹配找到 id；
  多个候选时把候选列给用户确认，不要猜。
- **修改任务**：`task update` 只传需要变的 flag 即可，read-modify-write
  由 tock 内部处理。

## 安全

- `task delete` 立即生效且不可恢复。除非用户明确说了删哪个，删除前先把
  任务标题报给用户确认。用户说「完成了」用 `complete`，不要用 `delete`。
- 不要主动运行 `tock init` / `tock reset`（会作废现有 token 并需要浏览器交互）。
