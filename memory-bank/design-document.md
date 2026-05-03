# Design Document

> **项目**: 人生回响 (Life Echo) - AI人生模拟器游戏
> **状态**: 设计阶段
> **最后更新**: 2026-04-30

---

## 1. 项目概述

### 1.1 项目目标

构建一个AI驱动的沉浸式人生模拟器游戏，玩家通过自定义角色属性、选择世界背景，在AI实时生成的剧情中体验不同的人生轨迹。游戏核心体验为"蝴蝶效应"——每个选择都会影响角色命运，支持无限流重开和多周目继承玩法。

### 1.2 核心功能

- **用户账户系统**: 注册、登录、找回密码、邮箱验证
- **角色创建系统**: 属性分配、天赋抽卡、世界背景选择
- **AI动态叙事**: 根据玩家属性和选择实时生成剧情文本
- **多世界系统**: 支持10+种不同世界观（地球、赛博、修仙等）
- **人生阶段模拟**: 从出生到死亡的完整生命周期模拟
- **轮回继承系统**: 基因遗传、遗产继承、成就解锁
- **智能NPC交互**: 自由文本对话，AI根据NPC性格生成回复
- **云存档同步**: 跨设备存档同步，数据持久化

### 1.3 非功能需求

| 维度 | 要求 | 优先级 |
|------|------|--------|
| 性能 | 首屏加载 < 3s，AI响应首字 < 2s | P0 |
| 可用性 | 支持离线缓存，有网络时自动同步云端 | P0 |
| 安全性 | 密码加密存储，JWT认证，API防滥用 | P0 |
| 可扩展性 | 支持新世界观和天赋类型快速扩展 | P1 |
| 兼容性 | 支持Chrome/Firefox/Safari最新两个版本 | P1 |

---

## 2. 架构设计

### 2.1 系统架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                          用户浏览器                                   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    前端应用 (React)                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │   │
│  │  │  登录/   │ │  角色    │ │  人生    │ │  结算/   │      │   │
│  │  │  注册    │ │  创建    │ │  模拟    │ │  轮回    │      │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘      │   │
│  │       └─────────────┴────────────┴─────────────┘            │   │
│  │                          │                                  │   │
│  │              ┌───────────┴───────────┐                      │   │
│  │              │    游戏引擎核心        │                      │   │
│  │              │  (状态管理+事件系统)    │                      │   │
│  │              └───────────┬───────────┘                      │   │
│  │                          │                                  │   │
│  │       ┌──────────────────┼──────────────────┐              │   │
│  │       ▼                  ▼                  ▼              │   │
│  │  ┌──────────┐    ┌──────────────┐    ┌──────────┐        │   │
│  │  │ 本地缓存 │    │   后端API    │    │ AI服务   │        │   │
│  │  │IndexedDB│    │  (Express)   │    │(流式输出)│        │   │
│  │  └──────────┘    └──────────────┘    └──────────┘        │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │      后端服务 (Express)        │
                    │  ┌─────────┐  ┌─────────────┐ │
                    │  │ 认证API │  │  游戏存档API │ │
                    │  │ 用户API │  │  AI代理API   │ │
                    │  └────┬────┘  └──────┬──────┘ │
                    │       └──────────────┘        │
                    │              │                │
                    │       ┌──────┴──────┐         │
                    │       ▼             ▼         │
                    │  ┌──────────┐  ┌──────────┐  │
                    │  │PostgreSQL│  │  Redis   │  │
                    │  │(主数据库)│  │(会话缓存)│  │
                    │  └──────────┘  └──────────┘  │
                    └───────────────────────────────┘
