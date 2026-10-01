import { create } from 'zustand';
import { User } from '../types/models';
import { initializeDatabase, resetDatabase } from '../database/database';
import {
  authenticateUser,
  createUser,
  getUserById,
  hasAccounts,
} from '../database/repositories/userRepository';
import {
  clearSession,
  rememberedUserId,
  saveSession,
} from '../database/repositories/settingsRepository';
import { useGoalStore } from './goalStore';
import { useSavingsStore } from './savingsStore';
type AuthState = {
  user: User | null;
  ready: boolean;
  hasAccounts: boolean;
  error: boolean;
  rememberMe: boolean;
  boot: () => void;
  login: (
    username: string,
    password: string,
    remember: boolean,
  ) => Promise<void>;
  register: (
    name: string,
    username: string,
    password: string,
    confirm: string,
    grade: string,
  ) => Promise<void>;
  logout: () => void;
  reset: () => void;
  refreshUser: () => void;
};
function clearCaches() {
  useGoalStore.setState({ goals: [] });
  useSavingsStore.setState({ savings: [] });
}
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  ready: false,
  hasAccounts: false,
  error: false,
  rememberMe: false,
  boot: () => {
    try {
      initializeDatabase();
      const id = rememberedUserId();
      const user = id ? getUserById(id) : undefined;
      if (id && !user) {
        clearSession();
      }
      set({
        ready: true,
        error: false,
        hasAccounts: hasAccounts(),
        user: user || null,
        rememberMe: !!user,
      });
    } catch {
      set({ error: true, ready: true });
    }
  },
  login: async (username, password, remember) => {
    const user = await authenticateUser(username, password);
    saveSession(user.id, remember);
    clearCaches();
    set({ user, rememberMe: remember, hasAccounts: true });
  },
  register: async (name, username, password, confirm, grade) => {
    const user = await createUser(name, username, password, confirm, grade);
    saveSession(user.id, false);
    clearCaches();
    set({ user, rememberMe: false, hasAccounts: true });
  },
  logout: () => {
    clearSession();
    clearCaches();
    set({ user: null, rememberMe: false, hasAccounts: hasAccounts() });
  },
  reset: () => {
    resetDatabase();
    clearCaches();
    set({ user: null, hasAccounts: false, rememberMe: false });
  },
  refreshUser: () => {
    const id = get().user?.id;
    if (id) {
      set({ user: getUserById(id) });
    }
  },
}));
