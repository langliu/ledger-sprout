# AGENTS.md

此文件供在此仓库中工作的 AI 代理（如你自己）使用。包含构建/检查命令和代码风格指南。

## 技术栈

- Next.js 16（App Router）
- React 19
- TypeScript（strict）
- Convex
- Better Auth
- Tailwind CSS v4
- shadcn/ui
- Bun（包管理与脚本执行）

## 命令

### 开发

```bash
npm run dev          # 启动开发服务器 (或 bun dev)
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 运行 ESLint
```

### Lint 和类型检查

```bash
npm run lint         # 运行 ESLint
npx tsc --noEmit     # TypeScript 类型检查（无输出）
```

### 测试

项目当前未配置测试框架。如需添加测试，请先配置 Jest、Vitest 或 Next.js 的测试工具。

## 代码风格指南

### TypeScript 配置

- 使用 `strict: true` 严格模式
- 目标 ES2023+
- 模块解析：bundler
- JSX 转换：react-jsx（React 19 自动转换）
- 路径别名：`@/*` 映射到项目根目录

### 导入顺序

1. React/Next.js 核心导入
2. 第三方库导入
3. 类型导入（使用 `import type`）
4. 本地组件/模块导入（使用 `@/` 别名）
5. 样式文件导入（CSS）

```typescript
import Image from "next/image";
import type { Metadata } from "next";
import "./globals.css";
```

### 命名约定

- **组件**: PascalCase（如 `Home`, `RootLayout`）
- **函数/变量**: camelCase（如 `geistSans`, `handleClick`）
- **常量**: UPPER_SNAKE_CASE 或 camelCase（根据作用域）
- **类型/接口**: PascalCase（如 `Metadata`, `Props`）
- **文件名**: kebab-case 或 camelCase（如 `page.tsx`, `useData.ts`）

### 组件风格

```typescript
// 使用函数式组件 + TypeScript 类型注解
export default function ComponentName({ prop }: Readonly<{ prop: string }>) {
  return <div>{prop}</div>;
}

// 对于复杂 props，定义接口
interface Props {
  title: string;
  children: React.ReactNode;
}

export default function Layout({ title, children }: Props) {
  return (
    <section>
      <h1>{title}</h1>
      {children}
    </section>
  );
}
```

### 类型定义

- 使用 `Readonly` 包装 props 类型防止意外修改
- 导入类型时使用 `import type { ... }`
- 优先使用 TypeScript 类型而非接口（接口用于需要扩展的场景）

```typescript
import type { Metadata } from "next";
```

### JSX/TSX 风格

- 使用自闭合标签当没有子元素
- 属性使用双引号
- 布尔属性直接使用（如 `priority` 而非 `priority={true}`）
- className 使用 Tailwind utility classes

```typescript
<Image src="/logo.svg" alt="Logo" width={100} height={20} priority />
```

### CSS 和 Tailwind

- 优先使用 Tailwind utility classes
- 使用 dark mode 前缀支持暗色模式：`dark:bg-black`
- 全局样式放在 `app/globals.css`
- CSS 变量定义在 `:root` 和 `@media (prefers-color-scheme: dark)`

```tsx
<div className="flex items-center justify-center bg-white dark:bg-black" />
```

### 错误处理

- 使用 TypeScript 类型捕获编译时错误
- 在 API 路由中使用 try-catch
- 对于用户输入，添加适当验证

### Next.js 特定规范

- 使用 App Router（`app/` 目录）
- 使用 Server Components 为默认，仅在需要交互时使用 Client Components
- Client Components 添加 `"use client"` 指令在文件顶部
- 布局组件使用 `layout.tsx` 文件
- 元数据使用 `metadata` 导出

### ESLint 规则

项目使用 Next.js 官方配置：

- `eslint-config-next/core-web-vitals`
- `eslint-config-next/typescript`

主要规则：

- 必须使用 `import type` 导入仅作为类型使用的导入
- 正确使用 React hooks（如果使用 Client Components）

### 文件组织

```text
app/
  ├── layout.tsx       # 根布局
  ├── page.tsx         # 首页
  ├── globals.css      # 全局样式
  └── [route]/         # 动态路由目录
      ├── page.tsx
      └── layout.tsx
```

### 其他注意事项

- 使用 Bun 作为包管理器（存在 bun.lock）
- Next.js 16 + React 19
- Tailwind CSS v4
- 优先使用 TypeScript 类型而非 any
- 保持组件小而专注
- 使用语义化 HTML 标签

## Git Commit 规范

### 提交时机

- 仅在用户明确要求时执行 `git commit`
- 提交前先检查变更：`git status --short`、`git diff --staged`、`git diff`
- 避免把无关改动混入同一个提交（按功能拆分提交）

### 提交信息格式

- 提交信息必须使用以下格式：`type(socpe): subject`
- 常用 `type`：`feat`、`fix`、`refactor`、`docs`、`style`、`test`、`chore`
- `subject` 必须使用中文简洁祈使句，聚焦“为什么改”，长度建议不超过 72 字符
- 提交正文使用要点列表，格式如下：

```text
type(socpe): subject

- 要点一
- 要点二
```
- 提交正文要点必须使用中文
- 如需补充背景，在正文说明动机、影响范围和兼容性

示例：

```text
feat(auth): add refresh token rotation for session security

- reduce token replay risk for long-lived sessions
- keep existing login flow compatible without client changes

fix(ui): avoid hydration mismatch in server-rendered theme toggle

- align server/client initial theme calculation
- prevent flicker during first paint

docs(agents): add commit rules and Chinese-only response policy

- standardize commit message structure for agents
- enforce Chinese as default response language
```

### 提交流程（代理执行）

1. 确认用户已明确要求提交
2. 检查并仅暂存相关文件：`git add <files>`
3. 执行提交：`git commit`（标题和正文均使用中文；标题使用 `type(socpe): subject`，正文使用要点列表）
4. 提交后复查：`git status`

### 安全限制

- 禁止提交密钥或敏感文件（如 `.env`、凭据、私钥）
- 禁止使用破坏性命令（如 `git reset --hard`）除非用户明确要求
- 非必要不使用 `--amend`，仅在用户明确要求时使用

## 代理回答语言规范

- 默认且必须使用中文回复用户
- 代码、命令、路径、配置键名保持原文（通常为英文）
- 报错信息可保留英文原文，并在中文中解释关键原因
- 除非用户明确要求其他语言，不要切换回复语言
