# 人生回响 (Life Echo)

> AI驱动的无限命运模拟器

## 项目简介

《人生回响》是一款AI驱动的人生模拟器游戏。玩家可以自定义角色属性、选择不同的世界背景，在AI实时生成的剧情中体验独一无二的人生轨迹。

**核心特色：**
- 🎭 多世界系统（地球、赛博、修仙、丧尸等）
- 🤖 AI动态叙事，每次游戏都是独特体验
- 🔄 轮回继承系统，多周目玩法
- ✨ 智能NPC自由对话

## 技术栈

- **前端**: React 18 + TypeScript + Vite + Tailwind CSS + Zustand
- **后端**: Express + TypeScript + Prisma
- **数据库**: PostgreSQL
- **AI**: OpenAI API / Claude API

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0（推荐）
- Docker（可选，用于本地数据库）

### 1. 安装依赖

```bash
# 使用 pnpm（推荐）
pnpm install

# 或使用 npm
npm install
```

### 2. 配置数据库

#### 方案 A: Docker（推荐开发使用）

```bash
# 启动 PostgreSQL 和 Redis
docker-compose up -d

# 运行数据库迁移
cd apps/api
npx prisma migrate dev
```

#### 方案 B: Neon PostgreSQL（生产环境）

1. 访问 [Neon](https://neon.tech) 注册账号
2. 创建数据库项目
3. 修改 `apps/api/.env` 中的 `DATABASE_URL`
4. 运行迁移：`npx prisma migrate deploy`

### 3. 启动开发服务器

```bash
# 同时启动前后端
pnpm dev

# 或分别启动
pnpm dev:api   # 后端: http://localhost:3001
pnpm dev:web   # 前端: http://localhost:5173
```

### 4. 访问应用

- 前端: http://localhost:5173
- 后端 API: http://localhost:3001/api
- 数据库管理: http://localhost:5555 (Prisma Studio)

## 项目结构

```
life-echo/
├── apps/
│   ├── web/              # 前端应用 (React + Vite)
│   │   ├── src/
│   │   │   ├── pages/    # 页面组件
│   │   │   ├── services/ # API 服务
│   │   │   ├── stores/   # Zustand 状态管理
│   │   │   └── ...
│   │   └── package.json
│   │
│   └── api/              # 后端应用 (Express)
│       ├── src/
│       │   ├── controllers/  # 控制器
│       │   ├── routes/       # 路由
│       │   ├── middleware/   # 中间件
│       │   └── ...
│       ├── prisma/
│       │   └── schema.prisma # 数据库模型
│       └── package.json
│
├── docker-compose.yml    # Docker 开发环境
├── docs/                 # 项目文档
└── package.json          # 根目录工作区配置
```

## 开发指南

### 常用命令

```bash
# 安装所有依赖
pnpm install

# 启动开发环境
pnpm dev

# 数据库迁移
cd apps/api && npx prisma migrate dev

# 查看数据库
npx prisma studio

# 生成 Prisma Client
npx prisma generate

# 构建生产版本
pnpm build
```

### API 接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| GET | /api/auth/me | 获取当前用户 |
| GET | /api/health | 健康检查 |

### 环境变量

**前端** (`apps/web/.env`):
```env
VITE_API_URL=http://localhost:3001/api
```

**后端** (`apps/api/.env`):
```env
DATABASE_URL="postgresql://life_echo:life_echo_dev@localhost:5432/life_echo?schema=public"
JWT_SECRET="your-secret-key"
```

## 部署

### 前端部署 (Vercel)

1. 推送代码到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 设置根目录为 `apps/web`
4. 添加环境变量 `VITE_API_URL`

### 后端部署 (Railway/Render)

1. 推送代码到 GitHub
2. 在 [Railway](https://railway.app) 或 [Render](https://render.com) 导入项目
3. 设置根目录为 `apps/api`
4. 添加环境变量 `DATABASE_URL` 和 `JWT_SECRET`

### 数据库 (Neon)

1. 在 [Neon](https://neon.tech) 创建项目
2. 获取连接字符串
3. 配置到后端环境变量

## 文档

- [数据库配置指南](./docs/database-setup.md)
- [设计文档](./memory-bank/design-document.md)
- [技术栈文档](./memory-bank/tech-stack.md)
- [实现计划](./memory-bank/implementation-plan.md)

## 许可证

MIT License

---

<div align="center">
  
  **人生回响** - 每一个选择，都将产生回响
  
</div>
