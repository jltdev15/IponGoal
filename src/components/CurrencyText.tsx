import React from 'react';
import { Text, TextProps } from 'react-native';
import { formatCurrency } from '../utils/currency';
export function CurrencyText({
  amount,
  compact,
  ...props
}: TextProps & { amount: number; compact?: boolean }) {
  return <Text {...props}>{formatCurrency(amount, compact)}</Text>;
}
