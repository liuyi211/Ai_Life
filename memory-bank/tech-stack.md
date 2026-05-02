# Tech Stack

> **项目**: 人生回响 (Life Echo) - AI人生模拟器游戏
> **项目类型**: 全栈应用（前端 + 后端 API + 数据库）
> **最后更新**: 2026-04-30

---

## 1. 技术选型原则

1. **成熟优先**：优先选择社区活跃、文档完善的技术
2. **性能优先**：确保游戏流畅运行，快速响应玩家操作
3. **生态兼容**：确保技术之间能够良好协作
4. **长期维护**：选择有长期支持计划的技术
5. **免费部署优先**：选择有免费托管方案的技术，降低运营成本

---

## 2. 前端技术栈

### 2.1 核心框架

| 技术 | 版本 | 用途 | 选型理由 |
|------|------|------|----------|
| React | ^18.2.0 | UI框架 | 组件化开发，生态丰富，适合复杂交互应用 |
| TypeScript | ^5.3.0 | 类型系统 | 类型安全，提升代码可维护性，减少运行时错误 |
| Vite | ^5.0.0 | 构建工具 | 极速冷启动，HMR支持好，配置简单 |

**什么是Vite？**
Vite是新一代前端构建工具（由Vue作者尤雨溪开发），替代传统Webpack。核心原理是利用浏览器原生ESM（ES模块）实现极速的开发服务器启动，生产构建时使用Rollup打包输出优化后的静态资源。

**为什么选Vite而非Webpack/CRA？**
- ⚡ **极速启动**：秒级冷启动（Webpack可能需要10-30秒）
- 🔥 **即时热更新**：代码修改毫秒级刷新，开发体验极佳
- 🛠️ **配置极简**：React+TS支持开箱即用，无需复杂loader配置
- 📦 **生产优化**：Rollup打包，输出体积更小
- ⚠️ **Create React App已官方弃用**，社区全面转向Vite

### 2.2 状态管理

- **方案**: Zustand + React Context
- **理由**: 
  - Zustand轻量，适合游戏状态管理（角色属性、世界状态、游戏进度）
  - 避免Redux样板代码，支持TypeScript良好
  - Context用于主题/全局配置等不频繁变更的状态

### 2.3 UI 组件与样式

- **组件库**: Radix UI (Headless) + 自定义组件
- **样式方案**: Tailwind CSS + CSS Modules
- **动画库**: Framer Motion
- **理由**:
  - Tailwind快速构建响应式UI
  - Framer Motion实现流畅的过渡动画和交互反馈
  - Radix UI提供无障碍支持的基础组件

**⚠️ UI设计规范**: 所有前端页面基于用户提供的HTML/CSS/JS源码高保真还原，不独立设计。当前登录/注册页面已基于11.html源码完成还原，采用高级暗金风格。后续页面继续遵循此规范。

### 2.4 测试工具

| 类型 | 工具 | 版本 |
|------|------|------|
| 单元测试 | Vitest | ^1.0.0 |
| E2E测试 | Playwright | ^1.40.0 |
| 组件测试 | Testing Library | ^14.0.0 |

---

## 3. 后端技术栈

### 3.1 核心框架

| 技术 | 版本 | 用途 | 选型理由 |
|------|------|------|----------|
| Node.js | >= 18.0.0 | 运行时 | JavaScript全栈统一，生态丰富 |
| Express | ^4.18.0 | Web框架 | 轻量灵活，社区成熟，文档完善 |
| TypeScript | ^5.3.0 | 类型系统 | 前后端统一类型，减少接口错误 |

**为什么选Express而非NestJS/Fastify？**
- Express生态最成熟，中间件丰富
- 本项目后端逻辑相对简单（CRUD+认证），不需要NestJS的复杂架构
- 团队学习成本低，维护简单

### 3.2 数据库

- **主数据库**: PostgreSQL v15+
  - 选型理由：关系型数据库适合用户、存档、成就等结构化数据；ACID保证数据一致性
  - 托管方案：**Neon**（Serverless PostgreSQL，免费额度充足）或 **Supabase**
- **缓存**: Redis（可选，用于会话缓存）
- **ORM**: Prisma
  - 选型理由：类型安全的ORM，自动迁移，优秀的TypeScript支持

### 3.3 认证与安全

- **认证方案**: JWT (JSON Web Token)
- **密码加密**: bcryptjs
- **API安全**: Helmet中间件 + CORS配置 + 速率限制

### 3.4 AI 文本生成服务

- **方案**: OpenAI API / Claude API（用户自行配置Key）
- **用途**: 动态剧情生成、NPC对话、事件描述
- **备用方案**: 本地LLM (Ollama) 支持离线模式
- **实现**: 后端转发请求，保护用户API Key不被前端暴露

---

## 4. 部署方案详解

### 4.1 部署架构

```
用户浏览器
    │
    ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   前端 (React)   │────▶│   后端 (Express) │────▶│   PostgreSQL    │
│  Vercel托管     │     │  Vercel/Railway │     │   (Neon/Supabase)│
│  静态资源+CDN   │     │  Serverless/容器 │     │   Serverless    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 4.2 前端部署（Vercel）

**为什么选Vercel？**
- 与GitHub集成，push即部署
- 全球CDN加速，国内访问速度较好
- 免费额度充足（个人项目完全够用）
- 原生支持Vite项目

**部署步骤**:
1. GitHub仓库连接Vercel
2. 配置构建命令：`npm run build`
3. 输出目录：`dist`
4. 自动获得 `https://life-echo.vercel.app` 域名
5. 可绑定自定义域名

