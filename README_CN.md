<div align="center">

# 🕐 tock

**为 AI 工作流而生的 TickTick / 滴答清单命令行工具**

_用自然语言管理待办 —— 任何 Agent，一条命令搞定_

<p>
  <a href="https://github.com/aisparkedu/tock/releases"><img src="https://img.shields.io/badge/version-0.1.1-d83931?style=flat-square" alt="version"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-22863a?style=flat-square" alt="license"></a>
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/Bun-1.3.14%2B-000000?style=flat-square&logo=bun&logoColor=white" alt="bun"></a>
  <img src="https://img.shields.io/badge/TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="typescript">
  <img src="https://img.shields.io/badge/%E5%B9%B3%E5%8F%B0-macOS%20%26%20Linux-555555?style=flat-square" alt="platform">
</p>

<p>
  <img src="https://img.shields.io/badge/TickTick-%E5%9B%BD%E9%99%85%E7%89%88-4772fa?style=flat-square" alt="ticktick">
  <img src="https://img.shields.io/badge/%E6%BB%B4%E7%AD%94%E6%B8%85%E5%8D%95-Dida365-ffb400?style=flat-square" alt="dida365">
  <img src="https://img.shields.io/badge/Claude%20Code%20%26%20Agent-%E5%8D%B3%E8%A3%85%E5%8D%B3%E7%94%A8-8a3ffc?style=flat-square&logo=anthropic&logoColor=white" alt="agents">
</p>

<p>
  <a href="https://github.com/aisparkedu"><img src="https://img.shields.io/badge/AI%20Spark-%E5%BC%80%E6%BA%90%E7%9F%A5%E8%AF%86%E7%A4%BE%E5%8C%BA-d83931?style=for-the-badge" alt="AI Spark"></a>
  <a href="https://github.com/aisparkedu/knowledge-base"><img src="https://img.shields.io/badge/%E7%9F%A5%E8%AF%86%E5%BA%93-2b6cb0?style=for-the-badge&logo=readthedocs&logoColor=white" alt="知识库"></a>
</p>

🤖 机器友好&nbsp;&nbsp;·&nbsp;&nbsp;🌐 双平台&nbsp;&nbsp;·&nbsp;&nbsp;🛡️ 安全更新&nbsp;&nbsp;·&nbsp;&nbsp;🗣️ 内置 Agent skill

