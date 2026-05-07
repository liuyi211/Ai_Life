import axios from 'axios';

export type AIProvider =
  | 'openai'
  | 'azure'
  | 'anthropic'
  | 'google'
  | 'deepseek'
  | 'moonshot'
  | 'qwen'
  | 'doubao'
  | 'zhipu'
  | 'ernie'
  | 'ollama'
  | 'custom'
  // 保留旧别名以保持兼容
  | 'claude';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIStreamChunk {
  text: string;
  done: boolean;
}

// 使用 OpenAI 兼容 API 的厂商列表
const OPENAI_COMPATIBLE_PROVIDERS: AIProvider[] = [
  'openai',
  'azure',
  'google',
  'deepseek',
  'moonshot',
  'qwen',
  'doubao',
  'zhipu',
  'ernie',
  'ollama',
  'custom',
];

// 提供商默认配置
const PROVIDER_DEFAULTS: Record<
  AIProvider,
  { baseUrl: string; defaultModel: string; models: string[] }
> = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
  },
  azure: {
    baseUrl: 'https://{your-resource}.openai.azure.com/openai/deployments/{deployment-id}',
    defaultModel: 'gpt-4o',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-35-turbo'],
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-5-sonnet-20241022',
    models: [
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
      'claude-3-haiku-20240307',
    ],
  },
  google: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.0-flash',
    models: ['gemini-2.0-flash', 'gemini-2.0-pro', 'gemini-1.5-flash'],
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
  moonshot: {
    baseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
  },
  qwen: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus',
    models: ['qwen-plus', 'qwen-max', 'qwen-turbo'],
  },
  doubao: {
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    defaultModel: 'doubao-pro-256k',
    models: ['doubao-pro-256k', 'doubao-lite-128k', 'doubao-vision-pro'],
  },
  zhipu: {
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4',
    models: ['glm-4', 'glm-4-plus', 'glm-4-flash'],
  },
  ernie: {
    baseUrl: 'https://qianfan.baidubce.com/v2',
    defaultModel: 'ernie-4.0-turbo',
    models: ['ernie-4.0-turbo', 'ernie-3.5', 'ernie-speed'],
  },
  ollama: {
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3',
    models: ['llama3', 'qwen2.5', 'deepseek-coder'],
  },
  custom: {
    baseUrl: '',
    defaultModel: '',
    models: [],
  },
  // 旧别名映射
  claude: {
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-5-sonnet-20241022',
    models: [
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
      'claude-3-haiku-20240307',
    ],
  },
};

export class AIService {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  static getProviderDefaults(provider: AIProvider) {
    return PROVIDER_DEFAULTS[provider];
  }

  static getAvailableProviders(): { id: AIProvider; name: string; description: string }[] {
    return [
      { id: 'deepseek', name: 'DeepSeek', description: '深度求索 - 国产大模型，性价比高' },
      { id: 'openai', name: 'OpenAI', description: 'ChatGPT - 全球领先的 AI 模型' },
      { id: 'anthropic', name: 'Claude (Anthropic)', description: 'Claude - 擅长长文本和推理' },
      { id: 'google', name: 'Google Gemini', description: 'Gemini - Google 多模态大模型' },
      { id: 'moonshot', name: 'Kimi (Moonshot)', description: '月之暗面 - 超长上下文窗口' },
      { id: 'qwen', name: '通义千问 (Qwen)', description: '阿里云 - 开源大模型' },
      { id: 'doubao', name: '豆包 (火山引擎)', description: '字节跳动 - 多模态大模型' },
      { id: 'zhipu', name: '智谱 AI (GLM)', description: '智谱 - ChatGLM 系列' },
      { id: 'ernie', name: '文心一言 (ERNIE)', description: '百度 - 中文大模型' },
      { id: 'azure', name: 'Azure OpenAI', description: '微软 Azure - 企业级 OpenAI' },
      { id: 'ollama', name: 'Ollama (本地)', description: '本地部署 - 开源模型' },
      { id: 'custom', name: '自定义', description: '兼容 OpenAI 格式的自定义 API' },
    ];
  }

