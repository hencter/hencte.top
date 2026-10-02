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