### 4.3 后端部署方案

**方案A：Vercel Serverless Functions（推荐，零成本）**
- 将Express API封装为Serverless Function
- 免费额度：每月100GB带宽 + 1000GB执行时间
- 适合：流量不大的个人项目

**方案B：Railway / Render（传统服务器）**
- 提供持续运行的Node.js容器
- 免费额度：每月500小时运行时间
- 适合：需要WebSocket长连接或定时任务

### 4.4 数据库部署（Neon）

**为什么选Neon？**
- Serverless PostgreSQL，按需付费
- 免费额度：500MB存储 + 每月190小时计算
- 分支功能：开发/测试/生产环境隔离
- 与Vercel集成良好

### 4.5 别人如何访问？

| 环境 | 访问方式 | 说明 |
|------|----------|------|
| 开发环境 | `http://localhost:5173` | 本地开发 |
| 预览环境 | `https://life-echo-git-dev.vercel.app` | 每次PR自动生成 |
| 生产环境 | `https://life-echo.vercel.app` | 主分支自动部署 |
| 自定义域名 | `https://lifeecho.game` | 可绑定自有域名 |

**访问流程**:
1. 用户打开浏览器，输入网址
2. Vercel CDN返回前端静态资源（HTML/CSS/JS）
3. 前端React应用加载，用户看到游戏界面
4. 用户注册/登录时，前端调用后端API
5. 后端验证身份，读写PostgreSQL数据库
6. 游戏存档自动同步到云端

---

## 5. 基础设施

### 5.1 CI/CD

| 技术 | 用途 |
|------|------|
| GitHub Actions | 自动化测试、构建检查 |
| Vercel | 前端自动部署（Git集成） |
| Prisma Migrate | 数据库迁移管理 |

### 5.2 监控与日志

- **错误追踪**: Sentry（前端+后端）
- **日志**: Vercel内置日志 / Winston（后端）
- **分析**: Plausible（隐私友好）

---

## 6. 开发环境

### 6.1 必需工具

```bash
# 运行时
node -v  # >= 18.0.0
npm -v   # >= 9.0.0

# 包管理器
pnpm -v  # 推荐使用 pnpm

# 数据库（开发时可选Docker）
docker --version  # 用于本地PostgreSQL
```

### 6.2 开发配置

- **IDE**: VS Code (推荐插件: ESLint, Prettier, Tailwind CSS IntelliSense, Prisma)
- **代码规范**: ESLint + Prettier + Airbnb TypeScript 规则
- **Git Hooks**: Husky + lint-staged
- **提交规范**: Conventional Commits

---

## 7. 技术约束

### 7.1 兼容性要求

- **浏览器支持**: Chrome >= 90, Firefox >= 88, Safari >= 14
- **Node.js 版本**: >= 18.0.0
- **移动端**: 响应式设计，支持平板和桌面端

### 7.2 性能约束

- **Bundle 大小**: 首屏 < 500KB（游戏资源懒加载）
- **AI响应**: 流式输出，首字响应 < 2s
- **存档加载**: < 500ms
- **API响应**: P95 < 200ms

### 7.3 安全约束

- **API Key**: 后端转发AI请求，前端不直接暴露Key
- **密码存储**: bcrypt哈希，绝不明文存储
- **JWT安全**: 短有效期Access Token + Refresh Token机制
- **依赖审计**: 每月运行 `npm audit`
- **CORS限制**: 只允许前端域名访问API

---

## 8. 技术债务追踪

| 编号 | 描述 | 影响 | 计划处理时间 |
|------|------|------|-------------|
| TD-001 | AI响应延迟优化 | 中 | 阶段4 |
| TD-002 | 本地LLM支持（Ollama） | 低 | 阶段5 |
| TD-003 | 多语言本地化 | 低 | 阶段6 |
| TD-004 | 社交功能（排行榜/分享） | 低 | 阶段7 |

---

## 9. 项目目录结构

```
life-echo/
├── apps/
│   ├── web/                    # 前端应用 (React + Vite)
│   │   ├── public/            # 静态资源
│   │   ├── src/
│   │   │   ├── components/    # React组件
│   │   │   ├── pages/         # 页面组件
│   │   │   ├── hooks/         # 自定义Hooks
│   │   │   ├── stores/        # Zustand状态管理
│   │   │   ├── services/      # API客户端
│   │   │   ├── engine/        # 游戏引擎核心
│   │   │   ├── types/         # TypeScript类型
│   │   │   └── utils/         # 工具函数
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tailwind.config.js
│   │
│   └── api/                    # 后端应用 (Express)
│       ├── src/
│       │   ├── routes/        # API路由
│       │   ├── controllers/   # 控制器
│       │   ├── services/      # 业务逻辑
│       │   ├── middleware/    # 中间件（认证、错误处理）
│       │   ├── models/        # 数据模型（Prisma）
│       │   ├── utils/         # 工具函数
│       │   └── types/         # TypeScript类型
│       ├── prisma/
│       │   └── schema.prisma  # 数据库Schema
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── shared-types/           # 前后端共享类型
│
├── tests/                      # E2E测试
├── docs/                       # 项目文档
├── package.json                # 根目录Workspace配置
└── README.md
```
