import { create } from 'zustand';

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
  setAuth: (accessToken: string, refreshToken: string, user: UserProfile) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const SAVED_ACCESS = localStorage.getItem('agribos_access_token');
const SAVED_REFRESH = localStorage.getItem('agribos_refresh_token');
const SAVED_USER = localStorage.getItem('agribos_user');

const DEFAULT_DEMO_USER: UserProfile = {
  id: 1,
  userCode: 'USR-ADMIN',
  username: 'admin',
  fullName: 'System Administrator',
  email: 'admin@agribos.com',
  mobileNumber: '9880123456',
  status: 'ACTIVE',
  roles: ['ROLE_ADMIN']
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: SAVED_ACCESS || 'demo-access-token',
  refreshToken: SAVED_REFRESH || 'demo-refresh-token',
  user: SAVED_USER ? JSON.parse(SAVED_USER) : DEFAULT_DEMO_USER,
  isAuthenticated: true,

  setAuth: (accessToken, refreshToken, user) => {
    localStorage.setItem('agribos_access_token', accessToken);
    localStorage.setItem('agribos_refresh_token', refreshToken);
    localStorage.setItem('agribos_user', JSON.stringify(user));
    set({ accessToken, refreshToken, user, isAuthenticated: true });
  },

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('agribos_access_token', accessToken);
    localStorage.setItem('agribos_refresh_token', refreshToken);
    set({ accessToken, refreshToken });
  },

  logout: () => {
    localStorage.removeItem('agribos_access_token');
    localStorage.removeItem('agribos_refresh_token');
    localStorage.removeItem('agribos_user');
    set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
  },
}));
