import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParams } from '../navigation/types';
import { useAuthStore } from '../stores/authStore';
import { useGoalStore } from '../stores/goalStore';
import { useSavingsStore } from '../stores/savingsStore';
import {
  addSavings,
  updateSavings,
} from '../database/repositories/savingsRepository';
import { completeGoal } from '../database/repositories/goalRepository';
import { ScreenContainer } from '../components/ScreenContainer';
import { EmptyState } from '../components/EmptyState';
import { AppInput } from '../components/AppInput';
import { AmountInput } from '../components/AmountInput';
import { AppButton } from '../components/AppButton';
import { Icon } from '../components/Icon';
import { FinancialTipCard } from '../components/FinancialTipCard';
import { theme } from '../theme/theme';
import {
  amountInputValue,
  formatCurrency,
  toCentavos,
} from '../utils/currency';
import { localDate } from '../utils/dates';
import { goalProgress } from '../utils/calculations';
import { refreshData } from '../services/refresh';
import { useFormAction } from '../services/useFormAction';
export function SavingsFormScreen({
  route,
  navigation,
}: NativeStackScreenProps<MainStackParams, 'AddSavings' | 'EditSavings'>) {
  const user = useAuthStore(s => s.user)!,
    savingId =
      route.params && 'savingId' in route.params
        ? route.params.savingId
        : undefined;
  const entry = useSavingsStore(s =>
    s.savings.find(saving => saving.id === savingId),
  );
  const goalId = 'goalId' in route.params ? route.params.goalId : entry?.goalId;
  const goal = useGoalStore(s => s.goals.find(g => g.id === goalId));
  const [amount, setAmount] = useState(
      entry ? amountInputValue(entry.amount) : '',
    ),
    [date, setDate] = useState(entry?.transactionDate || localDate()),
    [note, setNote] = useState(entry?.note || ''),
    [success, setSuccess] = useState<number | null>(null);
  const { busy, error, run } = useFormAction();
  if (!goal || (savingId && !entry)) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Savings goal not found."
          body="This record may have been removed."
          action="Go Back"
          onPress={() => navigation.goBack()}
        />
      </ScreenContainer>
    );
  }
  const p = goalProgress(goal.savedAmount, goal.targetAmount);
  const done = () => navigation.goBack();
  if (success !== null) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: 'center', gap: 24 }}>
          <Icon name="check" size={56} />
          <Text style={theme.title}>
            {p.percent >= 100 && goal.status === 'active'
              ? 'Goal Reached!'
              : 'Nice work!'}
          </Text>
          <Text style={theme.body}>
            You added {formatCurrency(success)} to {goal.name}.
          </Text>
          <Text style={theme.body}>
            You're now {Math.floor(p.visual)}% of the way to your goal.
          </Text>
          <FinancialTipCard index={goal.entryCount} />
        </View>
        {p.percent >= 100 && goal.status === 'active' ? (
          <>
            <AppButton
              title="Mark as Completed"
              loading={busy}
              onPress={() => {
                void run(() => {
                  completeGoal(user.id, goal.id);
                  refreshData(user.id);
                  done();
                }, 'Unable to complete this goal.');
              }}
            />
            <AppButton title="Keep Saving" variant="secondary" onPress={done} />
          </>
        ) : (
          <AppButton title="Done" onPress={done} />
        )}{' '}
        {!!error && <Text style={theme.error}>{error}</Text>}
      </ScreenContainer>
    );
  }
  return (
    <ScreenContainer>
      <Text style={theme.title}>{goal.name}</Text>
      <Text style={theme.muted}>
        Current: {formatCurrency(goal.savedAmount, true)} ·{' '}
        {Math.floor(p.visual)}% complete
      </Text>
      <Text style={theme.body}>
        {savingId
          ? 'Update your record so your progress stays accurate.'
          : 'Every small amount brings your goal closer.'}
      </Text>
      <AmountInput label="Amount" value={amount} onChangeText={setAmount} />
      <AppInput
        label="Date"
        value={date}
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
        maxLength={10}
        keyboardType="numbers-and-punctuation"
        helper="The day you saved this amount."
      />
      <AppInput
        label="Note (optional)"
        value={note}
        onChangeText={setNote}
        multiline
        placeholder="Saved from my allowance"
      />
      {!!error && (
        <Text accessibilityRole="alert" style={theme.error}>
          {error}
        </Text>
      )}
      <AppButton
        title={savingId ? 'Save Changes' : 'Add Savings'}
        loading={busy}
        onPress={() => {
          void run(() => {
            const input = {
              amount: toCentavos(amount),
              transactionDate: date.trim(),
              note,
            };
            if (savingId) {
              updateSavings(user.id, savingId, input);
              refreshData(user.id);
              navigation.goBack();
            } else {
              addSavings(user.id, goal.id, input);
              refreshData(user.id);
              setSuccess(input.amount);
            }
          }, 'Savings entry could not be saved. Please try again.');
        }}
      />
    </ScreenContainer>
  );
}
