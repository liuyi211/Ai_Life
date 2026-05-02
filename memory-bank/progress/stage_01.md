# Stage 01 - 项目初始化与认证系统

> **阶段**: 01
> **名称**: 基础框架搭建 + 用户认证系统 + UI风格定调
> **时间范围**: 2026-04-30 ~ 2026-04-30
> **状态**: ✅ 已完成

---

## 目标

搭建可运行的前后端基础框架，实现用户认证系统（注册/登录），完成UI风格定调（高级暗金风格，基于11.html源码）。

---

## 已完成的任务

### 基础框架
- [x] 初始化前端项目（Vite + React + TypeScript + Tailwind CSS）
- [x] 初始化后端项目（Express + TypeScript + Prisma）
- [x] 配置 pnpm Workspace（monorepo）
- [x] 配置路径别名（前后端统一 `@/`）
- [x] 编写第一个健康检查接口 `/api/health`
- [x] 配置 .gitignore（根目录 + 前后端）
- [x] 清理 npm 混用问题（删除 package-lock.json）

### 数据库
- [x] 设计 Prisma Schema（User, SaveData, Achievement, UserAchievement）
- [x] 配置本地开发数据库（Docker Compose）
- [x] 编写数据库配置文档（docs/database-setup.md）

### 认证系统
- [x] 实现用户注册 API（用户名唯一校验 + bcrypt加密）
- [x] 实现用户登录 API（JWT签发）
- [x] 实现认证中间件（JWT验证）
- [x] 封装前端 API 客户端（axios + interceptors）
- [x] 实现 Zustand 认证状态管理（持久化到 localStorage）

### UI 实现（基于 11.html 高级暗金风格）
- [x] 配置 Google Fonts（Cormorant Garamond + Noto Serif SC）
- [x] 全局 CSS 样式（背景渐变 + 网格纹理 + CSS变量）
- [x] 登录页面（高保真还原11.html）
  - Sigil 呼吸动画装饰
  - Oracle Gate 顶部栏 + 印章"命"
  - 登录卡片（边框 + 内边框 + 四角暗红装饰 + ACCESS TO DESTINY 水印）
  - 双栏表单标签（英文斜体 + 中文）
  - 底部细线输入框（focus变暗红 + 左滑入动画）
  - "[ 隐 ]" / "[ 显 ]" 文字切换密码
  - 诗意文案（登录态）
  - 黑色填充按钮（点击变暗红 + 下压动画）
  - 访客登录 + 创建命运 底部链接
  - Toast 提示系统
- [x] 注册页面（与登录页风格统一）
  - 铭刻印记标题
  - 三个输入框（账户名/密码/确认密码）
  - 诗意文案（注册态）
  - 返回登录神殿 链接
- [x] React Router 路由配置（/login, /register, /）
- [x] 路由守卫（未登录跳转登录页）
- [x] 响应式适配（<380px缩小 / ≥768px居中卡片）

---

## 技术决策

### ADR-001: 采用高级暗金风格UI，基于11.html源码

- **原因**: 用户提供11.html参考源码，要求高保真还原
- **实现**: 
  - 暖灰白背景 `#eee9df` + 多层径向渐变（暗红/金色/墨色）
  - 字体：Cormorant Garamond（英文）+ Noto Serif SC（中文）
  - Sigil 呼吸动画同心圆 + 六角星线
  - 登录卡片：边框 + 内边框 + 四角暗红装饰 + 水印
  - 双栏标签：英文斜体（如 "01 / Soul Mark"）+ 中文（如 "灵魂印记"）
  - 底部细线输入框，focus变暗红，placeholder 16px 极淡
  - 黑色按钮，点击变暗红，宽字距
  - Toast 提示系统
  - 响应式：手机端全屏 / 桌面端居中卡片

---

## 遇到的问题与解决

### 问题1: Tailwind CSS v4 与 PostCSS 配置冲突
**现象**: `[postcss] It looks like you're trying to use 'tailwindcss' directly as a PostCSS plugin`  
**解决**: 降级到 Tailwind CSS v3

### 问题2: App.tsx 被还原为 Vite 默认模板
**现象**: `Failed to resolve import "./App.css"`  
**解决**: 重新写入路由配置代码

### 问题3: Prisma Client 模块未找到
**现象**: `Cannot find module '.prisma/client/default'`  
**解决**: 运行 `npx prisma generate`

### 问题4: npm 与 pnpm 混用
**现象**: 同时存在 package-lock.json 和 pnpm-lock.yaml  
**解决**: 删除 package-lock.json，统一使用 pnpm

### 问题5: 点击输入框出现 outline 边框
**现象**: 密码输入框点击后有浏览器默认边框  
**解决**: 添加 `outline: 'none'` 到所有 input

---

## 验证结果

| 检查项 | 结果 | 备注 |
|--------|------|------|
| 前端 `npm run dev` 启动 | ✅ 成功 | http://localhost:5173 |
| 后端 `npm run dev` 启动 | ✅ 成功 | http://localhost:3001 |
| `/api/health` 健康检查 | ✅ 200 | 返回 `{status: "ok"}` |
| 登录页面显示 | ✅ 正常 | 高级暗金风格，与11.html一致 |
| 注册页面显示 | ✅ 正常 | 与登录页风格统一 |
| 数据库 Schema 设计 | ✅ 完成 | User/SaveData/Achievement |
| Docker Compose 配置 | ✅ 完成 | PostgreSQL |
| .gitignore | ✅ 完成 | 根目录+前后端 |
| 字体加载 | ✅ 完成 | Google Fonts |
| 响应式布局 | ✅ 完成 | 手机端+桌面端 |

---

## 阶段总结

**完成情况**: 10/10 任务完成

**主要成果**:
1. 完整的前后端项目结构（monorepo，pnpm workspace）
2. 高级暗金风格的登录/注册页面（高保真还原11.html）
3. JWT 认证系统（注册/登录/状态管理）
4. Prisma 数据库模型设计 + Docker 配置
5. 完整的项目文档（README + 数据库配置指南）

**经验教训**:
- Tailwind CSS v4 与 v3 配置差异大，开发前需明确版本
- 文件被覆盖时要检查业务代码是否保留
- Prisma Client 需要手动生成
- 避免 npm/pnpm 混用，保持包管理器统一
- outline 需要显式清除以去除浏览器默认样式

---

## 下一阶段准备

阶段 02 依赖本阶段的以下产出：
- [x] 前后端基础框架
- [x] 认证系统（注册/登录/JWT）
- [x] UI 风格定调（高级暗金风格）
- [x] 数据库 Schema 设计
- [x] Docker 开发环境配置

**阶段 02 目标**: 数据库连接验证 + 完整注册登录流程联调
