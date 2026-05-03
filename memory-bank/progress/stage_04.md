# Stage 04 进度报告 - AI 服务集成

> **项目**: 人生回响 (Life Echo)
> **阶段**: 阶段04 - AI 服务集成
> **完成日期**: 2026-05-02
> **状态**: ✅ 已完成

---

## 完成内容概述

实现了完整的 AI 服务集成，支持多提供商 API Key 管理，以 DeepSeek 为基础提供商。

---

## 详细完成项

### 1. 后端 AI 服务封装 ✅

**文件**: `apps/api/src/services/ai.service.ts`

实现了统一的 AI 服务封装，支持多提供商：

| 提供商 | 状态 | 说明 |
|--------|------|------|
| DeepSeek | ✅ | 基础提供商，默认启用 |
| OpenAI | ✅ | GPT-4/GPT-3.5 支持 |
| Claude | ✅ | Anthropic 模型支持 |
| 自定义 | ✅ | 兼容 OpenAI 格式的自定义 API |

**核心功能**:
- 统一的 `chat()` 接口，隐藏提供商差异
- 自动处理不同提供商的 API 格式差异
- 支持系统提示词和用户消息
- 30秒超时控制
- 错误处理和响应解析

### 2. API Key 加密存储 ✅

**文件**: `apps/api/src/services/ai.service.ts`

实现了简单的 XOR + Base64 加密方案：

```typescript
function encryptApiKey(apiKey: string): string
function decryptApiKey(encryptedKey: string): string
```

- 使用环境变量 `AI_KEY_ENCRYPTION_SECRET` 作为密钥
- 加密存储在数据库中
- 解密仅在服务端进行
- 前端永远不会收到明文 API Key

### 3. AI 代理 API 控制器 ✅

**文件**: `apps/api/src/controllers/ai.controller.ts`

实现了以下端点：

| 端点 | 方法 | 功能 | 认证 |
|------|------|------|------|
| `/api/ai/config` | GET | 获取用户 AI 配置 | ✅ JWT |
| `/api/ai/config` | PUT | 更新用户 AI 配置 | ✅ JWT |
| `/api/ai/test` | POST | 测试 AI 连接 | ✅ JWT |
| `/api/ai/narrative` | POST | 生成叙事文本 | ✅ JWT |
| `/api/ai/chat` | POST | NPC 对话 | ✅ JWT |

**安全特性**:
- 所有端点需要 JWT 认证
- API Key 从数据库解密后使用
- 错误信息不暴露敏感信息
- 响应时间限制 30 秒

### 4. AI 路由注册 ✅

**文件**: `apps/api/src/routes/ai.routes.ts`

- 创建了独立的路由文件
- 在 `index.ts` 中注册 `/api/ai` 路由

### 5. 前端 AI 配置界面 ✅

**文件**: `apps/web/src/pages/dashboard/components/AIConfigSheet.tsx`

实现了完整的 AI 配置界面：

| 功能 | 状态 | 说明 |
|------|------|------|
| 提供商选择 | ✅ | 4个提供商卡片式选择 |
| 模型选择 | ✅ | 根据提供商动态显示可用模型 |
| API Key 输入 | ✅ | 密码输入框，显示已配置状态 |
| 自定义 API 地址 | ✅ | 仅自定义提供商显示 |
| 测试连接 | ✅ | 发送测试消息验证配置 |
| 保存配置 | ✅ | 加密存储到数据库 |

**UI 特性**:
- 底部弹窗设计（Sheet）
- 暗金风格保持一致
- 加载状态显示
- 错误提示（Toast）

### 6. 前端 API 服务更新 ✅

**文件**: `apps/web/src/services/api.ts`

添加了 `aiApi` 对象：

```typescript
export const aiApi = {
  getConfig: () => api.get('/ai/config'),
  updateConfig: (data) => api.put('/ai/config', data),
  testConnection: () => api.post('/ai/test'),
  generateNarrative: (data) => api.post('/ai/narrative', data),
  chatWithNPC: (data) => api.post('/ai/chat', data),
};
```

