import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (username: string, password: string) =>
    api.post('/auth/register', { username, password }),
  
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  
  getMe: () => api.get('/auth/me'),
};

export const saveApi = {
  list: () => api.get('/saves'),
  getActive: () => api.get('/saves/active'),
  getById: (id: string) => api.get(`/saves/${id}`),
  create: (data: any) => api.post('/saves', data),
  update: (id: string, data: any) => api.put(`/saves/${id}`, data),
  delete: (id: string) => api.delete(`/saves/${id}`),
};

// 流式生成回调类型
export interface StreamCallbacks {
  onStart?: () => void;
  onChunk: (text: string) => void;
  onComplete: (node: any) => void;
  onError: (message: string) => void;
}

export const aiApi = {
  getConfig: () => api.get('/ai/config'),
  updateConfig: (data: { provider: string; apiKey?: string; model?: string }) =>
    api.put('/ai/config', data),
  clearConfig: () => api.delete('/ai/config'),
  testConnection: (data?: { provider?: string; apiKey?: string; model?: string }) =>
    api.post('/ai/test', data),
  generateBackground: (data: { character: any }) =>
    api.post('/ai/background', data),
  generateNarrative: (data: { character: any; lifeStatus?: any; history?: any[]; stage?: string }) =>
    api.post('/ai/narrative', data),
  generateChoices: (data: { character: any; lifeStatus?: any; node?: any; count?: number }) =>
    api.post('/ai/choices', data),
  chatWithNPC: (data: { character: any; npc: any; message: string; history?: any[] }) =>
    api.post('/ai/chat', data),
  generateSummary: (data: { character: any; history?: any[]; score?: number; achievements?: string[] }) =>
    api.post('/saves/summary', data),
  generateWorld: (data: {
    name: string;
    type: string;
    races?: string;
    era?: string;
    conflict?: string;
    powerSystem?: string;
    factions?: string;
  }) => api.post('/ai/world', data),
  generateProphecy: () => api.get('/ai/prophecy'),

  // 流式生成人生节点
  streamGenerateNarrative: (
    data: { character: any; lifeStatus?: any; history?: any[]; stage?: string },
    callbacks: StreamCallbacks
  ) => {
    const token = useAuthStore.getState().token;

    fetch(`${API_BASE_URL}/ai/narrative/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          callbacks.onError(errorData.message || `HTTP ${response.status}`);
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          callbacks.onError('无法读取响应流');
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let isFirstChunk = true;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let currentEvent: string | null = null;

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) {
              currentEvent = null;
              continue;
            }

            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7).trim();
              continue;
            }

            if (line.startsWith('data: ') && currentEvent) {
              const dataStr = line.slice(6);
              try {
                const eventData = JSON.parse(dataStr);

                switch (currentEvent) {
                  case 'start':
                    if (isFirstChunk) {
                      isFirstChunk = false;
                      callbacks.onStart?.();
                    }
                    break;
                  case 'chunk':
                    if (eventData.text) {
                      callbacks.onChunk(eventData.text);
                    }
                    break;
                  case 'complete':
                    if (eventData.success && eventData.node) {
                      callbacks.onComplete(eventData.node);
                    } else {
                      callbacks.onError(eventData.message || '生成失败');
                    }
                    reader.cancel();
                    return;
                  case 'error':
                    callbacks.onError(eventData.message || '未知错误');
                    reader.cancel();
                    return;
                }
              } catch {
                // 忽略解析失败的行
              }
            }
          }
        }

        // 处理剩余缓冲区
        if (buffer.trim()) {
          const lines = buffer.split('\n');
          let currentEvent: string | null = null;
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) {
              currentEvent = null;
              continue;
            }
            if (trimmed.startsWith('event: ')) {
              currentEvent = trimmed.slice(7).trim();
            } else if (trimmed.startsWith('data: ') && currentEvent === 'complete') {
              try {
                const eventData = JSON.parse(trimmed.slice(6));
                if (eventData.success && eventData.node) {
                  callbacks.onComplete(eventData.node);
                }
              } catch {
                // 忽略
              }
            }
          }
        }
      })
      .catch((error) => {
        callbacks.onError(error.message || '网络请求失败');
      });
  },
};

export const settlementApi = {
  settle: (id: string, data: any) => api.post(`/saves/${id}/settle`, data),
  export: (id: string) => api.get(`/saves/${id}/export`),
  import: (data: any) => api.post('/saves/import', data),
};

export const legacyApi = {
  list: () => api.get('/legacy'),
  add: (items: any[]) => api.post('/legacy', { items }),
  remove: (name: string) => api.delete('/legacy', { data: { name } }),
};
