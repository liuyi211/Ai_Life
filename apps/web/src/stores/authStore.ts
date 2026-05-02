import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  avatar?: string;
  fateFragments: number;
  totalPlayTime: number;
  generationCount: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token, isAuthenticated: !!token }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      
      login: (token, user) => set({
        token,
        user,
        isAuthenticated: true,
        error: null,
      }),
      
      logout: () => set({
        token: null,
        user: null,
        isAuthenticated: false,
        error: null,
      }),
    }),
    {
      name: 'life-echo-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