  /** 判断是否为 OpenAI 兼容格式的厂商 */
  private isOpenAICompatible(): boolean {
    return (
      OPENAI_COMPATIBLE_PROVIDERS.includes(this.config.provider) ||
      this.config.provider === 'claude'
    );
  }

  /** 判断是否为 Claude 格式的厂商 */
  private isClaudeFormat(): boolean {
    return this.config.provider === 'anthropic' || this.config.provider === 'claude';
  }

  async chat(messages: AIMessage[]): Promise<AIResponse> {
    if (this.isClaudeFormat()) {
      return this.callClaude(messages);
    }
    if (this.isOpenAICompatible()) {
      return this.callOpenAI(messages);
    }
    throw new Error(`不支持的 AI 提供商: ${this.config.provider}`);
  }

  /**
   * 流式调用 AI API
   * 返回 AsyncGenerator，每次 yield 一个文本片段
   */
  async *streamChat(messages: AIMessage[]): AsyncGenerator<AIStreamChunk, void, unknown> {
    if (this.isClaudeFormat()) {
      yield* this.streamClaude(messages);
      return;
    }
    if (this.isOpenAICompatible()) {
      yield* this.streamOpenAI(messages);
      return;
    }
    throw new Error(`不支持的 AI 提供商: ${this.config.provider}`);
  }

  private async callDeepSeek(messages: AIMessage[]): Promise<AIResponse> {
    const response = await axios.post(
      `${this.getBaseUrl()}/chat/completions`,
      {
        model: this.config.model || PROVIDER_DEFAULTS.deepseek.defaultModel,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    return {
      content: response.data.choices[0]?.message?.content || '',
      usage: response.data.usage,
    };
  }

  private async callOpenAI(messages: AIMessage[]): Promise<AIResponse> {
    const response = await axios.post(
      `${this.getBaseUrl()}/chat/completions`,
      {
        model: this.config.model || PROVIDER_DEFAULTS.openai.defaultModel,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    return {
      content: response.data.choices[0]?.message?.content || '',
      usage: response.data.usage,
    };
  }

  // ==================== 流式调用实现 ====================

  private async *streamDeepSeek(messages: AIMessage[]): AsyncGenerator<AIStreamChunk, void, unknown> {
    const response = await axios.post(
      `${this.getBaseUrl()}/chat/completions`,
      {
        model: this.config.model || PROVIDER_DEFAULTS.deepseek.defaultModel,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
        timeout: 60000,
      }
    );

    yield* this.parseOpenAIStream(response.data);
  }

  private async *streamOpenAI(messages: AIMessage[]): AsyncGenerator<AIStreamChunk, void, unknown> {
    const response = await axios.post(
      `${this.getBaseUrl()}/chat/completions`,
      {
        model: this.config.model || PROVIDER_DEFAULTS.openai.defaultModel,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
        timeout: 60000,
      }
    );

    yield* this.parseOpenAIStream(response.data);
  }

  private async *streamClaude(messages: AIMessage[]): AsyncGenerator<AIStreamChunk, void, unknown> {
    const systemMessage = messages.find((m) => m.role === 'system');
    const userMessages = messages.filter((m) => m.role !== 'system');

    const response = await axios.post(
      `${this.getBaseUrl()}/messages`,
      {
        model: this.config.model || PROVIDER_DEFAULTS.claude.defaultModel,
        messages: userMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        system: systemMessage?.content,
        max_tokens: 2000,
        stream: true,
      },
      {
        headers: {
          'x-api-key': this.config.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        responseType: 'stream',
        timeout: 60000,
      }
    );

    yield* this.parseClaudeStream(response.data);
  }

  private async *streamCustom(messages: AIMessage[]): AsyncGenerator<AIStreamChunk, void, unknown> {
    const response = await axios.post(
      `${this.getBaseUrl()}/chat/completions`,
      {
        model: this.config.model || 'default',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
        timeout: 60000,
      }
    );

    yield* this.parseOpenAIStream(response.data);
  }

  /**
   * 解析 OpenAI 兼容格式的 SSE 流
   */
  private async *parseOpenAIStream(stream: any): AsyncGenerator<AIStreamChunk, void, unknown> {
    const reader = stream;
    let buffer = '';

    for await (const chunk of reader) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          yield { text: '', done: true };
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) {
            yield { text: content, done: false };
          }
        } catch {
          // 忽略解析失败的行
        }
      }
    }

    // 处理剩余缓冲区
    if (buffer.trim()) {
      const trimmed = buffer.trim();
      if (trimmed.startsWith('data: ')) {
        const data = trimmed.slice(6);
        if (data !== '[DONE]') {
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              yield { text: content, done: false };
            }
          } catch {
            // 忽略
          }
        }
      }
    }

