import { execute, rows, transaction } from '../database';
import { Goal, GoalInput } from '../../types/models';
import { newId } from '../../utils/id';
import { validateGoal } from '../../utils/validation';
import { validAmount } from '../../utils/currency';
import { localDate } from '../../utils/dates';
import { assertSavingsCapacity } from './savingsRepository';
const select = `SELECT g.*,COALESCE(SUM(s.amount),0) AS savedAmount,COUNT(s.id) AS entryCount FROM goals g LEFT JOIN savings s ON s.goalId=g.id AND s.userId=g.userId`;
export const getGoalsByUser = (userId: string) =>
  rows<Goal>(
    `${select} WHERE g.userId=? GROUP BY g.id ORDER BY g.createdAt DESC`,
    [userId],
  );
export const getGoalById = (userId: string, id: string) =>
  rows<Goal>(`${select} WHERE g.userId=? AND g.id=? GROUP BY g.id`, [
    userId,
    id,
  ])[0];
export function requireGoal(userId: string, id: string) {
  const goal = getGoalById(userId, id);
  if (!goal) {
    throw new Error('Goal not found.');
  }
  return goal;
}
export function createGoal(
  userId: string,
  input: GoalInput,
  startingAmount: number,
) {
  validateGoal(input);
  validAmount(startingAmount, true);
  return transaction(() => {
    assertSavingsCapacity(userId, startingAmount);
    const id = newId('goal'),
      now = new Date().toISOString(),
      completed = startingAmount >= input.targetAmount;
    execute(
      'INSERT INTO goals(id,userId,name,targetAmount,targetDate,category,icon,note,status,createdAt,updatedAt,completedAt,coverPhoto) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [
        id,
        userId,
        input.name.trim(),
        input.targetAmount,
        input.targetDate,
        input.category,
        input.icon,
        input.note.trim(),
        completed ? 'completed' : 'active',
        now,
        now,
        completed ? now : null,
        input.coverPhoto ?? null,
      ],
    );
    if (startingAmount > 0) {
      execute(
        'INSERT INTO savings(id,userId,goalId,amount,note,transactionDate,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?)',
        [
          newId('saving'),
          userId,
          id,
          startingAmount,
          'Starting savings',
          localDate(),
          now,
          now,
        ],
      );
    }
    return id;
  });
}
export function updateGoal(userId: string, id: string, input: GoalInput) {
  const existing = requireGoal(userId, id);
  validateGoal(input);
  execute(
    'UPDATE goals SET name=?,targetAmount=?,targetDate=?,category=?,icon=?,note=?,updatedAt=?,coverPhoto=? WHERE id=? AND userId=?',
    [
      input.name.trim(),
      input.targetAmount,
      input.targetDate,
      input.category,
      input.icon,
      input.note.trim(),
      new Date().toISOString(),
      input.coverPhoto === undefined ? existing.coverPhoto : input.coverPhoto,
      id,
      userId,
    ],
  );
}
export function completeGoal(userId: string, id: string) {
  const g = requireGoal(userId, id);
  if (g.status === 'archived' || g.savedAmount < g.targetAmount) {
    throw new Error('Reach your target before completing this goal.');
  }
  const now = new Date().toISOString();
  execute(
    "UPDATE goals SET status='completed',completedAt=?,updatedAt=? WHERE id=? AND userId=?",
    [now, now, id, userId],
  );
}
export function archiveGoal(userId: string, id: string) {
  requireGoal(userId, id);
  execute(
    "UPDATE goals SET status='archived',updatedAt=? WHERE id=? AND userId=?",
    [new Date().toISOString(), id, userId],
  );
}
export function restoreGoal(userId: string, id: string) {
  const g = requireGoal(userId, id),
    completed = g.savedAmount >= g.targetAmount,
    now = new Date().toISOString();
  execute(
    'UPDATE goals SET status=?,completedAt=?,updatedAt=? WHERE id=? AND userId=?',
    [
      completed ? 'completed' : 'active',
      completed ? g.completedAt || now : null,
      now,
      id,
      userId,
    ],
  );
}
export function deleteGoal(userId: string, id: string) {
  requireGoal(userId, id);
  execute('DELETE FROM goals WHERE id=? AND userId=?', [id, userId]);
}
