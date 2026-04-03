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
| `h5`             | Vue 3 + Vant + Pinia           | 微信公众号内预约页面，支持微信 JS-SDK 获取手机号   |
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
```

**管理端** (`apps/web/.env`)

```env
VITE_API_BASE_URL=/api
```

## API

详见[API](./API.md)

## 部署

项目通过 GitHub Actions 自动部署，`nginx.conf` 配置如下：

- `/h5/` → H5 静态文件（SPA fallback）
- `/web/` → 管理端静态文件（SPA fallback）
- `/api/` → 反向代理到后端服务
