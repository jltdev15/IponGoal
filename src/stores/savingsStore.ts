import { create } from 'zustand';
import { Saving } from '../types/models';
import { getSavingsHistory } from '../database/repositories/savingsRepository';
export const useSavingsStore = create<{
  savings: Saving[];
  refresh: (userId: string) => void;
}>(set => ({
  savings: [],
  refresh: userId => set({ savings: getSavingsHistory(userId) }),
}));
