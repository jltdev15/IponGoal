import React from 'react';
import { Text, View } from 'react-native';
import { theme } from '../theme/theme';
import { primaryStyles } from './PrimaryScreen';
export function StatCard({
  label,
  value,
  stacked = false,
}: {
  label: string;
  value: string | number;
  stacked?: boolean;
}) {
  return (
    <View
      style={[
        primaryStyles.card,
        { flexGrow: 1, flexBasis: stacked ? '100%' : '45%', minWidth: 0 },
      ]}
    >
      <Text style={theme.muted}>{label}</Text>
      <Text style={theme.heading}>{value}</Text>
    </View>
  );
}
