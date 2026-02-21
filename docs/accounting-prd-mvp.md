# 账芽 PRD（MVP 可开发版）

## 1. 文档信息

- 版本：v1.0
- 目标阶段：MVP（P0）
- 适用范围：个人记账（Web 端优先）
- 关联文档：`docs/accounting-features.md`

## 2. 目标与成功指标

### 2.1 产品目标

- 用户能在 10 秒内完成一笔基础记账（收入/支出）。
- 用户能在同一页面完成“记录-查找-复盘”的闭环。
- 用户每月可查看收支汇总和分类占比，形成复盘习惯。

### 2.2 成功指标（MVP）

- D7 记账留存率 >= 25%
- 首次记账完成率 >= 80%
- 手动记账平均耗时 <= 10 秒
- 月度报表查看率 >= 40%

## 3. 用户角色与权限

1. 普通用户
- 管理自己的账本、账户、分类、流水、预算
- 仅可访问自己的数据

2. 系统
- 负责鉴权、数据隔离、审计日志（基础）

## 4. 业务范围（MVP）

### 4.1 必做模块

1. 认证与会话
- 登录、登出
- 会话有效期校验

2. 账本与账户
- 默认账本自动创建
- 账户增删改查

3. 流水管理
- 支出/收入/转账记账
- 流水列表与筛选
- 流水编辑与删除

4. 分类管理
- 内置分类
- 自定义分类增删改

5. 报表
- 月度收支汇总
- 分类占比
- 收支趋势

### 4.2 不在 MVP 范围

- OCR 识别
- AI 自动分类
- 家庭协作账本
- 多币种汇率自动换算

## 5. 信息架构与页面清单

1. `app/sign-in/page.tsx`
- 登录页
- 功能：账号登录、异常提示、登录成功跳转

2. `app/dashboard/page.tsx`
- 首页仪表盘
- 功能：本月收支卡片、趋势图、近期流水、快捷记账入口

3. `app/transactions/page.tsx`
- 流水页
- 功能：列表、筛选、搜索、分页、编辑、删除

4. `app/transactions/new/page.tsx`
- 新增流水页
- 功能：录入金额、类型、分类、账户、时间、备注

5. `app/accounts/page.tsx`
- 账户管理页
- 功能：账户列表、新增、编辑、停用

6. `app/categories/page.tsx`
- 分类管理页
- 功能：分类列表、新增、编辑、停用

7. `app/reports/page.tsx`
- 报表页
- 功能：月度汇总、分类占比、趋势切换（日/月）

## 6. 核心流程

### 6.1 首次使用流程

1. 用户登录
2. 系统创建默认账本与默认分类（若不存在）
3. 引导创建至少一个账户
4. 完成第一笔记账
5. 返回仪表盘查看变化

### 6.2 记一笔支出流程

1. 点击“记一笔”
2. 选择类型“支出”
3. 输入金额、分类、账户、时间
4. 提交后写入流水
5. 更新账户余额与报表聚合数据

### 6.3 转账流程

1. 选择类型“转账”
2. 选择转出账户与转入账户
3. 输入金额与时间
4. 事务性写入：转出扣减 + 转入增加
5. 列表可追踪该笔转账

## 7. 数据模型（MVP）

1. Ledger
- `id`
- `userId`
- `name`
- `isDefault`
- `createdAt`

2. Account
- `id`
- `ledgerId`
- `name`
- `type`（cash/bank/credit/wallet）
- `initialBalance`（最小货币单位整数）
- `currentBalance`（最小货币单位整数）
- `status`（active/inactive）
- `createdAt`

3. Category
- `id`
- `ledgerId`
- `name`
- `type`（expense/income）
- `isSystem`
- `status`

4. Transaction
- `id`
- `ledgerId`
- `accountId`
- `type`（expense/income/transfer）
- `amount`（最小货币单位整数）
- `occurredAt`
- `categoryId`（转账可空）
- `note`
- `transferAccountId`（转账时必填）
- `createdAt`

## 8. Convex API 清单（建议）

### 8.1 账本与初始化

1. `ledgers.ensureDefault()`
- 输入：无
- 输出：默认账本对象
- 说明：首次访问自动创建默认账本

### 8.2 账户

1. `accounts.list({ ledgerId })`
2. `accounts.create({ ledgerId, name, type, initialBalance })`
3. `accounts.update({ accountId, name, type, status })`
4. `accounts.adjustBalance({ accountId, delta, reason })`

### 8.3 分类

1. `categories.list({ ledgerId, type? })`
2. `categories.create({ ledgerId, name, type })`
3. `categories.update({ categoryId, name, status })`

### 8.4 流水

1. `transactions.list({ ledgerId, page, filters })`
2. `transactions.createExpense({ ... })`
3. `transactions.createIncome({ ... })`
4. `transactions.createTransfer({ fromAccountId, toAccountId, amount, occurredAt, note? })`
5. `transactions.update({ transactionId, ... })`
6. `transactions.remove({ transactionId })`

### 8.5 报表

1. `reports.monthlySummary({ ledgerId, year, month })`
2. `reports.categoryBreakdown({ ledgerId, year, month, type })`
3. `reports.trend({ ledgerId, from, to, granularity })`

## 9. 验收标准（可测试）

### 9.1 认证与隔离

1. 未登录访问业务页面时，跳转到登录页。
2. A 用户无法查询或修改 B 用户账本下任何数据。

### 9.2 记账能力

1. 新增一笔支出后，流水列表出现该记录，账户余额同步减少。
2. 新增一笔收入后，流水列表出现该记录，账户余额同步增加。
3. 新增一笔转账后，转出账户减少且转入账户增加，金额一致。

### 9.3 查询与筛选

1. 按“账户 + 分类 + 时间区间”筛选时，结果只返回匹配数据。
2. 关键词搜索可命中备注字段。

### 9.4 报表

1. 月度汇总与流水总和一致（收入、支出、结余）。
2. 分类占比总和误差在可接受范围（前端四舍五入导致的显示误差除外）。

### 9.5 数据正确性

1. 金额字段均为整数存储（最小货币单位）。
2. 任一写入失败不得造成“余额已变更但流水不存在”的脏数据。

## 10. 技术与实现约束

- 前端：Next.js App Router，默认 Server Components。
- 后端：Convex Query/Mutation，关键写操作保持原子性。
- 鉴权：Better Auth，按 `userId` 强制隔离。
- 类型：TypeScript strict，禁止 `any` 逃逸关键业务字段。

## 11. 开发里程碑（建议）

1. M1（第 1 周）
- 完成认证接入、默认账本初始化、账户/分类基础 CRUD

2. M2（第 2 周）
- 完成流水 CRUD、筛选搜索、账户余额联动

3. M3（第 3 周）
- 完成报表页与仪表盘联动、关键验收用例走通

4. M4（第 4 周）
- 体验优化、异常处理、埋点与灰度上线准备
