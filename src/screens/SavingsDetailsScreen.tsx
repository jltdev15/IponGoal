import React from 'react';
import { Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParams } from '../navigation/types';
import { useAuthStore } from '../stores/authStore';
import { useSavingsStore } from '../stores/savingsStore';
import { deleteSavings } from '../database/repositories/savingsRepository';
import { ScreenContainer } from '../components/ScreenContainer';
import { EmptyState } from '../components/EmptyState';
import { AppButton } from '../components/AppButton';
import { confirmAction } from '../components/ConfirmationModal';
import { theme } from '../theme/theme';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/dates';
import { refreshData } from '../services/refresh';
import { useFormAction } from '../services/useFormAction';
export function SavingsDetailsScreen({
  route,
  navigation,
}: NativeStackScreenProps<MainStackParams, 'SavingsDetails'>) {
  const user = useAuthStore(s => s.user)!,
    saving = useSavingsStore(state =>
      state.savings.find(entry => entry.id === route.params.savingId),
    );
  const { busy, error, run } = useFormAction();
  if (!saving) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Savings entry not found."
          body="This entry may have been removed."
          action="Go Back"
          onPress={() => navigation.goBack()}
        />
      </ScreenContainer>
    );
  }
  return (
    <ScreenContainer>
      <Text style={theme.amount}>+ {formatCurrency(saving.amount)}</Text>
      <Text style={theme.heading}>{saving.goalName}</Text>
      <Text style={theme.body}>
        Saved on {formatDate(saving.transactionDate)}
      </Text>
      <Text style={theme.muted}>
        Recorded {formatDate(saving.createdAt)} at{' '}
        {new Date(saving.createdAt).toLocaleTimeString('en-PH', {
          hour: 'numeric',
          minute: '2-digit',
        })}
      </Text>
      <Text style={theme.body}>{saving.note || 'No note added.'}</Text>
      <AppButton
        title="View Goal"
        variant="secondary"
        onPress={() =>
          navigation.navigate('GoalDetails', { goalId: saving.goalId })
        }
      />
      <AppButton
        title="Edit"
        onPress={() =>
          navigation.navigate('EditSavings', { savingId: saving.id })
        }
      />
      <AppButton
        title="Delete"
        variant="secondary"
        disabled={busy}
        onPress={() =>
          confirmAction(
            'Delete this savings entry?',
            'This will reduce the saved amount for the associated goal. A completed goal will reopen if its savings fall below the target.',
            'Delete',
            () => {
              void run(() => {
                deleteSavings(user.id, saving.id);
                refreshData(user.id);
                navigation.goBack();
              }, 'Unable to delete this savings entry.');
            },
          )
        }
      />
      {!!error && (
        <Text accessibilityRole="alert" style={theme.error}>
          {error}
        </Text>
      )}
    </ScreenContainer>
  );
}