    yield { text: '', done: true };
  }

  /**
   * 解析 Claude SSE 流
   */
  private async *parseClaudeStream(stream: any): AsyncGenerator<AIStreamChunk, void, unknown> {
    const reader = stream;
    let buffer = '';

    for await (const chunk of reader) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let currentEvent: string | null = null;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          currentEvent = null;
          continue;
        }

        if (trimmed.startsWith('event: ')) {
          currentEvent = trimmed.slice(7);
          continue;
        }

        if (trimmed.startsWith('data: ') && currentEvent === 'content_block_delta') {
          const data = trimmed.slice(6);
          try {
            const parsed = JSON.parse(data);
            const text = parsed.delta?.text || '';
            if (text) {
              yield { text, done: false };
            }
          } catch {
            // 忽略
          }
        }
      }
    }

    yield { text: '', done: true };
  }

  private async callClaude(messages: AIMessage[]): Promise<AIResponse> {
    // 转换消息格式为 Claude 格式
    const systemMessage = messages.find((m) => m.role === 'system');
    const userMessages = messages.filter((m) => m.role !== 'system');

    const response = await axios.post(
      `${this.getBaseUrl()}/messages`,
      {
        model: this.config.model || PROVIDER_DEFAULTS.claude.defaultModel,
        messages: userMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        system: systemMessage?.content,
        max_tokens: 2000,
      },
      {
        headers: {
          'x-api-key': this.config.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        timeout: 60000,
      }
    );

    return {
      content: response.data.content[0]?.text || '',
      usage: response.data.usage,
    };
  }

  private async callCustom(messages: AIMessage[]): Promise<AIResponse> {
    // 自定义提供商使用 OpenAI 兼容格式
    const response = await axios.post(
      `${this.getBaseUrl()}/chat/completions`,
      {
        model: this.config.model || 'default',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    return {
      content: response.data.choices[0]?.message?.content || '',
      usage: response.data.usage,
    };
  }

  private getBaseUrl(): string {
    if (this.config.baseUrl) {
      return this.config.baseUrl;
    }
    return PROVIDER_DEFAULTS[this.config.provider].baseUrl;
  }
}

// 简单的 API Key 加密/解密（使用环境变量中的密钥）
const ENCRYPTION_KEY = process.env.AI_KEY_ENCRYPTION_SECRET || 'life-echo-ai-key-secret-2026';

export function encryptApiKey(apiKey: string): string {
  // 简单的 XOR 加密 + Base64
  const key = ENCRYPTION_KEY;
  let encrypted = '';
  for (let i = 0; i < apiKey.length; i++) {
    encrypted += String.fromCharCode(apiKey.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return Buffer.from(encrypted).toString('base64');
}

export function decryptApiKey(encryptedKey: string): string {
  try {
    const key = ENCRYPTION_KEY;
    const encrypted = Buffer.from(encryptedKey, 'base64').toString('binary');
    let decrypted = '';
    for (let i = 0; i < encrypted.length; i++) {
      decrypted += String.fromCharCode(encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return decrypted;
  } catch {
    return '';
  }
}
