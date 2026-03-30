# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

请始终使用简体中文与我对话，并在回答时保持专业、简洁。

## Overview

`qianfo` 是一个 pnpm monorepo（千佛预约系统），包含三个工作区包：

| 包               | 路径              | 技术栈                               | 用途                       |
| ---------------- | ----------------- | ------------------------------------ | -------------------------- |
| `@qianfo/shared` | `packages/shared` | TypeScript                           | 公共类型定义 + axios 工厂  |
| `h5`             | `apps/h5`         | Vue3 + Vant + Vite                   | 手机端预约页（微信公众号） |
| `web`            | `apps/web`        | Vue3 + Element Plus + Vite + ECharts | 后台管理端                 |

## 常用命令

```bash
# 安装所有依赖
pnpm install

# 开发模式
pnpm dev:h5     # H5 端，端口 5173
pnpm dev:web    # 后台管理端，端口 5174

# 构建（先构建 shared，再并行构建两个应用）
pnpm build:h5
pnpm build:web
pnpm build      # 全量构建

# Lint & Format
pnpm lint       # ESLint 检查（@antfu/eslint-config）
pnpm lint:fix   # ESLint 自动修复
pnpm format     # Prettier 格式化
pnpm check      # Prettier 格式检查

# 在特定包中执行命令
pnpm --filter h5 add <package>
pnpm --filter web add <package>
pnpm --filter @qianfo/shared add <package>
```

## Git Hooks

- **pre-commit**：通过 husky + lint-staged 自动对暂存的 `*.{js,ts,jsx,tsx,vue}` 文件执行 `eslint --fix`

## Mock 数据

两个应用均通过 `.env` 中的 `VITE_MOCK=true` 控制 mock 模式。
Mock 逻辑写在各自的 `src/api/*.ts` 文件中，通过 `isMock` 分支返回本地假数据，**无需启动后端即可运行和预览页面**。

关闭 mock 时，将 `VITE_MOCK=false`，axios 会向 `VITE_API_BASE_URL` 发起真实请求。

### 演示账号（Mock 模式）

- 账号：`admin`，密码：`123456`

## 架构说明

### shared（`packages/shared/src/`）

- `types/index.ts` — 所有公共 TS 接口（`Appointment`、`User`、`PageResult<T>` 等）
- `utils/request.ts` — `createRequest(baseURL, getToken)` axios 工厂（含请求/响应拦截器）
- `utils/index.ts` — 通用工具函数（`formatDate`、`getRecentDays` 等）

### h5（`apps/h5/src/`）

- **路由**：`/appointment`（预约表单）、`/history`（历史记录），底部 Vant TabBar 切换
- **微信集成**：`composables/useWechat.ts` — 初始化 `wx.config`，通过 `wx.invoke('getPhoneNumber')` 获取手机号；后端需提供 `/api/wechat/jsconfig` 签名接口
- **状态**：`stores/user.ts`（Pinia）存储从微信获取的手机号和 openId
- **API**：`api/appointment.ts` 负责提交预约和拉取历史

### web（`apps/web/src/`）

- **布局**：`layout/AppLayout.vue` = 左侧 `Sidebar.vue` + 右侧（顶部 `Topbar.vue` + 内容区）
- **路由守卫**：`router/index.ts` 中 `beforeEach` 检查 token，未登录跳转 `/login`
- **鉴权**：`stores/auth.ts`（Pinia）持久化 token 到 `localStorage`，key 为 `qianfo_token`；axios 请求拦截自动挂载 `Authorization: Bearer <token>`；401 响应自动清除 token 并跳转登录页
- **暗色模式**：`composables/useTheme.ts` 使用 VueUse `useDark()`，自动跟随系统，Element Plus 通过 `<html>` 上的 `dark` class 启用暗色主题
- **图表**：`DashboardView.vue` 使用 `vue-echarts` + ECharts 5（按需引入），渲染柱状图（近7天预约）和环形图（状态分布）
- **API**：`api/request.ts` 统一 axios 实例；各功能模块独立文件（`auth.ts`、`dashboard.ts`、`appointment.ts`、`user.ts`）

## 部署

`nginx.conf` 配置了生产部署结构：
- `/h5/` → H5 静态文件（SPA fallback）
- `/web/` → 管理端静态文件（SPA fallback）
- `/api/` → 反向代理到后端 `http://127.0.0.1:3000/`
- 构建产物部署到 `/www/qianfo/{h5,web}/`
