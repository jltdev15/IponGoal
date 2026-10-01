import { Goal, Saving } from '../types/models';
import { localDate, periodBounds } from './dates';
export function goalProgress(saved: number, target: number) {
  const percent = target > 0 ? (saved / target) * 100 : 0;
  return {
    percent,
    visual: Math.min(Math.max(percent, 0), 100),
    remaining: Math.max(target - saved, 0),
    exceeded: Math.max(saved - target, 0),
  };
}
export function statistics(goals: Goal[], entries: Saving[], now = new Date()) {
  const week = periodBounds('week', now),
    month = periodBounds('month', now);
  const inRange = (s: Saving, p: { from: string; to: string }) =>
    s.transactionDate >= p.from && s.transactionDate <= p.to;
  const sum = (xs: Saving[]) => xs.reduce((n, s) => n + s.amount, 0);
  const monthly = entries.filter(s => inRange(s, month));
  const totals = new Map<string, number>();
  entries.forEach(s =>
    totals.set(s.goalId, (totals.get(s.goalId) || 0) + s.amount),
  );
  const most = [...totals.entries()].sort((a, b) => b[1] - a[1])[0];
  const buckets = Array.from(
    {
      length: Math.ceil(
        new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() / 7,
      ),
    },
    () => 0,
  );
  monthly.forEach(s => {
    buckets[Math.floor((Number(s.transactionDate.slice(8)) - 1) / 7)] +=
      s.amount;
  });
  return {
    total: sum(entries),
    week: sum(entries.filter(s => inRange(s, week))),
    month: sum(monthly),
    average: entries.length ? Math.round(sum(entries) / entries.length) : 0,
    count: entries.length,
    monthCount: monthly.length,
    active: goals.filter(g => g.status === 'active').length,
    completed: goals.filter(g => g.status === 'completed').length,
    mostGoal: goals.find(g => g.id === most?.[0])?.name,
    buckets,
    asOf: localDate(now),
  };
}
