import { execute, rows } from '../database';
import { Saving, SavingInput, HistoryFilter } from '../../types/models';
import { newId } from '../../utils/id';
import { validateSaving } from '../../utils/validation';
import { MAX_CENTAVOS } from '../../utils/currency';
const select =
  'SELECT s.*,g.name AS goalName FROM savings s JOIN goals g ON g.id=s.goalId AND g.userId=s.userId';
export function getSavingsHistory(userId: string, filter: HistoryFilter = {}) {
  const clauses = ['s.userId=?'],
    params: (string | number | null)[] = [userId];
  if (filter.goalId) {
    clauses.push('s.goalId=?');
    params.push(filter.goalId);
  }
  if (filter.from) {
    clauses.push('s.transactionDate>=?');
    params.push(filter.from);
  }
  if (filter.to) {
    clauses.push('s.transactionDate<=?');
    params.push(filter.to);
  }
  return rows<Saving>(
    `${select} WHERE ${clauses.join(
      ' AND ',
    )} ORDER BY s.transactionDate DESC,s.createdAt DESC`,
    params,
  );
}
export const getSavingsByGoal = (userId: string, goalId: string) =>
  getSavingsHistory(userId, { goalId });
export const getSavingById = (userId: string, id: string) =>
  rows<Saving>(`${select} WHERE s.userId=? AND s.id=?`, [userId, id])[0];
export const getTotalSavings = (userId: string) =>
  rows<{ total: number }>(
    'SELECT COALESCE(SUM(amount),0) AS total FROM savings WHERE userId=?',
    [userId],
  )[0].total;
export function assertSavingsCapacity(
  userId: string,
  amount: number,
  excludeId?: string,
) {
  const total = rows<{ total: number }>(
    'SELECT COALESCE(SUM(amount),0) AS total FROM savings WHERE userId=? AND id!=?',
    [userId, excludeId || ''],
  )[0].total;
  if (total + amount > MAX_CENTAVOS) {
    throw new Error('Total tracked savings cannot exceed ₱1,000,000,000.');
  }
}
export function addSavings(userId: string, goalId: string, input: SavingInput) {
  validateSaving(input);
  const g = rows<{ status: string }>(
    'SELECT status FROM goals WHERE id=? AND userId=?',
    [goalId, userId],
  )[0];
  if (!g || g.status === 'archived') {
    throw new Error('Restore this goal before adding savings.');
  }
  assertSavingsCapacity(userId, input.amount);
  const id = newId('saving'),
    now = new Date().toISOString();
  execute(
    'INSERT INTO savings(id,userId,goalId,amount,note,transactionDate,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?)',
    [
      id,
      userId,
      goalId,
      input.amount,
      input.note.trim(),
      input.transactionDate,
      now,
      now,
    ],
  );
  return id;
}
export function updateSavings(userId: string, id: string, input: SavingInput) {
  if (!getSavingById(userId, id)) {
    throw new Error('Savings entry not found.');
  }
  validateSaving(input);
  assertSavingsCapacity(userId, input.amount, id);
  execute(
    'UPDATE savings SET amount=?,note=?,transactionDate=?,updatedAt=? WHERE id=? AND userId=?',
    [
      input.amount,
      input.note.trim(),
      input.transactionDate,
      new Date().toISOString(),
      id,
      userId,
    ],
  );
}
export function deleteSavings(userId: string, id: string) {
  if (!getSavingById(userId, id)) {
    throw new Error('Savings entry not found.');
  }
  execute('DELETE FROM savings WHERE id=? AND userId=?', [id, userId]);
}
