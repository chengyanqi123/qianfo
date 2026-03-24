# 千佛预约管理系统

基于 pnpm Monorepo 的预约管理系统，包含手机端 H5 预约页和 PC 端后台管理系统。

## 项目结构

```
qianfo/
├── packages/
│   ├── h5/          # 手机端（微信公众号）
│   ├── web/         # 后台管理端
│   └── shared/      # 公共类型与工具函数
```

## 技术栈

| 包 | 框架 | UI 组件库 | 其他 |
|---|---|---|---|
| h5 | Vue 3 + TypeScript | Vant 4 | Pinia、Vue Router、微信 JS-SDK |
| web | Vue 3 + TypeScript | Element Plus | Pinia、Vue Router、ECharts、VueUse |
| shared | TypeScript | — | Axios |

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 10

### 安装依赖

```bash
pnpm install
```

### 开发

```bash
pnpm dev:h5    # 手机端  → http://localhost:5173
pnpm dev:web   # 管理后台 → http://localhost:5174
```

> 两端默认开启 Mock 模式（`VITE_MOCK=true`），无需启动后端即可完整预览所有功能。
>
> 后台演示账号：`admin` / `123456`

### 构建

```bash
pnpm build:h5
pnpm build:web
```

## 功能介绍

### 手机端 H5

- **预约页**：填写预约日期、时间、人数、联系电话，通过微信公众号自动获取手机号
- **历史页**：以卡片形式展示历史预约记录，支持下拉刷新和分页加载

### 后台管理端

- **登录**：账号密码登录，JWT Token 鉴权，路由守卫保护
- **控制台**：统计卡片（总预约数、今日预约、待确认、注册用户）+ ECharts 图表（近 7 天预约趋势、预约状态分布）
- **预约管理**：按日期范围 / 状态 / 手机号筛选，支持确认 / 取消操作
- **系统用户**：按用户名 / 手机号筛选，展示注册用户列表
- **亮/暗模式**：自动跟随系统，支持手动切换

## 对接后端

### 环境变量

**h5** (`packages/h5/.env`)

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_MOCK=true
VITE_WX_APP_ID=your_wx_app_id
```

**web** (`packages/web/.env`)

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_MOCK=true
```

将 `VITE_MOCK` 改为 `false` 后，所有请求将发往 `VITE_API_BASE_URL`。

### 主要接口

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/auth/login` | 登录 |
| GET | `/api/wechat/jsconfig` | 获取微信 JS-SDK 签名配置 |
| POST | `/api/appointments` | 提交预约 |
| GET | `/api/appointments/history` | 用户预约历史 |
| GET | `/api/appointments` | 预约列表（管理端） |
| PATCH | `/api/appointments/:id/status` | 更新预约状态 |
| GET | `/api/users` | 用户列表 |
| GET | `/api/dashboard/stats` | 统计数据 |
| GET | `/api/dashboard/daily` | 近 N 天预约数量 |
| GET | `/api/dashboard/status-distribution` | 预约状态分布 |
