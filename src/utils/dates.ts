export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`;
}
export function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const d = new Date(`${value}T12:00:00`);
  return !Number.isNaN(d.getTime()) && localDate(d) === value;
}
export function validateDate(value: string) {
  if (!isValidDate(value)) {
    throw new Error('Enter a valid date as YYYY-MM-DD.');
  }
}
export const formatDate = (value: string, short = false) =>
  new Date(
    value.length === 10 ? `${value}T12:00:00` : value,
  ).toLocaleDateString('en-PH', {
    month: short ? 'short' : 'long',
    day: 'numeric',
    year: short ? undefined : 'numeric',
  });
export function periodBounds(period: 'week' | 'month', now = new Date()) {
  const start = new Date(now);
  if (period === 'month') {
    start.setDate(1);
  } else {
    start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  }
  return { from: localDate(start), to: localDate(now) };
}
