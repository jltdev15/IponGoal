import React, { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParams } from '../navigation/types';
import { useAuthStore } from '../stores/authStore';
import { useSavingsStore } from '../stores/savingsStore';
import { deleteSavings } from '../database/repositories/savingsRepository';
import { ScreenContainer } from '../components/ScreenContainer';
import { EmptyState } from '../components/EmptyState';
import { AppButton } from '../components/AppButton';
import { theme } from '../theme/theme';
import { colors } from '../theme/colors';
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
  const deletion = useRef<'idle' | 'confirming' | 'deleting' | 'deleted'>(
    'idle',
  );
  useEffect(() => {
    if (error) {
      AccessibilityInfo.announceForAccessibility(error);
    }
  }, [error]);
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
          {busy && (
            <Text accessibilityLiveRegion="polite" style={styles.status}>
              Deleting entry…
            </Text>
          )}
          <AppButton
            title="Edit Entry"
            disabled={busy}
            onPress={() => {
              if (deletion.current === 'idle') {
                navigation.navigate('EditSavings', { savingId: saving.id });
              }
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete Entry"
            accessibilityState={{ disabled: busy, busy }}
            disabled={busy}
            onPress={() => {
              if (deletion.current !== 'idle') {
                return;
              }
              deletion.current = 'confirming';
              const cancel = () => {
                if (deletion.current === 'confirming') {
                  deletion.current = 'idle';
                }
              };
              Alert.alert(
                'Delete this savings entry?',
                'This will reduce the saved amount for the associated goal. A completed goal will reopen if its savings fall below the target.',
                [
                  { text: 'Cancel', style: 'cancel', onPress: cancel },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      if (deletion.current !== 'confirming') {
                        return;
                      }
                      deletion.current = 'deleting';
                      void run(() => {
                        deleteSavings(user.id, saving.id);
                        refreshData(user.id);
                        deletion.current = 'deleted';
                        navigation.goBack();
                      }, 'Unable to delete this savings entry.').finally(() => {
                        if (deletion.current === 'deleting') {
                          deletion.current = 'idle';
                        }
                      });
                    },
                  },
                ],
                { cancelable: true, onDismiss: cancel },
              );
            }}
            style={({ pressed }) => [
              styles.deleteAction,
              (pressed || busy) && styles.dimmed,
            ]}
          >
            <Text style={styles.deleteText}>Delete Entry</Text>
          </Pressable>
        </View>
      }
    >
      {({ compact }) => (
        <>
          <View
            style={[theme.card, styles.summary, compact && styles.compactCard]}
          >
            <Text style={theme.muted}>Amount saved</Text>
            <Text
              accessibilityLabel={formatCurrency(saving.amount)}
              style={[theme.amount, styles.amount]}
            >
              {/* Wrap between thousands groups rather than splitting digits. */}
              {formatCurrency(saving.amount).replace(/,/g, ',\u200b')}
            </Text>
          </View>
          <View
            style={[theme.card, styles.details, compact && styles.compactCard]}
          >
            <View style={styles.field}>
              <Text style={styles.label}>Savings goal</Text>
              <Text style={theme.heading}>{saving.goalName}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="View Goal"
                accessibilityState={{ disabled: busy }}
                disabled={busy}
                onPress={() => {
                  if (deletion.current === 'idle') {
                    navigation.navigate('GoalDetails', {
                      goalId: saving.goalId,
                    });
                  }
                }}
                style={({ pressed }) => [
                  styles.goalAction,
                  (pressed || busy) && styles.dimmed,
                ]}
              >
                <Text style={styles.goalLink}>View Goal</Text>
              </Pressable>
            </View>
            <View style={[styles.field, styles.divider]}>
              <Text style={styles.label}>Date saved</Text>
              <Text style={theme.body}>
                {formatDate(saving.transactionDate)}
              </Text>
            </View>
            <View style={[styles.field, styles.divider]}>
              <Text style={styles.label}>Note</Text>
              <Text style={saving.note.trim() ? theme.body : theme.muted}>
                {saving.note.trim() ? saving.note : 'No note added'}
              </Text>
            </View>
          </View>
          <View style={styles.field}>
            <Text style={theme.muted}>
              Recorded on {formatDate(saving.createdAt)} at{' '}
              {new Date(saving.createdAt).toLocaleTimeString('en-PH', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
            <Text style={theme.muted}>
              When this entry was added to the app.
            </Text>
          </View>
        </>
      )}
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  content: { gap: 24 },
  summary: { padding: 24, gap: 8 },
  compactCard: { padding: 16 },
  amount: { color: colors.positive, flexShrink: 1 },
  details: { gap: 20 },
  field: { gap: 6 },
  label: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
    color: colors.muted,
  },
  divider: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 20 },
  goalAction: {
    minHeight: 48,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  goalLink: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: colors.primary,
  },
  actions: { gap: 8 },
  status: { ...theme.muted, textAlign: 'center' },
  deleteAction: {
    minHeight: 48,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: colors.danger,
    textAlign: 'center',
  },
  dimmed: { opacity: 0.5 },
});
