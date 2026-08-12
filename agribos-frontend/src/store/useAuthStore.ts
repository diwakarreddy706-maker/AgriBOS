import { create } from 'zustand';
import apiClient from '../lib/apiClient';

export interface UserProfile {
  id: number;
  userCode: string;
  username: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  status: string;
  roles: string[];
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  setAuth: (accessToken: string, arg2: any, arg3?: any) => void;
  setTokens: (accessToken: string, refreshToken?: string) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const SAVED_ACCESS = localStorage.getItem('agribos_access_token');
const SAVED_USER = localStorage.getItem('agribos_user');

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: SAVED_ACCESS || null,
  refreshToken: null,
  user: SAVED_USER ? JSON.parse(SAVED_USER) : null,
  isAuthenticated: Boolean(SAVED_ACCESS),
  isInitializing: true,

  setAuth: (accessToken: string, arg2: any, arg3?: any) => {
    const user = arg3 || arg2;
    localStorage.setItem('agribos_access_token', accessToken);
    if (user) {
      localStorage.setItem('agribos_user', JSON.stringify(user));
    }
    localStorage.removeItem('agribos_refresh_token');
    set({ accessToken, refreshToken: null, user: user || get().user, isAuthenticated: true, isInitializing: false });
  },

  setTokens: (accessToken: string, _refreshToken?: string) => {
    localStorage.setItem('agribos_access_token', accessToken);
    localStorage.removeItem('agribos_refresh_token');
    set({ accessToken, isAuthenticated: true, isInitializing: false });
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout API call
    } finally {
      localStorage.removeItem('agribos_access_token');
      localStorage.removeItem('agribos_refresh_token');
      localStorage.removeItem('agribos_user');
      set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false, isInitializing: false });
    }
  },

  checkAuth: async () => {
    const { accessToken, user } = get();
    // Clean up legacy refresh token from localStorage if present
    localStorage.removeItem('agribos_refresh_token');

    if (accessToken && user) {
      set({ isInitializing: false, isAuthenticated: true });
      return;
    }

    try {
      const res = await apiClient.post('/auth/refresh');
      if (res.data?.success) {
        const { accessToken: newAccess, user: newUser } = res.data.data;
        get().setAuth(newAccess, newUser || user);
        return;
      }
    } catch {
      // Session restoration failed
    }

    localStorage.removeItem('agribos_access_token');
    localStorage.removeItem('agribos_user');
    set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false, isInitializing: false });
  },
}));
