import React from 'react';
import { Alert, Text, View } from 'react-native';
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
import { SectionHeader } from '../components/SectionHeader';
import { SavingsListItem } from '../components/SavingsListItem';
import { confirmAction } from '../components/ConfirmationModal';
import { theme } from '../theme/theme';
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
          text: 'More…',
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
    );
  }
  return (
    <ScreenContainer>
      <SectionHeader title={goal.name} action="••• Options" onPress={options} />
      <Icon name={goal.icon} size={48} />
      <Text style={theme.muted}>
        {goal.status.toUpperCase()} · {goal.category}
      </Text>
      <View style={{ gap: 12 }}>
        <Text style={theme.amount}>
          {formatCurrency(goal.savedAmount, true)}
        </Text>
        <Text style={theme.body}>
          of {formatCurrency(goal.targetAmount, true)}
        </Text>
        <ProgressBar percent={p.visual} />
        <Text style={theme.body}>
          {p.percent > 100 ? '100%+' : `${Math.floor(p.percent)}%`} complete
        </Text>
        <Text style={theme.muted}>
          {p.exceeded
            ? `Goal exceeded by ${formatCurrency(p.exceeded, true)}`
            : `${formatCurrency(p.remaining, true)} remaining`}
        </Text>
        {goal.targetDate && (
          <Text style={theme.muted}>Target: {formatDate(goal.targetDate)}</Text>
        )}
        {goal.completedAt && goal.status === 'completed' && (
          <Text style={theme.muted}>
            Completed: {formatDate(goal.completedAt)}
          </Text>
        )}
        {!!goal.note && <Text style={theme.body}>{goal.note}</Text>}
      </View>
      {goal.status === 'archived' ? (
        <AppButton
          title="Restore Goal"
          loading={busy}
          onPress={() => mutate(() => restoreGoal(user.id, goal.id))}
        />
      ) : (
        <AppButton
          title="+ Add Savings"
          onPress={() => navigation.navigate('AddSavings', { goalId: goal.id })}
        />
      )}
      {goal.status === 'active' && p.percent >= 100 && (
        <View style={[theme.card]}>
          <Text style={theme.heading}>Goal Reached!</Text>
          <Text style={theme.body}>
            Great job staying consistent. Complete this goal or keep saving.
          </Text>
          <AppButton
            title="Mark as Completed"
            loading={busy}
            onPress={() => mutate(() => completeGoal(user.id, goal.id))}
          />
        </View>
      )}
      {!!error && (
        <Text accessibilityRole="alert" style={theme.error}>
          {error}
        </Text>
      )}
      <SectionHeader
        title="Recent Savings"
        action="View All"
        onPress={() =>
          navigation.navigate('BottomTabs', {
            screen: 'History',
            params: { goalId: goal.id },
          })
        }
      />
      {entries.length ? (
        entries
          .slice(0, 5)
          .map(s => (
            <SavingsListItem
              key={s.id}
              saving={s}
              onPress={() =>
                navigation.navigate('SavingsDetails', { savingId: s.id })
              }
            />
          ))
      ) : (
        <Text style={theme.muted}>
          No savings yet. Start with an amount that feels right for you.
        </Text>
      )}
    </ScreenContainer>
  );
}
