export type User = {
  id: string;
  fullName: string;
  username: string;
  gradeLevel: string;
  profilePhoto: string | null;
  createdAt: string;
  updatedAt: string;
};
export type StoredUser = User & { passwordHash: string };
export type GoalStatus = 'active' | 'completed' | 'archived';
export type Goal = {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  targetDate: string | null;
  category: string;
  icon: string;
  note: string;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  savedAmount: number;
  entryCount: number;
};
export type Saving = {
  id: string;
  userId: string;
  goalId: string;
  amount: number;
  note: string;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
  goalName: string;
};
export type GoalInput = Pick<
  Goal,
  'name' | 'targetAmount' | 'targetDate' | 'category' | 'icon' | 'note'
>;
export type SavingInput = Pick<Saving, 'amount' | 'transactionDate' | 'note'>;
export type HistoryFilter = { goalId?: string; from?: string; to?: string };
