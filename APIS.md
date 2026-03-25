# 预约管理系统 — 后端接口文档

> 本文档由前端代码（Mock 数据 + API 调用层）自动整理，供后端按此规范实现接口。

---

## 目录

- [通用约定](#通用约定)
- [认证模块](#认证模块)
- [仪表盘模块](#仪表盘模块)
- [预约模块（管理端）](#预约模块管理端)
- [预约模块（H5 端）](#预约模块h5-端)
- [用户模块](#用户模块)
- [数据类型定义](#数据类型定义)

---

## 通用约定

### 响应格式

所有接口统一返回以下 JSON 结构：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

| 字段      | 类型     | 说明                            |
| --------- | -------- | ------------------------------- |
| `code`    | `number` | `0` 表示成功，非 `0` 表示失败   |
| `message` | `string` | 提示信息，失败时为错误描述      |
| `data`    | `any`    | 实际业务数据，失败时可为 `null` |

### 鉴权

**管理端（web）**所有接口（除登录外）需要在请求头携带 Token：

```
Authorization: Bearer <token>
```

Token 由登录接口返回。服务端验证失败时返回 **HTTP 401**，前端收到 401 会自动跳转登录页。

**H5 端**不使用 Token，鉴权机制由后端通过微信 openId / session 自行实现。

### 分页请求参数

| 参数       | 类型     | 默认值 | 说明                |
| ---------- | -------- | ------ | ------------------- |
| `page`     | `number` | `1`    | 当前页码，从 1 开始 |
| `pageSize` | `number` | `10`   | 每页条数            |

### 分页响应结构

```json
{
  "list": [],
  "total": 100,
  "page": 1,
  "pageSize": 10
}
```

---

## 认证模块

### 登录

**POST** `/auth/login`

无需鉴权。

**请求体**

```json
{
  "username": "admin",
  "password": "123456"
}
```

| 字段       | 类型     | 必填 | 说明 |
| ---------- | -------- | ---- | ---- |
| `username` | `string` | ✅   | 账号 |
| `password` | `string` | ✅   | 密码 |

**响应 `data`**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "phone": "13800138000",
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

| 字段             | 类型                | 说明                        |
| ---------------- | ------------------- | --------------------------- |
| `token`          | `string`            | JWT Token，前端后续请求携带 |
| `user.id`        | `number`            | 用户 ID                     |
| `user.username`  | `string`            | 用户名                      |
| `user.role`      | `"admin" \| "user"` | 角色                        |
| `user.phone`     | `string?`           | 手机号（可选）              |
| `user.createdAt` | `string`            | 注册时间（ISO 8601）        |

**错误情况**

| HTTP 状态码 | code   | 说明           |
| ----------- | ------ | -------------- |
| `200`       | `1001` | 账号或密码错误 |

---

## 仪表盘模块

> 以下接口均需管理端 Token 鉴权。

### 获取统计概览

**GET** `/dashboard/stats`

无请求参数。

**响应 `data`**

```json
{
  "totalAppointments": 328,
  "todayAppointments": 12,
  "pendingAppointments": 24,
  "totalUsers": 156
}
```

| 字段                  | 类型     | 说明                 |
| --------------------- | -------- | -------------------- |
| `totalAppointments`   | `number` | 总预约数（所有状态） |
| `todayAppointments`   | `number` | 今日新增预约数       |
| `pendingAppointments` | `number` | 待确认的预约数       |
| `totalUsers`          | `number` | 注册用户总数         |

---

### 获取近 N 天预约数量

**GET** `/dashboard/daily`

**Query 参数**

| 参数   | 类型     | 默认值 | 说明                    |
| ------ | -------- | ------ | ----------------------- |
| `days` | `number` | `7`    | 查询最近 N 天（含今天） |

**响应 `data`**

按日期升序排列的数组：

```json
[
  { "date": "2026-03-19", "count": 8 },
  { "date": "2026-03-20", "count": 15 },
  { "date": "2026-03-21", "count": 6 },
  { "date": "2026-03-22", "count": 12 },
  { "date": "2026-03-23", "count": 9 },
  { "date": "2026-03-24", "count": 11 },
  { "date": "2026-03-25", "count": 5 }
]
```

| 字段    | 类型     | 说明                     |
| ------- | -------- | ------------------------ |
| `date`  | `string` | 日期，格��� `YYYY-MM-DD` |
| `count` | `number` | 当天预约总数（所有状态） |

---

### 获取预约状态分布

**GET** `/dashboard/status-distribution`

无请求参数。

**响应 `data`**

```json
[
  { "status": "pending", "label": "待确认", "count": 24 },
  { "status": "confirmed", "label": "已确认", "count": 189 },
  { "status": "cancelled", "label": "已取消", "count": 115 }
]
```

| 字段     | 类型                                      | 说明             |
| -------- | ----------------------------------------- | ---------------- |
| `status` | `"pending" \| "confirmed" \| "cancelled"` | 状态值           |
| `label`  | `string`                                  | 状态中文名       |
| `count`  | `number`                                  | 该状态的预约数量 |

---

## 预约模块（管理端）

> 以下接口均需管理端 Token 鉴权。

### 获取预约列表

**GET** `/appointments`

**Query 参数**

| 参数        | 类型                                      | 必填 | 说明                                |
| ----------- | ----------------------------------------- | ---- | ----------------------------------- |
| `page`      | `number`                                  | ✅   | 页码                                |
| `pageSize`  | `number`                                  | ✅   | 每页条数                            |
| `phone`     | `string`                                  | ❌   | 按手机号模糊搜索                    |
| `status`    | `"pending" \| "confirmed" \| "cancelled"` | ❌   | 按状态筛选，不传则返回全部          |
| `dateStart` | `string`                                  | ❌   | 预约日期范围起始，格式 `YYYY-MM-DD` |
| `dateEnd`   | `string`                                  | ❌   | 预约日期范围截止，格式 `YYYY-MM-DD` |

**响应 `data`**

```json
{
  "list": [
    {
      "id": 1,
      "userId": 3,
      "date": "2026-03-25",
      "time": "10:00",
      "count": 2,
      "phone": "13800138001",
      "status": "pending",
      "remark": "需要靠窗位置",
      "createdAt": "2026-03-23T09:12:00Z"
    }
  ],
  "total": 38,
  "page": 1,
  "pageSize": 10
}
```

---

### 更新预约状态

**PATCH** `/appointments/:id/status`

**Path 参数**

| 参数 | 类型     | 说明    |
| ---- | -------- | ------- |
| `id` | `number` | 预约 ID |

**请求体**

```json
{
  "status": "confirmed"
}
```

| 字段     | 类型                                      | 必填 | 说明     |
| -------- | ----------------------------------------- | ---- | -------- |
| `status` | `"pending" \| "confirmed" \| "cancelled"` | ✅   | 目标状态 |

**响应 `data`**

```json
null
```

**错误情况**

| HTTP 状态码 | code   | 说明           |
| ----------- | ------ | -------------- |
| `200`       | `1002` | 预约不存在     |
| `200`       | `1003` | 状态流转不合法 |

---

## 预约模块（H5 端）

> H5 端不使用 JWT Token，鉴权由后端通过微信 openId / session 实现。

### 提交预约

**POST** `/appointments`

**请求体**

```json
{
  "date": "2026-03-28",
  "time": "14:00",
  "count": 3,
  "phone": "13800138000",
  "remark": "需要儿童座椅"
}
```

| 字段     | 类型     | 必填 | 说明                        |
| -------- | -------- | ---- | --------------------------- |
| `date`   | `string` | ✅   | 预约日期，格式 `YYYY-MM-DD` |
| `time`   | `string` | ✅   | 预约时间，格式 `HH:mm`      |
| `count`  | `number` | ✅   | 预约人数，正整数            |
| `phone`  | `string` | ✅   | 联系手机号                  |
| `remark` | `string` | ❌   | 备注信息                    |

**响应 `data`**

```json
null
```

---

### 获取历史预约记录（H5）

**GET** `/appointments/history`

返回当前用户自己的预约记录，需后端通过 session/openId 识别用户。

**Query 参数**

| 参数       | 类型     | 默认值 | 说明     |
| ---------- | -------- | ------ | -------- |
| `page`     | `number` | `1`    | 页码     |
| `pageSize` | `number` | `10`   | 每页条数 |

**响应 `data`**

```json
{
  "list": [
    {
      "id": 2,
      "userId": 1,
      "date": "2026-03-22",
      "time": "14:00",
      "count": 4,
      "phone": "13800138000",
      "status": "pending",
      "remark": "需要靠窗位置",
      "createdAt": "2026-03-19T10:30:00Z"
    }
  ],
  "total": 3,
  "page": 1,
  "pageSize": 10
}
```

---

### 取消预约（H5）

**PATCH** `/appointments/:id/status`

H5 端用户只能将自己的预约取消（`cancelled`），后端需校验该预约归属于当前用户，且当前状态为 `pending`。

**Path 参数**

| 参数 | 类型     | 说明    |
| ---- | -------- | ------- |
| `id` | `number` | 预约 ID |

**请求体**

```json
{
  "status": "cancelled"
}
```

**响应 `data`**

```json
null
```

**错误情况**

| HTTP 状态码 | code   | 说明                             |
| ----------- | ------ | -------------------------------- |
| `200`       | `1002` | 预约不存在                       |
| `200`       | `1004` | 无权操作他人预约                 |
| `200`       | `1003` | 预约状态不允许取消（非 pending） |

---

## 用户模块

> 需管理端 Token 鉴权。

### 获取用户列表

**GET** `/users`

**Query 参数**

| 参数       | 类型     | 必填 | 说明             |
| ---------- | -------- | ---- | ---------------- |
| `page`     | `number` | ✅   | 页码             |
| `pageSize` | `number` | ✅   | 每页条数         |
| `username` | `string` | ❌   | 按用户名模糊搜索 |
| `phone`    | `string` | ❌   | 按手机号模糊搜索 |

**响应 `data`**

```json
{
  "list": [
    {
      "id": 1,
      "username": "admin",
      "role": "admin",
      "phone": "13800138000",
      "createdAt": "2026-01-01T00:00:00Z"
    },
    {
      "id": 2,
      "username": "user_001",
      "role": "user",
      "phone": "13900139001",
      "createdAt": "2026-02-10T08:30:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "pageSize": 10
}
```

---

## 数据类型定义

### `Appointment` 预约

| 字段        | 类型                                      | 说明                   |
| ----------- | ----------------------------------------- | ---------------------- |
| `id`        | `number`                                  | 预约 ID                |
| `userId`    | `number`                                  | 关联用户 ID            |
| `date`      | `string`                                  | 预约日期，`YYYY-MM-DD` |
| `time`      | `string`                                  | 预约时间，`HH:mm`      |
| `count`     | `number`                                  | 预约人数               |
| `phone`     | `string`                                  | 联系手机号             |
| `status`    | `"pending" \| "confirmed" \| "cancelled"` | 预约状态               |
| `remark`    | `string?`                                 | 备注（可选）           |
| `createdAt` | `string`                                  | 创建时间，ISO 8601     |

### `User` 用户

| 字段        | 类型                | 说明               |
| ----------- | ------------------- | ------------------ |
| `id`        | `number`            | 用户 ID            |
| `username`  | `string`            | 用户名             |
| `role`      | `"admin" \| "user"` | 角色               |
| `phone`     | `string?`           | 手机号（可选）     |
| `createdAt` | `string`            | 注册时间，ISO 8601 |

### `AppointmentStatus` 状态枚举

| 值          | 中文   | 说明                                                |
| ----------- | ------ | --------------------------------------------------- |
| `pending`   | 待确认 | 用户提交后的初始状态                                |
| `confirmed` | 已确认 | 管理端确认后                                        |
| `cancelled` | 已取消 | 管理端取消 或 用户主动取消（仅 pending 状态可取消） |

---

## 接口速查表

| #   | 模块   | 调用方 | 方法  | 路径                             | 需要鉴权           |
| --- | ------ | ------ | ----- | -------------------------------- | ------------------ |
| 1   | 认证   | web    | POST  | `/auth/login`                    | ❌                 |
| 2   | 仪表盘 | web    | GET   | `/dashboard/stats`               | ✅ Bearer Token    |
| 3   | 仪表盘 | web    | GET   | `/dashboard/daily`               | ✅ Bearer Token    |
| 4   | 仪表盘 | web    | GET   | `/dashboard/status-distribution` | ✅ Bearer Token    |
| 5   | 预约   | web    | GET   | `/appointments`                  | ✅ Bearer Token    |
| 6   | 预约   | web    | PATCH | `/appointments/:id/status`       | ✅ Bearer Token    |
| 7   | 用户   | web    | GET   | `/users`                         | ✅ Bearer Token    |
| 8   | 预约   | h5     | POST  | `/appointments`                  | ❌（微信 session） |
| 9   | 预约   | h5     | GET   | `/appointments/history`          | ❌（微信 session） |
| 10  | 预约   | h5     | PATCH | `/appointments/:id/status`       | ❌（微信 session） |
