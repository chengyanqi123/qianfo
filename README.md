# 千佛预约管理系统

基于 pnpm Monorepo 的预约管理系统，包含手机端 H5 预约页和 PC 端后台管理系统。

**Create by [Claude Code](https://claude.ai/code).**

## 项目结构

```
qianfo/
├── apps/
│   ├── h5/          # 手机端（微信公众号）
│   ├── web/         # 后台管理端
│   └── shared/      # 公共类型与工具函数
```

## 技术栈

| 包     | 框架               | UI 组件库    | 其他                               |
| ------ | ------------------ | ------------ | ---------------------------------- |
| h5     | Vue 3 + TypeScript | Vant 4       | Pinia、Vue Router、微信 JS-SDK     |
| web    | Vue 3 + TypeScript | Element Plus | Pinia、Vue Router、ECharts、VueUse |
| shared | TypeScript         | —            | Axios                              |

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

#### 预约页（`/appointment`）

- **日期选择**：底部弹窗日期选择器，可选范围为今日起 30 天内
- **时间选择**：底部弹窗时间选择器，仅允许整点和半点（00 / 30 分钟）
- **人数选择**：步进器，范围 1 ~ 20，默认 2 人
- **联系电话**：手动输入（校验手机号格式）或点击「微信获取」通过 JS-SDK 自动填入；已存储的手机号页面加载时自动预填
- **备注**：选填，最长 100 字
- **提交**：表单校验通过后提交预约，成功后 Toast 提示并重置表单

#### 历史页（`/history`）

- **下拉刷新**：重新加载第 1 页数据
- **卡片列表**：展示预约日期、时间、状态标签、人数、电话、备注、提交时间
- **状态标签颜色**：待确认（橙）/ 已确认（绿）/ 已取消（红）
- **取消预约**：仅「待确认」状态可操作，点击后弹出确认对话框，确认后本地同步更新状态
- **分页加载**：每页 10 条，点击「加载更多」追加数据；全部加载完显示分割线
- **空状态**：列表为空时显示空状态插图

### 后台管理端

#### 控制台（`/dashboard`）

- **统计卡片**：总预约数（蓝）、今日预约（绿）、待确认数（橙）、注册用户（红）
- **柱状图**：近 7 天每日预约数量，X 轴为日期（MM-DD）
- **环形图**：预约状态分布（待确认 / 已确认 / 已取消），Tooltip 显示百分比
- **数据加载**：三个接口并行请求，图表区展示 loading 态

#### 预约管理（`/appointments`）

- **筛选条件**：日期范围（开始 ~ 结束）、状态（全部 / 待确认 / 已确认 / 已取消）、手机号模糊搜索，支持一键重置
- **数据表格**：ID、预约日期、时间、人数、联系电话、状态（Tag）、备注（超长省略）、提交时间、操作
- **行操作**：「待确认」可点击确认 → 改为「已确认」；非「已取消」可点击取消 → 改为「已取消」；操作前弹出二次确认
- **分页**：默认每页 10 条，可切换 10 / 20 / 50；移动端自适应

#### 系统用户（`/users`）

- **筛选条件**：用户名、手机号模糊搜索，支持一键重置
- **数据表格**：ID、用户名、角色（admin 红色 / user 灰色）、手机号、注册时间
- **只读展示**：当前版本无新增 / 编辑 / 删除操作
- **分页**：同预约管理

#### 通用功能

- **登录鉴权**：JWT Token 鉴权，路由守卫保护，未登录自动跳转登录页（保留 redirect 参数���
- **Token 自动挂载**：请求拦截器附加 `Authorization: Bearer <token>`
- **401 自动处理**：清除 token 并跳转登录页
- **亮 / 暗模式**：自动跟随系统，支持手动切换（VueUse `useDark()`）

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

### 统一响应格式

所有接口均遵循以下结构，`code` 为 `0` 表示成功：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

### 主要接口

详见[API][api-link]

#### 认证

| 方法 | 路径          | 请求体                   | 响应              | 说明                 |
| ---- | ------------- | ------------------------ | ----------------- | -------------------- |
| POST | `/auth/login` | `{ username, password }` | `{ token, user }` | 登录，无需携带 Token |

#### 微信

| 方法 | 路径               | 说明                     |
| ---- | ------------------ | ------------------------ |
| GET  | `/wechat/jsconfig` | 获取微信 JS-SDK 签名配置 |

#### 预约（H5 端）

| 方法  | 路径                       | 请求                                          | 响应                      | 说明                     |
| ----- | -------------------------- | --------------------------------------------- | ------------------------- | ------------------------ |
| POST  | `/appointments`            | Body: `{ date, time, count, phone, remark? }` | `void`                    | 提交新预约               |
| GET   | `/appointments/history`    | Query: `{ page, pageSize }`                   | `PageResult<Appointment>` | 当前用户预约历史（分页） |
| PATCH | `/appointments/:id/status` | Body: `{ status: 'cancelled' }`               | `void`                    | 取消预约                 |

#### 预约（管理端）

| 方法  | 路径                       | 请求                                                               | 响应                      | 说明                       |
| ----- | -------------------------- | ------------------------------------------------------------------ | ------------------------- | -------------------------- |
| GET   | `/appointments`            | Query: `{ page, pageSize, phone?, status?, dateStart?, dateEnd? }` | `PageResult<Appointment>` | 分页查询（支持多条件筛选） |
| PATCH | `/appointments/:id/status` | Body: `{ status: 'confirmed' \| 'cancelled' }`                     | `void`                    | 更新预约状态               |

#### 用户

| 方法 | 路径     | 请求                                           | 响应               | 说明                     |
| ---- | -------- | ---------------------------------------------- | ------------------ | ------------------------ |
| GET  | `/users` | Query: `{ page, pageSize, username?, phone? }` | `PageResult<User>` | 分页查询（支持模糊筛选） |

#### Dashboard

| 方法 | 路径                             | 请求                       | 响应                                                                        | 说明                        |
| ---- | -------------------------------- | -------------------------- | --------------------------------------------------------------------------- | --------------------------- |
| GET  | `/dashboard/stats`               | 无                         | `{ totalAppointments, todayAppointments, totalUsers, pendingAppointments }` | 概览统计数字                |
| GET  | `/dashboard/daily`               | Query: `{ days?: number }` | `{ date, count }[]`                                                         | 近 N 天（默认 7）每日预约数 |
| GET  | `/dashboard/status-distribution` | 无                         | `{ status, label, count }[]`                                                | 各状态预约数量分布          |

### 数据模型

#### `Appointment`

| 字段        | 类型                                      | 说明                      |
| ----------- | ----------------------------------------- | ------------------------- |
| `id`        | `number`                                  | 主键                      |
| `userId`    | `number`                                  | 所属用户 ID               |
| `date`      | `string`                                  | 预约日期，`YYYY-MM-DD`    |
| `time`      | `string`                                  | 预约时间，`HH:mm`         |
| `count`     | `number`                                  | 预约人数（1 ~ 20）        |
| `phone`     | `string`                                  | 联系电话                  |
| `status`    | `'pending' \| 'confirmed' \| 'cancelled'` | 预约状态                  |
| `remark`    | `string?`                                 | 备注（可选，最长 100 字） |
| `createdAt` | `string`                                  | 创建时间（ISO 8601）      |

#### `User`

| 字段        | 类型                | 说明                 |
| ----------- | ------------------- | -------------------- |
| `id`        | `number`            | 主键                 |
| `username`  | `string`            | 用户名               |
| `role`      | `'admin' \| 'user'` | 角色                 |
| `phone`     | `string?`           | 手机号（可选）       |
| `createdAt` | `string`            | 注册时间（ISO 8601） |

#### `PageResult<T>`

| 字段       | 类型     | 说明     |
| ---------- | -------- | -------- |
| `list`     | `T[]`    | 数据列表 |
| `total`    | `number` | 总条数   |
| `page`     | `number` | 当前页   |
| `pageSize` | `number` | 每页条数 |

<!-- Links -->

[api-link]: ./APIS.md
