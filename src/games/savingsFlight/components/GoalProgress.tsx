import React from 'react';
import { Text, View } from 'react-native';
import { theme } from '../../../theme/theme';
import { colors } from '../../../theme/colors';
import { formatCurrency } from '../../../utils/currency';
export function GoalProgress({
  savings,
  target,
}: {
  savings: number;
  target: number;
}) {
  const percent = (savings / target) * 100;
  return (
    <View style={{ gap: 5 }}>
      <Text
        style={[theme.body, { fontSize: 15 }]}
        accessibilityLabel={`Practice savings ${formatCurrency(
          savings,
          true,
        )} of ${formatCurrency(target, true)}`}
      >
        {formatCurrency(savings, true)} / {formatCurrency(target, true)}
      </Text>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Practice goal progress"
        accessibilityValue={{
          min: 0,
          max: 100,
          now: Math.min(100, percent),
          text: `${percent.toFixed(1)} percent`,
        }}
        style={{ height: 8, borderRadius: 4, backgroundColor: colors.track }}
      >
        <View
          style={{
            width: `${Math.min(100, Math.max(0, percent))}%`,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.positive,
          }}
        />
      </View>
    </View>
  );
}
