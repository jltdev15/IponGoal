import React from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  ArrowDownLeft,
  ArrowRight,
  CalendarDays,
  CircleCheck,
  Ellipsis,
  Flag,
} from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParams } from '../navigation/types';
import { useAuthStore } from '../stores/authStore';
import { useGoalStore } from '../stores/goalStore';
import { useSavingsStore } from '../stores/savingsStore';
import {
  archiveGoal,
  completeGoal,
  deleteGoal,
  restoreGoal,
} from '../database/repositories/goalRepository';
import { ScreenContainer } from '../components/ScreenContainer';
import { EmptyState } from '../components/EmptyState';
import { AppButton } from '../components/AppButton';
import { ProgressBar } from '../components/ProgressBar';
import { Icon } from '../components/Icon';
import { GoalPhoto } from '../components/GoalPhoto';
import { confirmAction } from '../components/ConfirmationModal';
import { theme } from '../theme/theme';
import { colors } from '../theme/colors';
import { Saving } from '../types/models';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/dates';
import { goalProgress } from '../utils/calculations';
import { refreshData } from '../services/refresh';
import { useFormAction } from '../services/useFormAction';
export function GoalDetailsScreen({
  route,
  navigation,
}: NativeStackScreenProps<MainStackParams, 'GoalDetails'>) {
  const user = useAuthStore(s => s.user)!,
    goal = useGoalStore(s => s.goals.find(g => g.id === route.params.goalId)),
    entries = useSavingsStore(s => s.savings).filter(
      s => s.goalId === route.params.goalId,
    );
  const { busy, error, run } = useFormAction();
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 380 || fontScale > 1.2;
  if (!goal) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Goal not found."
          body="This goal may have been removed."
          action="Go to Goals"
          onPress={() => navigation.navigate('BottomTabs', { screen: 'Home' })}
        />
      </ScreenContainer>
    );
  }
  const p = goalProgress(goal.savedAmount, goal.targetAmount);
  const status =
    goal.status === 'active'
      ? 'In progress'
      : goal.status === 'completed'
      ? 'Completed'
      : 'Archived';
  const stackAmounts =
    stacked || formatCurrency(goal.targetAmount, true).length > 10;
  function mutate(action: () => void, back = false) {
    void run(() => {
      action();
      refreshData(user.id);
      if (back) {
        navigation.goBack();
      }
    }, 'Unable to update this goal. Please try again.');
  }
  function options() {
    if (busy) return;
    Alert.alert(
      'Goal options',
      'Keep history by archiving goals you no longer need.',
      [
        {
          text: 'Edit Goal',
          onPress: () => navigation.navigate('EditGoal', { goalId: goal!.id }),
        },
        {
          text: goal!.status === 'archived' ? 'Restore Goal' : 'Archive Goal',
          onPress: () =>
            mutate(() =>
              goal!.status === 'archived'
                ? restoreGoal(user.id, goal!.id)
                : archiveGoal(user.id, goal!.id),
            ),
        },
        {
          text: 'Delete Goal',
          style: 'destructive',
          onPress: () =>
            confirmAction(
              `Delete ${goal!.name}?`,
              `This goal contains ${
                goal!.entryCount
              } savings entries. Deleting it will also remove its savings history.`,
              'Delete Permanently',
              () => mutate(() => deleteGoal(user.id, goal!.id), true),
            ),
        },
      ],
      { cancelable: true },
    );
  }
  return (
    <ScreenContainer
      responsive
      contentContainerStyle={styles.content}
      footer={
        <View style={styles.actions}>
          {!!error && (
            <Text accessibilityRole="alert" style={theme.error}>
              {error}
            </Text>
          )}
          {goal.status === 'archived' ? (
            <AppButton
              title="Restore Goal"
              loading={busy}
              onPress={() => mutate(() => restoreGoal(user.id, goal.id))}
            />
          ) : (
            <AppButton
              title="Add Savings"
              disabled={busy}
              onPress={() =>
                navigation.navigate('AddSavings', { goalId: goal.id })
              }
            />
          )}
        </View>
      }
    >
      <View style={styles.identity}>
        <View style={styles.identityRow}>
          <View
            style={styles.goalIcon}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Icon name={goal.icon} size={28} />
          </View>
          <View style={styles.identityCopy}>
            <Text style={styles.category}>{goal.category}</Text>
            <View
              style={[
                styles.statusBadge,
                goal.status === 'completed' && styles.completedBadge,
                goal.status === 'archived' && styles.archivedBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  goal.status === 'completed' && styles.completedText,
                  goal.status === 'archived' && styles.archivedText,
                ]}
              >
                {status}
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Goal options"
            accessibilityHint="Edit, archive or restore, or delete this goal."
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={options}
            style={({ pressed }) => [
              styles.optionsButton,
              (pressed || busy) && styles.dimmed,
            ]}
          >
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <Ellipsis size={24} color={colors.text} />
            </View>
          </Pressable>
        </View>
        <Text accessibilityRole="header" style={styles.goalName}>
          {goal.name}
        </Text>
      </View>
      {!!goal.coverPhoto && (
        <GoalPhoto
          photo={goal.coverPhoto}
          icon={goal.icon}
          name={goal.name}
          large
        />
      )}

      <View style={styles.summary}>
        <View style={styles.savedHeading}>
          <Text style={styles.label}>Saved so far</Text>
          <View
            style={styles.summaryIcon}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Flag size={20} color={colors.primary} strokeWidth={1.8} />
          </View>
        </View>
        <Text
          accessibilityLabel={formatCurrency(goal.savedAmount)}
          style={styles.savedAmount}
        >
          {formatCurrency(goal.savedAmount, true).replace(/,/g, ',\u200b')}
        </Text>
        <View style={styles.progressBlock}>
          <View style={styles.progressHeading}>
            <Text style={styles.label}>Savings progress</Text>
            <Text style={styles.percent}>
              {p.percent > 100 ? '100%+' : `${Math.floor(p.percent)}%`}
            </Text>
          </View>
          <ProgressBar percent={p.visual} />
        </View>
        <View style={[styles.amounts, stackAmounts && styles.stacked]}>
          <View style={[styles.amountField, stackAmounts && styles.unflex]}>
            <Text style={styles.label}>Target amount</Text>
            <Text
              accessibilityLabel={formatCurrency(goal.targetAmount)}
              style={styles.detailAmount}
            >
              {formatCurrency(goal.targetAmount, true).replace(/,/g, ',\u200b')}
            </Text>
          </View>
          <View style={[styles.amountField, stackAmounts && styles.unflex]}>
            <Text style={styles.label}>
              {p.exceeded ? 'Above target' : 'Left to save'}
            </Text>
            <Text
              accessibilityLabel={formatCurrency(p.exceeded || p.remaining)}
              style={[
                styles.detailAmount,
                p.percent >= 100 && styles.positiveText,
              ]}
            >
              {formatCurrency(p.exceeded || p.remaining, true).replace(
                /,/g,
                ',\u200b',
              )}
            </Text>
          </View>
        </View>
      </View>

      {goal.status === 'active' && p.percent >= 100 && (
        <View style={styles.reached}>
          <View style={styles.calloutHeading}>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <CircleCheck size={22} color={colors.positive} />
            </View>
            <Text
              accessibilityRole="header"
              style={[theme.heading, styles.flex]}
            >
              Goal reached!
            </Text>
          </View>
          <Text style={theme.muted}>
            Great job staying consistent. Complete this goal or keep saving.
          </Text>
          <AppButton
            title="Mark as Completed"
            variant="secondary"
            loading={busy}
            onPress={() => mutate(() => completeGoal(user.id, goal.id))}
          />
        </View>
      )}
      {goal.status === 'archived' && (
        <Text style={theme.muted}>
          This goal is archived. Restore it to add savings. Your history is kept
          below.
        </Text>
      )}

      <View style={styles.details}>
        <View style={styles.dateRow}>
          <View
            style={styles.dateIcon}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <CalendarDays size={20} color={colors.muted} strokeWidth={1.8} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.label}>Target date</Text>
            <Text style={styles.detailValue}>
              {goal.targetDate ? formatDate(goal.targetDate) : 'No target date'}
            </Text>
          </View>
        </View>
        {goal.completedAt && goal.status === 'completed' && (
          <View style={styles.detailDivider}>
            <Text style={styles.label}>Completed on</Text>
            <Text style={styles.detailValue}>
              {formatDate(goal.completedAt)}
            </Text>
          </View>
        )}
        {!!goal.note.trim() && (
          <View style={styles.detailDivider}>
            <Text style={styles.label}>Goal note</Text>
            <Text style={theme.body}>{goal.note}</Text>
          </View>
        )}
      </View>

      <View style={styles.recentSection}>
        <View style={[styles.recentHeading, stacked && styles.stacked]}>
          <View style={[styles.flex, stacked && styles.unflex]}>
            <Text accessibilityRole="header" style={theme.heading}>
              Recent savings
            </Text>
            <Text style={theme.muted}>
              {entries.length}{' '}
              {entries.length === 1 ? 'contribution' : 'contributions'}
            </Text>
          </View>
          {!!entries.length && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View all savings"
              onPress={() =>
                navigation.navigate('BottomTabs', {
                  screen: 'History',
                  params: { goalId: goal.id },
                })
              }
              style={({ pressed }) => [
                styles.viewAll,
                pressed && styles.dimmed,
              ]}
            >
              <Text style={styles.viewAllText}>View all</Text>
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <ArrowRight size={16} color={colors.primary} />
              </View>
            </Pressable>
          )}
        </View>
        <View style={styles.savingsList}>
          {entries.length ? (
            entries.slice(0, 5).map((saving, index) => (
              <GoalSavingRow
                key={saving.id}
                saving={saving}
                stacked={stacked}
                last={index === Math.min(entries.length, 5) - 1}
                onPress={() =>
                  navigation.navigate('SavingsDetails', {
                    savingId: saving.id,
                  })
                }
              />
            ))
          ) : (
            <View style={styles.emptySavings}>
              <View
                style={styles.emptyIcon}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <ArrowDownLeft size={24} color={colors.positive} />
              </View>
              <Text style={styles.emptyTitle}>
                Your first saving starts here
              </Text>
              <Text style={theme.muted}>
                {goal.status === 'archived'
                  ? 'Restore this goal when you’re ready to start saving.'
                  : 'Add an amount that feels right for you. Every contribution brings you closer.'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

function GoalSavingRow({
  saving,
  stacked,
  last,
  onPress,
}: {
  saving: Saving;
  stacked: boolean;
  last: boolean;
  onPress: () => void;
}) {
  const stackAmount =
    stacked || formatCurrency(saving.amount, true).length > 10;
  const amount = (
    <Text style={styles.savingAmount}>
      + {formatCurrency(saving.amount, true).replace(/,/g, ',\u200b')}
    </Text>
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${formatCurrency(
        saving.amount,
      )} saved on ${formatDate(saving.transactionDate)}${
        saving.note ? `, ${saving.note}` : ''
      }`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.savingRow,
        !last && styles.savingDivider,
        pressed && styles.dimmed,
      ]}
    >
      <View
        style={styles.savingIcon}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <ArrowDownLeft size={18} color={colors.positive} />
      </View>
      <View style={[styles.savingContent, stackAmount && styles.stacked]}>
        <View style={[styles.flex, stackAmount && styles.unflex]}>
          <Text style={styles.savingDate}>
            {formatDate(saving.transactionDate)}
          </Text>
          {stackAmount && amount}
          {!!saving.note.trim() && (
            <Text numberOfLines={2} style={theme.muted}>
              {saving.note}
            </Text>
          )}
        </View>
        {!stackAmount && amount}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { gap: 20 },
  identity: { gap: 16 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  goalIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityCopy: { flex: 1, minWidth: 0, gap: 6 },
  category: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    fontWeight: '500',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.primarySoft,
  },
  statusText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  completedBadge: { backgroundColor: colors.positiveSoft },
  completedText: { color: colors.positive },
  archivedBadge: { backgroundColor: '#E9EDF2' },
  archivedText: { color: colors.muted },
  optionsButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalName: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.6,
  },
  summary: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  savedHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryIcon: {
    borderRadius: 12,
    padding: 8,
    backgroundColor: colors.primarySoft,
  },
  label: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
    fontWeight: '500',
  },
  savedAmount: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
    color: colors.text,
  },
  progressBlock: { gap: 10, marginTop: 16, marginBottom: 12 },
  progressHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  percent: { fontSize: 14, fontWeight: '700', color: colors.primary },
  amounts: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3E8ED',
  },
  amountField: { flex: 1, gap: 6 },
  detailAmount: { fontSize: 18, fontWeight: '700', color: colors.text },
  positiveText: { color: colors.positive },
  reached: {
    padding: 18,
    gap: 12,
    backgroundColor: colors.positiveSoft,
    borderRadius: 20,
  },
  calloutHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  details: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.surface,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateIcon: { padding: 10, borderRadius: 14, backgroundColor: '#F6F7F9' },
  detailValue: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '600',
    color: colors.text,
  },
  detailDivider: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3E8ED',
    paddingTop: 16,
  },
  recentSection: { gap: 12 },
  recentHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 48,
    alignSelf: 'flex-start',
  },
  viewAllText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  savingsList: {
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  savingRow: {
    minHeight: 64,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  savingDivider: { borderBottomWidth: 1, borderBottomColor: '#F3E8ED' },
  savingIcon: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: colors.positiveSoft,
  },
  savingContent: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  savingDate: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
    color: colors.text,
  },
  savingAmount: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.positive,
    fontWeight: '700',
    flexShrink: 1,
  },
  emptySavings: { paddingVertical: 20, gap: 10 },
  emptyIcon: {
    padding: 10,
    borderRadius: 14,
    alignSelf: 'flex-start',
    backgroundColor: colors.positiveSoft,
  },
  emptyTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
    color: colors.text,
  },
  flex: { flex: 1, minWidth: 0 },
  unflex: { flex: 0 },
  stacked: { flexDirection: 'column', alignItems: 'stretch' },
  actions: { gap: 10 },
  dimmed: { opacity: 0.6 },
});
