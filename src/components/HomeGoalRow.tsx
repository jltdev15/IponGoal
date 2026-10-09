import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { ArrowRight, CalendarDays, Plus } from 'lucide-react-native';
import { Goal } from '../types/models';
import { GoalPhoto } from './GoalPhoto';
import { ProgressBar } from './ProgressBar';
import { theme } from '../theme/theme';
import { colors } from '../theme/colors';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/dates';
import { goalProgress } from '../utils/calculations';

export function HomeGoalRow({
  goal,
  onOpen,
  onAdd,
}: {
  goal: Goal;
  onOpen: () => void;
  onAdd: () => void;
}) {
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 380 || fontScale > 1.2;
  const progress = goalProgress(goal.savedAmount, goal.targetAmount);
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${goal.name}`}
        onPress={onOpen}
        style={({ pressed }) => [styles.details, pressed && styles.pressed]}
      >
        <View style={styles.identity}>
          <GoalPhoto
            photo={goal.coverPhoto}
            icon={goal.icon}
            name={goal.name}
          />
          <Text style={[theme.heading, styles.name]}>{goal.name}</Text>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <ArrowRight size={18} color={colors.muted} strokeWidth={1.8} />
          </View>
        </View>
        <Text style={theme.muted}>
          <Text style={styles.saved}>
            {formatCurrency(goal.savedAmount, true)}
          </Text>
          {' saved of '}
          {formatCurrency(goal.targetAmount, true)}
        </Text>
        <ProgressBar percent={progress.visual} />
      </Pressable>
      <View style={[styles.actions, stacked && styles.stacked]}>
        <View style={[styles.metadata, stacked && styles.unflex]}>
          <Text style={styles.percent}>
            {progress.percent > 100
              ? '100%+'
              : `${Math.floor(progress.percent)}%`}{' '}
            saved
          </Text>
          {goal.targetDate && (
            <View style={styles.dateRow}>
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <CalendarDays
                  size={14}
                  color={colors.muted}
                  strokeWidth={1.8}
                />
              </View>
              <Text style={styles.date}>
                Aim for {formatDate(goal.targetDate)}
              </Text>
            </View>
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Record savings for ${goal.name}`}
          onPress={onAdd}
          style={({ pressed }) => [styles.add, pressed && styles.pressed]}
        >
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Plus size={18} color={colors.primary} strokeWidth={1.8} />
          </View>
          <Text style={styles.addText}>Record savings</Text>
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  details: { gap: 12, minHeight: 48 },
  pressed: { opacity: 0.75 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { flex: 1, minWidth: 0, fontSize: 17 },
  saved: { fontWeight: '700', color: colors.text },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stacked: { flexDirection: 'column', alignItems: 'stretch' },
  metadata: { flex: 1, gap: 4 },
  unflex: { flex: 0 },
  percent: {
    color: colors.positive,
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 22,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  date: { flex: 1, color: colors.muted, fontSize: 12, lineHeight: 18 },
  add: {
    minHeight: 48,
    maxWidth: '100%',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addText: {
    flexShrink: 1,
    color: colors.primary,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
});