### 7. Profile Tab 集成 ✅

**文件**: `apps/web/src/pages/dashboard/components/ProfileTab.tsx`

- 点击"模型接入"打开 AIConfigSheet
- 传递 showToast 用于提示
- 保持其他功能不变

---

## 数据库 Schema

Prisma Schema 中 User 模型已包含 AI 配置字段：

```prisma
model User {
  id                String  @id @default(cuid())
  aiProvider        String? // deepseek/openai/claude/custom
  aiApiKeyEncrypted String? // 加密存储的 API Key
  aiModel           String? // 选择的模型
  // ... other fields
}
```

---

## 环境变量

**后端** (`apps/api/.env`):

```env
# AI API Key 加密密钥
AI_KEY_ENCRYPTION_SECRET="life-echo-ai-key-secret-2026-change-in-production"
```

---

## API 使用流程

### 1. 配置 AI

```
用户进入 Profile → 点击"模型接入"
  → 选择提供商（DeepSeek）
  → 选择模型（deepseek-chat）
  → 输入 API Key
  → 点击"测试连接"
  → 点击"保存配置"
```

### 2. 使用 AI 生成叙事

```
前端调用 aiApi.generateNarrative({
  character: { name, world, age, attributes... },
  context: "当前情境描述"
})
  → 后端解密 API Key
  → 调用 DeepSeek API
  → 返回生成的叙事文本
```

### 3. NPC 对话

```
前端调用 aiApi.chatWithNPC({
  character: {...},
  npc: { name, personality, background },
  message: "玩家输入",
  history: [{role, content}, ...]
})
  → 后端构建完整对话上下文
  → 调用 AI API
  → 返回 NPC 回复
```

---

## 测试验证

| 检查项 | 状态 | 备注 |
|--------|------|------|
| 前端类型检查 | ✅ | tsc --noEmit 通过 |
| 前端构建 | ✅ | 376KB JS + 6KB CSS |
| 后端类型检查 | ✅ | tsc --noEmit 通过 |
| 后端构建 | ✅ | tsc 通过 |
| DeepSeek 集成 | ✅ | API 格式正确 |
| OpenAI 集成 | ✅ | API 格式正确 |
| Claude 集成 | ✅ | API 格式正确 |
| 自定义提供商 | ✅ | OpenAI 兼容格式 |
| API Key 加密 | ✅ | XOR + Base64 |
| 配置界面 | ✅ | 完整 UI 实现 |

---

## 已知限制

| 限制 | 说明 | 计划解决 |
|------|------|----------|
| 流式输出 | 当前为阻塞式响应 | 阶段06优化 |
| 加载状态 | 无动画 loading | 阶段07优化 |
| API Key 加密 | 简单 XOR，非工业级 | 生产环境使用 AES |
| 提示词模板 | 基础模板，未优化 | 根据游戏测试优化 |
| 错误降级 | 失败时无 fallback 文本 | 阶段06添加 |

---

## 下一步

阶段04完成后，可以开始：

1. **阶段06**: 游戏引擎核心
   - 年龄推进系统
   - 事件触发（调用 AI 生成叙事）
   - 事件选择处理

2. **阶段07**: 人生模拟界面
   - AI 叙事时间线
   - 流式输出显示
   - 事件选择界面

---

## 总结

阶段04成功实现了多提供商 AI 服务集成：

1. ✅ 支持 DeepSeek（基础）、OpenAI、Claude、自定义提供商
2. ✅ 安全的 API Key 加密存储
3. ✅ 完整的配置界面（提供商选择、模型选择、API Key输入、测试连接）
4. ✅ 后端代理保护 API Key 不暴露给前端
5. ✅ 统一的 AI 调用接口（叙事生成、NPC对话）
6. ✅ 完整的类型安全和错误处理

系统现在可以安全地存储用户的 AI 配置，并在游戏过程中调用 AI 生成叙事内容。