```

### 2.2 模块划分

```
apps/
├── web/                        # 前端应用
│   ├── components/
│   │   ├── auth/              # 认证相关组件（登录/注册/找回密码）
│   │   ├── creation/          # 角色创建相关组件
│   │   ├── simulation/        # 人生模拟相关组件
│   │   ├── settlement/        # 结算轮回相关组件
│   │   └── shared/            # 共享通用组件
│   ├── pages/
│   │   ├── LoginPage.tsx      # 登录页
│   │   ├── RegisterPage.tsx   # 注册页
│   │   ├── ForgotPassword.tsx # 找回密码页
│   │   ├── Dashboard.tsx      # 用户主页/存档列表
│   │   ├── CreationPage.tsx   # 角色创建页
│   │   ├── GamePage.tsx       # 游戏主页面
│   │   └── SettlementPage.tsx # 结算页面
│   ├── engine/                # 游戏引擎核心
│   ├── services/
│   │   ├── api/               # 后端API客户端
│   │   ├── ai/                # AI服务封装
│   │   └── storage/           # 本地存储服务
│   └── stores/                # Zustand状态管理
│
└── api/                        # 后端应用
    ├── src/
    │   ├── routes/
    │   │   ├── auth.ts        # 认证路由（登录/注册/找回密码）
    │   │   ├── user.ts        # 用户管理路由
    │   │   ├── saves.ts       # 存档管理路由
    │   │   └── ai-proxy.ts    # AI代理路由
    │   ├── controllers/       # 控制器
    │   ├── services/          # 业务逻辑
    │   ├── middleware/
    │   │   ├── auth.ts        # JWT认证中间件
    │   │   ├── errorHandler.ts # 全局错误处理
    │   │   └── rateLimit.ts   # 速率限制
    │   ├── models/
    │   │   └── prisma/        # Prisma模型和迁移
    │   └── utils/
    │       ├── jwt.ts         # JWT工具
    │       ├── email.ts       # 邮件发送
    │       └── password.ts    # 密码加密
    └── prisma/
        └── schema.prisma      # 数据库Schema定义
```

### 2.3 数据流

```
[认证流程]
用户输入 → 前端表单 → API请求 → 后端验证 → JWT签发 → 前端存储Token → 后续请求携带Token

[游戏流程]
玩家操作 → UI组件 → 游戏引擎 → 状态更新 → AI叙事生成 → UI渲染
                              ↓
                        自动存档（本地IndexedDB）
                              ↓
                        网络可用时同步到后端PostgreSQL
```

---

## 3. UI设计策略

### 3.1 设计原则

- **源码还原**：基于用户提供的HTML/CSS/JS源码，高保真还原为React组件
- **风格统一**：所有页面保持统一的暗金色调和字体风格
- **响应式优先**：优先适配手机端，桌面端居中显示
- **交互保留**：保留原始源码中的所有动画和交互效果

### 3.2 已完成页面

| 页面 | 功能 | 状态 | 风格 |
|------|------|------|------|
| 登录页 | 用户登录、访客登录 | ✅ 已完成 | 高级暗金风格 |
| 注册页 | 新用户注册 | ✅ 已完成 | 高级暗金风格 |
| 用户主页(Dashboard) | 存档列表、继续游戏、新建角色、世界百科、用户资料 | ✅ 已完成 | 高级暗金风格 |
| 角色创建页 | 世界选择、属性分配、天赋抽取、遗产继承、角色确认 | ✅ 已完成 | 高级暗金风格 |
| 游戏主页面 | 角色信息、属性展示、操作按钮、事件面板 | 🔄 框架完成 | 高级暗金风格 |

### 3.3 待开发页面

| 页面 | 功能 | 状态 | 依赖 |
|------|------|------|------|
| 游戏主页面(完整) | AI叙事时间线、事件选择、NPC对话 | ⏳ 待开发 | 阶段04(AI集成) |
| 结算页面 | 人生传记、成就展示、轮回选项 | ⏳ 待开发 | 阶段08 |

---

## 4. 领域模型

### 4.1 核心实体

```typescript
// ==================== 用户账户实体 ====================
interface User {
  id: string;
  username: string;
  passwordHash: string;
  avatar?: string;
  
