import { useGoalStore } from '../stores/goalStore';
import { useSavingsStore } from '../stores/savingsStore';
export function refreshData(userId: string) {
  useGoalStore.getState().refresh(userId);
  useSavingsStore.getState().refresh(userId);
}
