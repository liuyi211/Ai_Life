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
};
