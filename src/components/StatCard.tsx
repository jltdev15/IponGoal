import React from 'react';
import { Text, View } from 'react-native';
import { theme } from '../theme/theme';
export function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <View style={[theme.card, { flexGrow: 1, flexBasis: '45%', padding: 16 }]}>
      <Text style={theme.muted}>{label}</Text>
      <Text style={theme.heading}>{value}</Text>
    </View>
  );
}
