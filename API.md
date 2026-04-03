# API 接口文档

## 鉴权机制

### 整体流程

所有接口（除登录外）均需携带 Token，通过请求头 `Authorization` 传递。

```
Authorization: <token>
```

### 管理端（Web）

1. 调用 `POST /auth/login` 获取 `token`
2. Token 持久化到 `localStorage`（key: `qianfo_token`）
3. 请求拦截器自动挂载 `Authorization` 头
4. 路由守卫：未登录时重定向到 `/login`，并通过 `query.redirect` 保留原路径
5. 401 响应：弹窗提示「登录已过期」→ 清除 Token → 跳转登录页

### H5 端（微信公众号）

1. 通过微信 OAuth 获取 `code`，调用 `POST /auth/h5/login` 换取 `token`
2. Token 存储在 Pinia store 中
3. 请求拦截器自动挂载 `Authorization` 头
4. 401 响应：清除用户信息 → 重新发起微信 OAuth 授权（`isRedirecting` 标志位防止重复跳转）

---

## 统一响应格式

所有接口均返回以下结构，`code` 为 `0` 表示成功：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

---

## 接口列表

### 认证

#### `POST /auth/login`

管理端登录，无需携带 Token。

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `username` | `string` | 是 | 用户名 |
| `password` | `string` | 是 | 密码 |

**响应 `data`：**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `token` | `string` | JWT Token |
| `user` | `User` | 用户信息 |

---

#### `POST /auth/h5/login`

H5 端微信授权登录。

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `code` | `string` | 是 | 微信 OAuth 授权码 |

**响应 `data`：**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `token` | `string` | JWT Token |
| `user` | `User` | 用户信息 |

---

#### `POST /auth/change-password`

修改密码（仅管理端）。

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `oldPassword` | `string` | 是 | 原密码 |
| `newPassword` | `string` | 是 | 新密码 |

**响应 `data`：** `null`

---

### 预约

#### `POST /appointments`

提交新预约（H5 端）。

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `date` | `string` | 是 | 预约日期，`YYYY-MM-DD` |
| `time` | `string` | 是 | 预约时间，`HH:mm` |
| `count` | `number` | 是 | 预约人数（1 ~ 20） |
| `phone` | `string` | 是 | 联系电话 |
| `remark` | `string` | 否 | 备注（最长 100 字） |

**响应 `data`：** 创建的预约对象

---

#### `GET /appointments`

分页查询预约列表（管理端）。

**Query 参数：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` | `number` | 是 | 页码 |
| `pageSize` | `number` | 是 | 每页条数 |
| `phone` | `string` | 否 | 手机号（模糊搜索） |
| `status` | `string` | 否 | 状态筛选：`pending` / `confirmed` / `cancelled` |
| `dateStart` | `string` | 否 | 开始日期 |
| `dateEnd` | `string` | 否 | 结束日期 |

**响应 `data`：** `PageResult<Appointment>`

---

#### `GET /appointments/history`

当前用户预约历史（H5 端，根据 Token 识别用户）。

**Query 参数：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` | `number` | 是 | 页码 |
| `pageSize` | `number` | 是 | 每页条数 |

**响应 `data`：** `PageResult<Appointment>`

---

#### `PATCH /appointments/:id/status`

更新预约状态。

**路径参数：**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `number` | 预约 ID |

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `status` | `string` | 是 | `confirmed`（管理端确认）或 `cancelled`（取消） |

**响应 `data`：** `null`

---

#### `POST /appointments/:id/verify`

核销预约，仅将 `pending` 状态变更为 `confirmed`（管理端）。

**路径参数：**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `number` | 预约 ID |

**响应 `data`：** `null`

---

#### `GET /appointments/:id/status`

查询单条预约状态（H5 端）。

**路径参数：**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `number` | 预约 ID |

**响应 `data`：** `AppointmentStatus`（`"pending"` / `"confirmed"` / `"cancelled"`）

---

### 用户

#### `GET /users`

分页查询用户列表（管理端）。