[English](./README.md) · [中文](./README_CN.md) · 一个 [AI Spark](https://github.com/aisparkedu) 开源项目

</div>

---

**tock** 是一个为 AI 工作流设计的命令行工具，用来管理你的 [TickTick](https://ticktick.com) / [滴答清单 (Dida365)](https://dida365.com) 待办事项。

它基于官方 Open API 构建（TypeScript + Bun），输出格式对机器友好，天生适合被 AI 调用。配套的 skill 让 Claude Code 等 Agent 直接用自然语言帮你管理任务，比如「明天下午三点提醒我给客户回电」。

---

## ✨ 为什么用 tock？

| 特点 | 说明 |
|------|------|
| 🤖 **机器友好** | 所有读取命令支持 `-o json` 输出；空列表返回 `[]`；错误信息输出到 stderr 并返回非零退出码 |
| 🌐 **双平台支持** | 同一个 CLI 同时支持 TickTick（国际版）和 Dida365（滴答清单），用 `--provider` 切换 |
| 🛡️ **安全更新** | `task update` 采用 read-modify-write 模式，只修改你传入的字段，避免 API 的边缘情况导致任务重复创建 |
| 🔄 **自动刷新 Token** | OAuth token 过期前自动刷新，无需手动重新登录 |
| 🗣️ **Agent 集成** | 内置 skill，Claude Code 等 Agent 都能用自然语言管理任务 |

---

## 📦 安装

### 前提条件

需要 [Bun](https://bun.sh) >= 1.3.14（低版本在 macOS 上生成的二进制签名有问题）。

```bash
# 安装 Bun（如果还没有）
curl -fsSL https://bun.sh/install | bash
```

### 构建并安装

```bash
git clone https://github.com/aisparkedu/tock.git
cd tock
bun install
bun run build          # 生成单文件二进制 ./tock
mv tock ~/bin/         # 放到 PATH 里的任意目录
```

---

## 🔑 配置

### 第一步：注册 OAuth 应用

在开发者平台用你的**普通账号**登录，创建一个新应用：

- **TickTick（国际版）**：[developer.ticktick.com](https://developer.ticktick.com)
- **滴答清单（国内版）**：[developer.dida365.com](https://developer.dida365.com)

填写 App Setting 表单：

| 字段 | 填写内容 |
|------|----------|
| Name（必填） | 随意，例如 `tock` |
| **OAuth redirect URL**（必填） | `http://localhost:8080`（必须一字不差） |
| App Icon | 留空 |
| App Service URL | 留空 |
| Description | 留空 |

点击 **Save** 后，页面会展示生成的 **Client ID** 和 **Client Secret**，复制保存好。

### 第二步：初始化认证

```bash
export TOCK_CLIENT_ID=你的Client_ID
export TOCK_CLIENT_SECRET=你的Client_Secret
# 或者写入当前目录的 .env 文件，Bun 会自动读取

tock init                        # TickTick（默认）
tock init --provider dida        # 滴答清单
```

运行后浏览器会自动打开授权页面，授权完成后 token 保存到 `~/.config/tock/`（权限 0600），之后会自动刷新，无需重复操作。

---

## 🚀 使用方法

所有任务命令都可以通过 `-P <project-id>` 指定操作哪个项目，不指定则使用默认项目。

### 📋 项目（清单）管理

```bash
# 列出所有项目
tock project list

# 按名称筛选
tock project list -f "工作"

# 以 JSON 格式输出（适合脚本处理）
tock project list -o json

# 创建新项目
tock project create "读书计划" --color "#4CAF50"

# 设置默认项目（之后的任务命令默认操作这个项目）
tock project use "读书计划"
tock project use abc123          # 也可以用项目 ID
```

---

### ✅ 任务管理

#### 创建任务

```bash
# 最简单的用法
tock task create -t "买牛奶"

# 带备注和优先级
tock task create -t "回客户邮件" -c "关于合同条款" -p high

# 带截止时间和提醒
tock task create -t "提交报告" \
  --due 2026-07-01T18:00:00+08:00 \
  --reminder "TRIGGER:-PT30M"       # 提前 30 分钟提醒

# 全天任务
tock task create -t "团队聚餐" --due 2026-07-05T00:00:00Z --all-day

# 带标签
tock task create -t "Code Review" --tags "工作,紧急"

# 输出 JSON（方便脚本获取任务 ID）
tock task create -t "重要事项" -o json
```

**优先级可选值**：`none`（无）、`low`（低）、`medium`（中）、`high`（高）

**提醒格式**（iCalendar TRIGGER）：

| 格式 | 含义 |
|------|------|
| `TRIGGER:PT0S` | 开始时提醒 |
| `TRIGGER:-PT10M` | 提前 10 分钟提醒 |
| `TRIGGER:-PT1H` | 提前 1 小时提醒 |
| `TRIGGER:PT30M` | 开始后 30 分钟提醒 |

---

#### 查看任务

```bash
# 列出默认项目的所有未完成任务
tock task list

# 只看高优先级
tock task list -p high

# 按标签筛选
tock task list -t "紧急"

# JSON 输出
tock task list -o json

# 查看某个任务的详情
tock task show abc123
tock task show abc123 -o json

# 查看指定项目的任务
tock -P <project-id> task list
```

---

#### 修改任务

`task update` 只修改你传入的字段，其他字段保持原样：

```bash
# 修改标题和优先级
tock task update abc123 -t "新标题" -p medium

# 加截止时间
tock task update abc123 --due 2026-07-10T18:00:00+08:00

# 清空标签
tock task update abc123 --tags ""

# 注意：update 需要通过 -P 指定项目
tock -P <project-id> task update abc123 -t "新标题"
```

---

#### 完成 / 删除任务

```bash
# 标记任务完成
tock task complete abc123

# 删除任务（立即生效，无确认提示）
tock task delete abc123
```

---

## 🤖 Agent Skill

tock 内置了一个 skill（[Claude Code](https://claude.com/claude-code) 等 Agent 都能加载），让 Agent 用自然语言帮你管理任务。

### 安装 Skill

```bash
scripts/install-skill.sh          # 复制到 ~/.claude/skills/tock/
scripts/install-skill.sh -f       # 覆盖已有的本地自定义版本
```

### 你可以这样跟 Agent 说

```
「明天下午三点提醒我给客户打电话」
「今天有什么待办？」
「把"提交报告"标记为完成」
「购物清单里加上：牛奶、鸡蛋、面包」
「把这周的高优先级任务都列出来」
「帮我创建一个读书计划项目」
```

Agent 会自动调用 tock CLI 完成操作，无需你记命令。

---

## ⚙️ 进阶用法

### 多账号支持

用 `TOCK_CONFIG_DIR` 环境变量为不同账号指定不同的配置目录：

```bash
# 默认账号（TickTick）
tock task list

# 第二个账号（滴答清单）
TOCK_CONFIG_DIR=~/.config/tock-dida tock task list

# 初始化第二个账号
TOCK_CONFIG_DIR=~/.config/tock-dida \
  TOCK_CLIENT_ID=... \
  TOCK_CLIENT_SECRET=... \
  tock init --provider dida
```

### 重新认证

```bash
tock reset                    # 删除 token 并重新走 OAuth 流程
tock reset --provider dida    # 重置滴答清单账号
```

---

## 🛠️ 开发

```bash
bun test               # 单元测试 + mock API 集成测试
bunx tsc --noEmit      # 类型检查
scripts/e2e.sh         # 完整 E2E 测试（需要已完成 tock init）
```

---

## 🔥 关于 AI Spark

> **AI Spark 聚焦 AI 实战与超级个体成长，是由一线 AI 实战者维护的开源知识社区。** 覆盖 AI 入门、工具与大模型、AI 编程与智能体、内容创作、效率提升等模块——从新手入门，到工具实操，再到靠 AI 提效增收的变现路径，知识库资料全部公开免费。

`tock` 正是 AI Spark 开源生态中的一个工具：把「用 AI 管理日常待办」这件事，做成一个机器友好、可被 Agent 直接调用的 CLI。

- 📚 **开源知识库**：https://github.com/aisparkedu/knowledge-base —— 7 大内容模块 + 实战教程，每周更新，永久免费
- 🧑‍💻 **GitHub 组织**：https://github.com/aisparkedu

---

## 📄 许可

[MIT](./LICENSE)
