import React from 'react';
import { Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { theme } from '../theme/theme';
import { formatCurrency } from '../utils/currency';
export function WeeklyChart({ buckets }: { buckets: number[] }) {
  const maximum = Math.max(...buckets, 1);
  return (
    <View style={theme.card}>
      <Text style={theme.heading}>Savings this month</Text>
      <Text style={theme.muted}>
        Amount saved (PHP) · 7-day groups, starting day 1
      </Text>
      <View
        style={{
          flexDirection: 'row',
          gap: 10,
          alignItems: 'flex-end',
          height: 180,
        }}
      >
        {buckets.map((value, i) => (
          <View
            key={i}
            accessible
            accessibilityLabel={`Week ${i + 1}, ${formatCurrency(value)} saved`}
            style={{ flex: 1, alignItems: 'center', gap: 10 }}
          >
            <View
              style={{
                height: 138,
                width: '100%',
                justifyContent: 'flex-end',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  height: value ? Math.max((value / maximum) * 138, 4) : 2,
                  width: '64%',
                  backgroundColor: value ? colors.primary : colors.border,
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8,
                }}
              />
            </View>
            <Text style={theme.muted}>W{i + 1}</Text>
          </View>
        ))}
      </View>
      <Text style={theme.muted}>
        Scale: ₱0 to{' '}
        {formatCurrency(
          maximum === 1 && buckets.every(n => !n) ? 0 : maximum,
          true,
        )}
      </Text>
      {buckets.map((amount, index) => (
        <Text key={index} style={theme.muted}>
          Week {index + 1}: {formatCurrency(amount, true)}
        </Text>
      ))}
    </View>
  );
}