  // 游戏数据
  fateFragments: number;       // 命运碎片数量
  totalPlayTime: number;       // 总游戏时长
  generationCount: number;     // 总轮回次数
  
  // AI配置（加密存储）
  aiProvider?: 'openai' | 'claude' | 'local';
  aiApiKeyEncrypted?: string;
  aiModel?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// ==================== 角色实体 ====================
interface Character {
  id: string;
  userId: string;              // 关联用户
  name: string;
  gender: 'male' | 'female' | 'other';
  race: string;
  birthWorld: WorldType;
  
  // 六大基础属性
  attributes: {
    intelligence: number;      // 智力 (0-20)
    constitution: number;      // 体质 (0-20)
    wealth: number;            // 家境 (0-20)
    appearance: number;        // 颜值 (0-20)
    charm: number;             // 魅力 (0-20)
    luck: number;              // 运气 (0-20)
  };
  
  // 衍生属性
  derivedStats: {
    health: number;
    lifespan: number;
    reputation: number;
    happiness: number;
  };
  
  talents: Talent[];
  skills: Skill[];
  career?: Career;
  relationships: Relationship[];
  assets: Asset[];
  
  age: number;
  lifeStage: LifeStage;
  isAlive: boolean;
  customConditions: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

// ==================== 天赋实体 ====================
interface Talent {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  worldCompatibility: WorldType[];
  effects: TalentEffect[];
}

// ==================== 世界配置 ====================
interface WorldConfig {
  id: WorldType;
  name: string;
  description: string;
  era: string;
  availableRaces: Race[];
  specialMechanics: string[];
  talentCategories: string[];
  startingConditions: StartingCondition[];
}

// ==================== 游戏事件 ====================
interface GameEvent {
  id: string;
  title: string;
  description: string;
  type: 'random' | 'choice' | 'milestone' | 'crisis';
  ageRange: [number, number];
  conditions: EventCondition[];
  choices?: EventChoice[];
  effects: EventEffect[];
}

// ==================== 存档数据 ====================
interface SaveData {
  id: string;
  userId: string;
  character: Character;
  history: HistoryEntry[];
  achievements: string[];
  playTime: number;
  generation: number;
  saveDate: Date;
  syncStatus: 'synced' | 'pending' | 'conflict';
}

// ==================== 成就实体 ====================
interface Achievement {
  id: string;
  userId: string;
  achievementId: string;
  title: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: Date;
}
```

### 4.2 关键关系

```
User 1--* SaveData (一个用户有多个存档)
User 1--* Achievement (一个用户有多个成就)
User 1--* Character (一个用户创建过多个角色)
Character 1--* Talent (一个角色可拥有多个天赋)
Character 1--* Skill (一个角色可拥有多个技能)
Character 1--1 Career (一个角色同一时间只有一个职业)
SaveData 1--1 Character (一个存档对应一个角色)
GameEvent *--1 WorldConfig (多个事件属于特定世界)
```

---

## 5. 用户账户系统设计

### 5.1 功能清单

| 功能 | 说明 | 优先级 |
|------|------|--------|
| 用户注册 | 用户名+密码注册，用户名唯一 | P0 |
| 用户登录 | 用户名+密码登录，返回JWT | P0 |
| 修改密码 | 旧密码验证后修改 | P1 |
| 修改资料 | 修改用户名、头像 | P1 |
| 注销账户 | 删除账户及关联数据 | P2 |

### 5.2 认证流程

#### 注册流程

```
用户填写注册表单（用户名、密码）
    ↓
前端验证格式（密码长度、用户名合法性）
    ↓
POST /api/auth/register
    ↓
后端验证唯一性（用户名是否已存在）
    ↓
bcrypt加密密码
    ↓
创建用户记录
    ↓
返回注册成功，自动登录
```

#### 登录流程

```
用户输入用户名+密码
    ↓
POST /api/auth/login
    ↓
后端查询用户，bcrypt比对密码
    ↓
生成JWT Token（7天有效期）
    ↓
返回Token，前端存储（localStorage）
    ↓
后续请求携带Token（Authorization: Bearer xxx）
```

### 5.3 安全设计

- **密码策略**：最少6位
- **JWT策略**：Token有效期7天，存储在localStorage
- **速率限制**：
  - 登录：同一IP 5分钟内最多10次尝试
  - 注册：同一IP每小时最多5次
- **CORS**：仅允许前端域名访问API
- **数据隔离**：用户只能访问自己的存档数据

---

## 6. 游戏流程设计

### 6.1 核心玩法循环

```
[登录/注册] → [用户主页] → [创世纪] → [成长期 0-18岁] → [社会期 19-60岁] → [终焉期 60岁+] → [结算与轮回]
                ↓              ↓                                                     ↓
            存档列表      属性分配20点                                         人生传记生成
            继续游戏      天赋抽取3张                                           遗产继承
            新建角色      世界选择                                              基因遗传
                        自定义条件                                              新周目开始
```

### 6.2 人生阶段详细设计

#### 阶段一：用户认证与主页

**登录页**
- 用户名 + 密码登录
- 跳转到注册

**注册页**
- 用户名、密码、确认密码
- 用户名唯一性校验

**用户主页（Dashboard）**
- 显示用户信息和统计数据（总游戏时长、轮回次数）
- 存档卡片列表（角色名、世界、年龄、最后游玩时间）
- "新建角色"按钮
- 成就预览

#### 阶段二：创世纪（角色创建）

**属性分配**
- 初始20点分配给六大维度
- 每个维度初始值5，范围0-20
- 天赋可影响最终值

**天赋系统**
- 消耗"命运碎片"抽取3个天赋
- 天赋分级：普通/稀有/史诗/传说
- 世界专属天赋（如修仙世界的"灵根"）

**世界选择**
- 地球Online、赛博2077、修仙世界、丧尸世界、废土世界、古代世界、部落世界、神魔世界、斗罗世界、玄幻世界
- 每个世界有独特的种族、机制、天赋池

**自定义条件**
- 玩家可输入特殊条件（如"20岁结婚"）
- AI会在游戏中尽量遵循这些条件

#### 阶段三：成长期（0-18岁）

**幼年（0-6岁）**
- 机制：依赖父母与家境
- 事件：抓周、幼儿园、家庭变故
- 玩家操作：抓周物品选择

**少年（7-12岁）**
- 机制：学业与兴趣培养
- 事件：小学生活、兴趣发现、家庭互动
- 玩家操作：时间分配（学习/玩耍/锻炼）

**青年（13-18岁）**
- 机制：青春期叛逆、学业分流
- 关键抉择：文理分科、初恋、高考
- AI根据属性生成升学结果

#### 阶段四：社会期（19-60岁）

**职业系统**
- 入职：根据学历和属性筛选
- 晋升：通过"加班"、"站队"、"进修"
- AI生成职业专属事件

**家庭与社交**
- 婚恋：相亲、自由恋爱、结婚、离婚
- 育儿：孩子属性遗传父母，套娃玩法
- NPC自由对话

**资产管理**
- 消费：买房、买车、奢侈品
- 投资：股票、基金、加密货币
- AI生成市场波动剧情

#### 阶段五：终焉与轮回（60岁+）

**死亡触发**
- 自然死亡（寿命耗尽）
- 意外死亡（事件触发）
- 特殊结局（如飞升、机械飞升）

**结算系统**
- AI生成人生传记/讣告
- 统计高光时刻
- 计算最终评分

**轮回系统**
- 基因继承：部分高属性遗传
- 家族信托：金钱转化为家族基金
- 命运碎片：用于下一世天赋抽取

---

## 7. AI应用设计

### 7.1 动态文本生成

**传统 vs AI 对比**
- 传统："你考上了大学"
- AI："那年夏天，蝉鸣声很吵，你颤抖着手拆开信封，鲜红的'录取通知书'五个大字映入眼帘..."

**实现方案**
- 使用流式输出（Streaming）展示AI生成内容
- 上下文携带角色属性、历史事件、性格特征
- 根据世界背景调整叙事风格

### 7.2 智能NPC对话

**对话机制**
- 玩家随时可与NPC自由文本对话
- AI根据NPC性格（贪婪、温柔、暴躁）生成回复
- NPC关系影响对话态度和内容

### 7.3 突发危机处理

**危机类型**
- 健康危机：重病、意外
- 财务危机：破产、失业
- 关系危机：离婚、背叛

**救赎任务链**
- AI生成多步骤救赎方案
- 玩家选择不同路径影响结局
- 非简单Game Over

---

## 8. 接口设计

### 8.1 认证API

```typescript
// 注册
POST /api/auth/register
Body: { username: string, password: string }
Response: { success: true, token: string, user: UserProfile }

// 登录
POST /api/auth/login
Body: { username: string, password: string }
Response: { success: true, token: string, user: UserProfile }

// 获取当前用户
GET /api/auth/me
Headers: Authorization: Bearer {token}
Response: { user: UserProfile }
```

### 8.2 用户API

```typescript
// 更新用户资料
PUT /api/users/profile
Body: { username?: string, avatar?: string }

// 修改密码
PUT /api/users/password
Body: { oldPassword: string, newPassword: string }

// 更新AI配置
PUT /api/users/ai-config
Body: { provider: string, apiKey?: string, model?: string }
```

### 8.3 存档API

```typescript
// 获取存档列表
GET /api/saves
Response: { saves: SaveMetadata[] }

// 创建存档
POST /api/saves
Body: { character: Character, history: HistoryEntry[] }
Response: { save: SaveData }

// 更新存档
PUT /api/saves/:id
Body: { character: Character, history: HistoryEntry[] }

// 删除存档
DELETE /api/saves/:id

// 导出存档
GET /api/saves/:id/export
Response: { json: string }

// 导入存档
POST /api/saves/import
Body: { json: string }
```

### 8.4 AI代理API

```typescript
// 生成事件描述
POST /api/ai/narrative
Body: { characterId: string, eventId: string, choice?: string }
Response: Stream<string>  // 流式输出

// NPC对话
POST /api/ai/chat
Body: { characterId: string, npcId: string, message: string }
Response: { reply: string }

// 生成人生总结
POST /api/ai/summary
Body: { characterId: string }
Response: { summary: string }
```

---

## 9. 决策记录 (ADR)

### ADR-001: 选择前后端分离全栈架构

- **日期**: 2026-04-30
- **状态**: 已接受
- **背景**: 需要支持用户账户系统（注册/登录）、云存档同步、多设备访问
- **决策**: 采用前后端分离架构，前端React + 后端Express + PostgreSQL
- **后果**: 
  - 正面：支持用户账户和云存档，可跨设备同步，数据安全可控
  - 负面：需要维护后端服务，部署复杂度增加

### ADR-002: 使用Express而非NestJS

- **日期**: 2026-04-30
- **状态**: 已接受
- **背景**: 后端API相对简单（认证+CRUD+AI代理），不需要复杂的企业级架构
- **决策**: 使用Express + TypeScript，保持轻量和灵活
- **后果**: 
  - 正面：学习成本低，开发快，社区中间件丰富
  - 负面：需要自行组织代码结构，无内置依赖注入

### ADR-003: 使用Neon PostgreSQL

- **日期**: 2026-04-30
- **状态**: 已接受
- **背景**: 需要关系型数据库存储用户、存档、成就等结构化数据
- **决策**: 使用Neon Serverless PostgreSQL，开发/生产环境隔离
- **后果**: 
  - 正面：免费额度充足，Serverless按需付费，与Vercel集成好
  - 负面：冷启动可能有几毫秒延迟

### ADR-004: 使用JWT认证

- **日期**: 2026-04-30
- **状态**: 已接受
- **背景**: 需要简单的无状态API认证，用户系统仅支持用户名+密码
- **决策**: 使用JWT Token（7天有效期），存储在localStorage
- **后果**: 
  - 正面：实现简单，无需维护Refresh Token机制
  - 负面：Token被盗风险，需配合HTTPS使用

### ADR-005: 前端UI基于11.html源码高保真还原

- **日期**: 2026-04-30
- **状态**: 已接受
- **背景**: 用户提供11.html源码，要求严格基于此源码复刻，不自由发挥
- **决策**: 
  - 完整移植11.html的CSS样式到React组件（inline style + CSS变量）
  - 保留所有视觉元素：背景渐变、网格纹理、Sigil动画、登录卡片、水印、四角装饰
  - 保留所有交互：密码切换、按钮按下效果、Toast提示
  - 使用Google Fonts加载Cormorant Garamond和Noto Serif SC
- **后果**: 
  - 正面：高保真还原用户期望的视觉效果，暗金色调具有独特气质
  - 负面：inline style较多，后续主题切换困难，但符合用户"严格还原"的要求

### ADR-006: 采用高级暗金风格UI，优先适配手机端

- **日期**: 2026-04-30
- **状态**: 已接受
- **背景**: 11.html定义了完整的暗金色调风格，用户要求高保真还原
- **决策**: 
  - 暖灰白背景 `#eee9df` + 多层径向渐变（暗红/金色/墨色）+ 网格纹理
  - 字体：Cormorant Garamond（英文）+ Noto Serif SC（中文）
  - 色调：暗红 `#7a2020`、墨色 `#221d18`、金色 `#9f7c3e`、象牙白 `#f8f4ec`
  - Sigil 呼吸动画装饰 + 登录卡片 + 诗意文案
  - 响应式：手机端全屏 / 桌面端居中卡片（430px宽）
- **后果**: 
  - 正面：视觉冲击力强，暗金色调营造神秘命运感，与游戏主题契合
  - 负面：CSS复杂度较高，性能开销略大，但现代设备完全可以承受

### ADR-007: 支持多提供商AI API，以DeepSeek为基础

- **日期**: 2026-04-30
- **状态**: 已接受
- **背景**: AI文本生成是核心体验，需要考虑成本、可用性和国内访问
- **决策**: 
  - 基础支持 DeepSeek（国产，性价比高，国内访问稳定）
  - 同时支持 OpenAI、Claude、自定义兼容 OpenAI 格式的 API
  - 后端统一转发请求，保护用户 API Key
  - API Key 使用 XOR+Base64 加密存储
  - 用户可在 Profile 页面配置提供商、模型和 API Key
- **后果**: 
  - 正面：灵活选择提供商，国内用户优先使用 DeepSeek，成本控制
  - 正面：后端代理保护 Key 安全，不暴露给前端
  - 负面：需要维护多套 AI 接口适配器（DeepSeek/OpenAI/Claude 格式差异）

---

## 10. 附录

### A. 参考文档

- [11.txt](../11.txt) - 原始游戏设计文档
- [OpenAI API文档](https://platform.openai.com/docs)
- [Zustand文档](https://docs.pmnd.rs/zustand)
- [Prisma文档](https://www.prisma.io/docs)
- [Express文档](https://expressjs.com/)

### B. 术语表

| 术语 | 定义 |
|------|------|
| 命运碎片 | 游戏内货币，通过周目结算获得，用于抽取天赋 |
| 人生阶段 | 角色当前所处的生命阶段（幼年/少年/青年/社会期/终焉） |
| 周目 | 从创建角色到死亡结算的一次完整游戏流程 |
| 世界线 | 不同世界观下的游戏规则和叙事风格 |
| AI叙事器 | 负责生成剧情文本的AI服务模块 |
| Access Token | 短期有效的JWT，用于API认证 |
| Refresh Token | 长期有效的Token，用于刷新Access Token |
| Serverless | 无服务器架构，按需运行，按量计费 |