**Query 参数：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` | `number` | 是 | 页码 |
| `pageSize` | `number` | 是 | 每页条数 |
| `username` | `string` | 否 | 用户名（模糊搜索） |
| `phone` | `string` | 否 | 手机号（模糊搜索） |

**响应 `data`：** `PageResult<User>`

---

### 控制台

#### `GET /dashboard/stats`

获取概览统计数据。

**响应 `data`：**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `totalAppointments` | `number` | 总预约数 |
| `todayAppointments` | `number` | 今日预约数 |
| `totalUsers` | `number` | 注册用户数 |
| `pendingAppointments` | `number` | 待确认预约数 |

---

#### `GET /dashboard/daily`

获取近 N 天每日预约数。

**Query 参数：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `days` | `number` | 否 | 天数，默认 `7` |

**响应 `data`：** `DailyCount[]`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `date` | `string` | 日期 |
| `count` | `number` | 预约数 |

---

#### `GET /dashboard/status-distribution`

获取预约状态分布。

**响应 `data`：** `StatusDistribution[]`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `status` | `string` | 状态标识 |
| `label` | `string` | 状态中文名 |
| `count` | `number` | 数量 |

---

### 系统设置（容量管理）

#### `GET /setting/capacity/default`

获取默认每日预约容量上限。

**响应 `data`：** `number`

---

#### `PUT /setting/capacity/default`

设置默认每日预约容量上限。

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `capacity` | `number` | 是 | 默认容量 |

**响应 `data`：** `null`

---

#### `POST /setting/capacity/config`

查询指定日期范围的容量配置。

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `startDate` | `string` | 是 | 开始日期，`YYYY-MM-DD` |
| `endDate` | `string` | 是 | 结束日期，`YYYY-MM-DD` |

**响应 `data`：** `LimitResult`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `default` | `number` | 默认容量 |
| `dailys` | `array` | 每日配置列表 |
| `dailys[].date` | `string` | 日期 |
| `dailys[].count` | `number` | 当日容量 |
| `dailys[].confirmedCount` | `number` | 已确认数 |

---

#### `PUT /setting/capacity`

设置某一天的容量上限。

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `date` | `string` | 是 | 日期，`YYYY-MM-DD` |
| `capacity` | `number` | 是 | 容量 |

**响应 `data`：** `null`

---

#### `POST /setting/capacity/appointment`

查询指定日期范围的预约情况（H5 端用于判断可预约余量）。

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `startDate` | `string` | 是 | 开始日期，`YYYY-MM-DD` |
| `endDate` | `string` | 是 | 结束日期，`YYYY-MM-DD` |

**响应 `data`：** `AppointmentInfoResult`

以日期为 key 的对象：

```json
{
  "2025-01-15": {
    "limit": 50,
    "confirmed": 30,
    "remaining": 20
  }
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `limit` | `number` | 当天预约上限 |
| `confirmed` | `number` | 已预约数量 |
| `remaining` | `number` | 剩余可预约数量 |

---

## 数据模型

### `Appointment`

| 字段 | 类型 | 说��� |
| --- | --- | --- |
| `id` | `number` | 主键 |
| `userId` | `number` | 所属用户 ID |
| `date` | `string` | 预约日期，`YYYY-MM-DD` |
| `time` | `string` | 预约时间，`HH:mm` |
| `count` | `number` | 预约人数（1 ~ 20） |
| `phone` | `string` | 联系电话 |
| `status` | `AppointmentStatus` | `pending` / `confirmed` / `cancelled` |
| `remark` | `string?` | 备注 |
| `createdAt` | `string` | 创建时间（ISO 8601） |

### `User`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `number` | 主键 |
| `role` | `UserRole` | `admin` / `user` |
| `createdAt` | `string` | 注册时间（ISO 8601） |
| `username` | `string?` | 用户名 |
| `phone` | `string?` | 手机号 |
| `openid` | `string?` | 微信 OpenID |
| `nickname` | `string?` | 微信昵称 |
| `headimgurl` | `string?` | 微信头像 URL |

### `PageResult<T>`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `list` | `T[]` | 数据列表 |
| `total` | `number` | 总条数 |
| `page` | `number` | 当前页 |
| `pageSize` | `number` | 每页条数 |
