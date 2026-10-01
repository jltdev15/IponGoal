import React from 'react';
import { AppInput } from './AppInput';
export function AmountInput({
  label,
  value,
  onChangeText,
  helper,
}: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  helper?: string;
}) {
  return (
    <AppInput
      label={`${label} (₱)`}
      value={value}
      onChangeText={onChangeText}
      keyboardType="decimal-pad"
      placeholder="0.00"
      helper={helper}
      maxLength={16}
    />
  );
}
