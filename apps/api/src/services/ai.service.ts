import axios from 'axios';

export type AIProvider = 'deepseek' | 'openai' | 'claude' | 'custom';

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

// 提供商默认配置
const PROVIDER_DEFAULTS: Record<AIProvider, { baseUrl: string; defaultModel: string; models: string[] }> = {
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
  },
  claude: {
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-sonnet-20240229',
    models: ['claude-3-sonnet-20240229', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
  },
  custom: {
    baseUrl: '',
    defaultModel: '',
    models: [],
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
      { id: 'claude', name: 'Claude', description: 'Anthropic - 擅长长文本和推理' },
      { id: 'custom', name: '自定义', description: '兼容 OpenAI 格式的自定义 API' },
    ];
  }

  async chat(messages: AIMessage[]): Promise<AIResponse> {
    switch (this.config.provider) {
      case 'deepseek':
        return this.callDeepSeek(messages);
      case 'openai':
        return this.callOpenAI(messages);
      case 'claude':
        return this.callClaude(messages);
      case 'custom':
        return this.callCustom(messages);
      default:
        throw new Error(`不支持的 AI 提供商: ${this.config.provider}`);
    }
  }

  /**
   * 流式调用 AI API
   * 返回 AsyncGenerator，每次 yield 一个文本片段
   */
  async *streamChat(messages: AIMessage[]): AsyncGenerator<AIStreamChunk, void, unknown> {
    switch (this.config.provider) {
      case 'deepseek':
        yield* this.streamDeepSeek(messages);
        break;
      case 'openai':
        yield* this.streamOpenAI(messages);
        break;
      case 'claude':
        yield* this.streamClaude(messages);
        break;
      case 'custom':
        yield* this.streamCustom(messages);
        break;
      default:
        throw new Error(`不支持的 AI 提供商: ${this.config.provider}`);
    }
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
        timeout: 30000,
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
        timeout: 30000,
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
        timeout: 30000,
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
        timeout: 30000,
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
        timeout: 30000,
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
        timeout: 30000,
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
        timeout: 30000,
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
        timeout: 30000,
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
