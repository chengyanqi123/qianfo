# 千佛预约系统

基于 pnpm Monorepo 的预约管理系统，包含手机端 H5 预约页和 PC 端后台管理系统。

## 项目结构

```
qianfo/
├── packages/shared/     # 公共类型、工具函数、API URL 常量
├── apps/h5/             # 手机端 H5（微信公众号）
└── apps/web/            # 后台管理端
```

| 包               | 技术栈                         | 说明                                               |
| ---------------- | ------------------------------ | -------------------------------------------------- |
| `@qianfo/shared` | TypeScript + Axios             | 公共类型定义、axios 请求工厂、API URL 常量         |
| `h5`             | Vue 3 + Vant + Pinia           | 微信公众号内预约页面                               |
| `web`            | Vue 3 + Element Plus + ECharts | 后台管理端，含控制台、预约管理、用户管理、系统设置 |

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 10

### 安装与开发

```bash
pnpm install

pnpm dev:h5    # 手机端  → http://localhost:5173
pnpm dev:web   # 管理后台 → http://localhost:5174
```

### 构建

```bash
pnpm build:h5   # 构建 H5 端
pnpm build:web  # 构建管理端
pnpm build      # 全量构建
```

### 代码检查

```bash
pnpm lint        # ESLint 检查
pnpm lint:fix    # ESLint 自动修复
pnpm format      # Prettier 格式化
pnpm check:type  # TypeScript 类型检查
```

## 环境变量

**H5 端** (`apps/h5/.env`)

```env
VITE_API_BASE_URL=/api
VITE_WX_APP_ID=your_wx_app_id
VITE_SITE_ADDRESS=https://your-domain.com/h5
VITE_SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0
VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=1

SENTRY_ORG=your-org
SENTRY_PROJECT=your-h5-project
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_RELEASE=your-release
```

**管理端** (`apps/web/.env`)

```env
VITE_API_BASE_URL=/api
VITE_SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0
VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=1

SENTRY_ORG=your-org
SENTRY_PROJECT=your-web-project
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_RELEASE=your-release
```

说明：

- 本地开发默认使用 `VITE_API_BASE_URL=/api`。
- 生产构建会读取 [apps/h5/.env.production](/Users/erick/Desktop/codes/qianfo/apps/h5/.env.production) 和 [apps/web/.env.production](/Users/erick/Desktop/codes/qianfo/apps/web/.env.production)。
- `VITE_SENTRY_*` 是运行时配置，前端启动后会读取。
- `SENTRY_*` 是构建时配置，用于自动上传 sourcemap；不配置也能上报，但线上堆栈会是压缩后的代码。
- 仓库已在 [pnpm-workspace.yaml](/Users/erick/Desktop/codes/qianfo/pnpm-workspace.yaml) 放行 `@sentry/cli`，CI 安装依赖后会自动具备 sourcemap 上传能力。
- 如果你本地之前安装依赖时看到了 `Ignored build scripts: @sentry/cli`，可以执行 `pnpm approve-builds` 后重新安装依赖。
- 仓库中的接入默认在 `VITE_SENTRY_DSN` 为空时自动禁用，不会影响本地开发。

## API

详见[API](./API.md)

## 部署

项目通过 GitHub Actions 部署到服务器和阿里云 OSS：

- `.github/workflows/auto-deploy.yml`
  push 到 `master` 且改动包含 `apps/h5`、`apps/web` 或 `packages/shared` 时自动构建，并自动上传到 OSS。
- `.github/workflows/manual-deploy.yml`
  可手动选择 `h5`、`web` 或 `all`，并选择上传到 `server`、`oss` 或 `both`。

仓库里保留了 3 个手动部署脚本：

- `scripts/deploy-server.sh`
- `scripts/deploy-oss.sh`
- `scripts/deploy-server-and-oss.sh`

自动部署 OSS 需要配置以下 GitHub Secrets：

- `APP_ID`
- `H5_SITE`
- `ALIYUN_OSS_ACCESS_KEY_ID`
- `ALIYUN_OSS_ACCESS_KEY_SECRET`
- `ALIYUN_OSS_REGION`
- `ALIYUN_OSS_BUCKET`
- `ALIYUN_OSS_ENDPOINT`（可选）
- `ALIYUN_OSS_H5_PREFIX`（可选，默认 `h5`）
- `ALIYUN_OSS_WEB_PREFIX`（可选，默认 `web`）

如果需要手动上传到服务器，还需要：

- `SSH_PRIVATE_KEY`
- `SERVER_IP`
- `SERVER_USER`

如果需要在 GitHub Actions 构建阶段自动上传 sourcemap 到 Sentry，还需要：

- `SENTRY_ORG`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_URL`（可选，默认 `https://sentry.io`）
- `H5_SENTRY_PROJECT`（H5 构建时使用）
- `WEB_SENTRY_PROJECT`（Web 构建时使用）
- `H5_SENTRY_RELEASE`（可选，默认 `h5@<git-sha>`）
- `WEB_SENTRY_RELEASE`（可选，默认 `web@<git-sha>`）

说明：

- 本地单独构建某个应用时，继续使用该应用目录下的 `SENTRY_PROJECT` / `SENTRY_RELEASE` 即可。
- GitHub Actions 会在同一步并行构建 `h5` 和 `web`，因此工作流里优先使用 `H5_SENTRY_*` / `WEB_SENTRY_*`，避免两个应用共用同一个 `SENTRY_PROJECT`。

默认 OSS 同步路径会和当前 Vite `base` 保持一致：

- H5 -> `oss://<bucket>/h5/`
- Web -> `oss://<bucket>/web/`

说明：

- 如果没有配置 `ALIYUN_OSS_H5_PREFIX` / `ALIYUN_OSS_WEB_PREFIX`，工作流会分别默认上传到 `h5/` 和 `web/`。
- 当前前端构建基路径分别固定为 `/h5/` 和 `/web/`。如果你希望 OSS 走别的访问路径，需要同步修改 [apps/h5/vite.config.ts](/Users/erick/Desktop/codes/qianfo/apps/h5/vite.config.ts) 和 [apps/web/vite.config.ts](/Users/erick/Desktop/codes/qianfo/apps/web/vite.config.ts) 里的 `base`。
- `ALIYUN_OSS_ENDPOINT` 不填时，会按 `ALIYUN_OSS_REGION` 使用默认 OSS Endpoint；如果你的 Bucket 位于中国内地并且绑定了自定义域名，建议直接把该域名配置到 `ALIYUN_OSS_ENDPOINT`，工作流会自动切换到 CNAME 模式上传。
