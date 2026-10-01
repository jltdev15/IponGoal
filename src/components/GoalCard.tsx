import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Goal } from '../types/models';
import { theme } from '../theme/theme';
import { colors } from '../theme/colors';
import { Icon } from './Icon';
import { AppButton } from './AppButton';
import { ProgressBar } from './ProgressBar';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/dates';
import { goalProgress } from '../utils/calculations';
export function GoalCard({
  goal,
  onOpen,
  onAdd,
}: {
  goal: Goal;
  onOpen: () => void;
  onAdd?: () => void;
}) {
  const p = goalProgress(goal.savedAmount, goal.targetAmount);
  return (
    <View style={theme.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${goal.name}`}
        onPress={onOpen}
        style={{ gap: 14 }}
      >
        <View style={theme.row}>
          <View
            style={{
              padding: 12,
              backgroundColor: colors.primarySoft,
              borderRadius: 14,
            }}
          >
            <Icon name={goal.icon} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={theme.heading}>{goal.name}</Text>
            <Text style={theme.muted}>
              {goal.category} · {goal.status}
            </Text>
          </View>
        </View>
        <Text style={theme.body}>
          <Text style={{ fontWeight: '700' }}>
            {formatCurrency(goal.savedAmount, true)}
          </Text>{' '}
          of {formatCurrency(goal.targetAmount, true)}
        </Text>
        <ProgressBar percent={p.visual} />
        <View style={theme.row}>
          <Text style={[theme.muted, { flex: 1 }]}>
            {p.exceeded
              ? `Exceeded by ${formatCurrency(p.exceeded, true)}`
              : `${formatCurrency(p.remaining, true)} remaining`}
          </Text>
          <Text
            style={{ fontSize: 14, color: colors.primary, fontWeight: '700' }}
          >
            {p.percent > 100 ? '100%+' : `${Math.floor(p.percent)}%`}
          </Text>
        </View>
        {goal.targetDate && (
          <Text style={theme.muted}>Target: {formatDate(goal.targetDate)}</Text>
        )}
        {goal.completedAt && goal.status === 'completed' && (
          <Text style={theme.muted}>
            Completed {formatDate(goal.completedAt)}
          </Text>
        )}
      </Pressable>
      {onAdd && (
        <AppButton title="+ Add Savings" variant="secondary" onPress={onAdd} />
      )}
    </View>
  );
}
