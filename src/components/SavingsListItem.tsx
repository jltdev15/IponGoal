import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Saving } from '../types/models';
import { theme } from '../theme/theme';
import { primaryStyles } from './PrimaryScreen';
import { colors } from '../theme/colors';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/dates';
export function SavingsListItem({
  saving,
  onPress,
  variant = 'list',
}: {
  saving: Saving;
  onPress: () => void;
  variant?: 'list' | 'card';
}) {
  const { width, fontScale } = useWindowDimensions();
  const stacked =
    variant === 'card' &&
    (width < 380 ||
      fontScale > 1.2 ||
      formatCurrency(saving.amount, true).length > 8);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${saving.goalName}, ${formatCurrency(
        saving.amount,
      )}, ${formatDate(saving.transactionDate)}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        variant === 'card' && primaryStyles.card,
        pressed && primaryStyles.pressed,
      ]}
    >
      <View style={[theme.row, stacked && primaryStyles.stacked]}>
        <Text
          style={[theme.body, { flex: stacked ? 0 : 1, fontWeight: '600' }]}
        >
          {saving.goalName}
        </Text>
        <Text style={styles.amount}>
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

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.positive,
    flexShrink: 1,
  },
});
