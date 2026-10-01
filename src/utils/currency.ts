import { appConfig } from '../config/appConfig';
export const MAX_CENTAVOS = 100_000_000_000;
export function toCentavos(value: string): number {
  const text = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    throw new Error('Enter a valid amount with up to two decimal places.');
  }
  const [whole, fraction = ''] = text.split('.');
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(amount) || amount > MAX_CENTAVOS) {
    throw new Error('Enter an amount up to ₱1,000,000,000.');
  }
  return amount;
}
export function validAmount(amount: number, allowZero = false) {
  if (
    !Number.isSafeInteger(amount) ||
    amount < (allowZero ? 0 : 1) ||
    amount > MAX_CENTAVOS
  ) {
    throw new Error('Please enter a valid amount.');
  }
}
export const fromCentavos = (value: number) => value / 100;
export const amountInputValue = (value: number) => (value / 100).toFixed(2);
export function formatCurrency(value: number, compact = false) {
  return new Intl.NumberFormat(appConfig.DEFAULT_LOCALE, {
    style: 'currency',
    currency: appConfig.DEFAULT_CURRENCY,
    minimumFractionDigits: compact && value % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(fromCentavos(value));
}
