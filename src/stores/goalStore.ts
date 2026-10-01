import { create } from 'zustand';
import { Goal } from '../types/models';
import { getGoalsByUser } from '../database/repositories/goalRepository';
export const useGoalStore = create<{
  goals: Goal[];
  refresh: (userId: string) => void;
}>(set => ({
  goals: [],
  refresh: userId => set({ goals: getGoalsByUser(userId) }),
}));
