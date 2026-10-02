# Cloudflare 环境（本仓库本地安装）

来源：https://developers.cloudflare.com/agent-setup/prompt.md （官方 agent setup 指令）

## 已安装

| 项目 | 位置 | 说明 |
| --- | --- | --- |
| Cloudflare Skills | `.dsh/skills/`（16 个：cloudflare、wrangler、workers-best-practices、durable-objects、agents-sdk、cloudflare-one*、basin、k2、nextjs-on-cloudflare、sandbox-*、turnstile-spin、web-perf、cloudflare-email-service） | 由 `git clone cloudflare/skills` 取官方仓库 `skills/` 目录复制而来，替代 `npx -y skills add`（避免第三方 npm 包与 Node 依赖） |
| MCP 服务器 | `.dsh/mcp.json` | 5 个远端 MCP：cloudflare、cloudflare-docs（公开，无需鉴权）、cloudflare-bindings、cloudflare-builds、cloudflare-observability；其余首次调用时走 OAuth |

## 本站的部署要点（Cloudflare Pages）

- **构建命令：`hugo`** —— 仓库已提交全部生成物（`assets/css/tailwind.css`、`content/{tw,hk}`、`data/lunar.json`、`i18n/{tw,hk}.toml`），构建**不需要任何依赖安装**，`pnpm install` 只是被 Pages 自动触发的额外开销。
- **必须设 `HUGO_VERSION`**（例如 `0.167.0`）。Pages 默认装的 Hugo 版本过旧，本站需要 ≥0.146 的模板行为（`transform.HighlightCodeBlock`、`hugo.Sites` 等）。
- 若 Pages 仍执行 `pnpm install --frozen-lockfile`：`pnpm-workspace.yaml` 已补 `packages: ['.']`（pnpm 10 必需），安装可正常通过。
- 未安装 `cf` CLI（官方可选步骤，需 `npm install -g cf`，与本站「构建不依赖 Node」的取向不符）；部署/资源管理用 `wrangler` 技能即可。

## 复跑方式

```powershell
git clone --depth 1 https://github.com/cloudflare/skills.git .review/cf-skills
Copy-Item .review/cf-skills/skills/* .dsh/skills/ -Recurse -Force
```

## `hugo` 需不需要先 `pnpm install`？—— 不需要（已实测）

两次全新克隆（`git clone` 后**没有** `node_modules`）直接构建：

| 测试 | Hugo | 结果 |
| --- | --- | --- |
| 克隆 A | v0.167.0 **extended** | exit 0 / 6.4s |
| 克隆 B | v0.166.0 **标准版（非 extended）** | exit 0 / 8.9s，四语 221/151/151/46 页，0 警告，Processed images 0 |

原因：所有生成物都在仓库里（Tailwind CSS、`content/{tw,hk}`、`i18n/{tw,hk}.toml`、`data/lunar.json`），
前端 JS 由 Hugo **内置 esbuild** 打包，站点不 import 任何 npm 包。

`pnpm install` 只在两种情况下需要：

1. 跑 `pnpm generate`（= `variants` + `lunar` + `css`）刷新上述生成物：改动 `content/zh`、新增古文页、
   或改动类名/样式之后；
2. 跑开发期工具：`pnpm format`（prettier）、`pnpm audit:visual`（playwright）。

**结论：部署与本地预览都只需 `hugo`**（标准版即可，无需 extended）✓

## Cloudflare Pages 上的安装步骤

Cloudflare 检测到 `pnpm-lock.yaml` 就会自动执行一次 `pnpm install --frozen-lockfile`
（日志里可见），这一步现在能正常通过（已补 `pnpm-workspace.yaml` 的 `packages: ['.']`），
但产物完全不需要它，纯属额外开销（约 30 秒）。

- 省事做法：让它跑完即可 ✓
- 想彻底去掉：把 `package.json` / `pnpm-lock.yaml` / `pnpm-workspace.yaml` 移出仓库，
  Pages 就不会再检测到包管理器、安装步骤自然消失；代价是 `pnpm generate` 的依赖不再有锁定与记录
  （需要时可再 `pnpm init` 补回）。
