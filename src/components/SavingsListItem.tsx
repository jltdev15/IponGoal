import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Saving } from '../types/models';
import { theme } from '../theme/theme';
import { colors } from '../theme/colors';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/dates';
export function SavingsListItem({
  saving,
  onPress,
}: {
  saving: Saving;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${saving.goalName}, ${formatCurrency(
        saving.amount,
      )}, ${formatDate(saving.transactionDate)}`}
      onPress={onPress}
      style={{
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderColor: colors.border,
        gap: 8,
      }}
    >
      <View style={theme.row}>
        <Text style={[theme.body, { flex: 1, fontWeight: '600' }]}>
          {saving.goalName}
        </Text>
        <Text
          style={{ fontSize: 18, fontWeight: '700', color: colors.positive }}
        >
          + {formatCurrency(saving.amount, true)}
        </Text>
      </View>
      <Text style={theme.muted}>
        {formatDate(saving.transactionDate)} · Recorded{' '}
        {new Date(saving.createdAt).toLocaleTimeString('en-PH', {
          hour: 'numeric',
          minute: '2-digit',
        })}
      </Text>
      {!!saving.note && <Text style={theme.muted}>{saving.note}</Text>}
    </Pressable>
  );
}
