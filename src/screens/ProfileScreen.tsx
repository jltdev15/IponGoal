import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Archive, BadgeCheck, Info } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParams } from '../navigation/types';
import {
  PrimaryScreenHeader,
  primaryStyles,
  usePrimaryScreenLayout,
} from '../components/PrimaryScreen';
import { SavingsSummary, summaryStyles } from '../components/SavingsSummary';
import { useAuthStore } from '../stores/authStore';
import { useGoalStore } from '../stores/goalStore';
import { useSavingsStore } from '../stores/savingsStore';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppButton } from '../components/AppButton';
import { ProfileRow } from '../components/ProfileRow';
import { confirmAction } from '../components/ConfirmationModal';
import { theme } from '../theme/theme';
import { colors } from '../theme/colors';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { formatCurrency } from '../utils/currency';
import { appConfig } from '../config/appConfig';
import { useFormAction } from '../services/useFormAction';
export function ProfileScreen() {
  const { contentStyle, stacked } = usePrimaryScreenLayout();
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParams>>();
  const user = useAuthStore(s => s.user)!;
  const logout = useAuthStore(s => s.logout);
  const reset = useAuthStore(s => s.reset);
  const goals = useGoalStore(s => s.goals);
  const entries = useSavingsStore(s => s.savings);
  const { busy, error, run } = useFormAction();
  const [operation, setOperation] = useState<'logout' | 'reset' | null>(null);
  const active = goals.filter(g => g.status === 'active').length;
  const completed = goals.filter(g => g.status === 'completed').length;
  const archived = goals.filter(g => g.status === 'archived').length;
  const performAction = (action: 'logout' | 'reset') => {
    void run(
      () => {
        setOperation(action);
        return action === 'logout' ? logout() : reset();
      },
      action === 'logout'
        ? 'Unable to log out. Please try again.'
        : 'Unable to reset your data. Please try again.',
    );
  };
  return (
    <ScreenContainer
      bottomSafeArea={false}
      contentContainerStyle={contentStyle}
    >
      <PrimaryScreenHeader title="Profile" subtitle="Your account" />
      <View style={primaryStyles.card}>
        <View style={[styles.identity, stacked && styles.stacked]}>
          <ProfileAvatar
            fullName={user.fullName}
            photo={user.profilePhoto}
            size={64}
          />
          <View style={[styles.identityText, stacked && styles.unflex]}>
            <Text accessibilityRole="header" style={styles.name}>
              {user.fullName}
            </Text>
            <Text style={theme.muted}>@{user.username}</Text>
            {!!user.gradeLevel && (
              <Text style={theme.body}>{user.gradeLevel}</Text>
            )}
            <Text style={theme.muted}>Offline profile · This device</Text>
          </View>
        </View>
        <AppButton
          title="Edit Profile"
          disabled={busy}
          onPress={() => navigation.navigate('EditProfile')}
        />
      </View>
      <SavingsSummary
        label="Total recorded savings"
        amount={formatCurrency(
          entries.reduce((sum, entry) => sum + entry.amount, 0),
          true,
        )}
        note="Includes active, completed, and archived goals."
        stacked={stacked}
      >
        <View style={[summaryStyles.counts, stacked && summaryStyles.stacked]}>
          <View
            style={[summaryStyles.countChip, stacked && summaryStyles.unflex]}
          >
            <Text style={summaryStyles.countText}>
              <Text style={summaryStyles.countNumber}>{active}</Text> Active
              goals
            </Text>
          </View>
          <View
            style={[summaryStyles.countChip, stacked && summaryStyles.unflex]}
          >
            <Text style={summaryStyles.countText}>
              <Text style={summaryStyles.countNumber}>{completed}</Text>{' '}
              Completed goals
            </Text>
          </View>
        </View>
      </SavingsSummary>
      <View style={styles.section}>
        <Text accessibilityRole="header" style={theme.heading}>
          Your goals
        </Text>
        <View style={styles.group}>
          <ProfileRow
            title="Completed Goals"
            count={completed}
            icon={<BadgeCheck size={24} color={colors.primary} />}
            disabled={busy}
            onPress={() => navigation.navigate('CompletedGoals')}
          />
          <View style={styles.divider} />
          <ProfileRow
            title="Archived Goals"
            count={archived}
            icon={<Archive size={24} color={colors.primary} />}
            disabled={busy}
            onPress={() => navigation.navigate('ArchivedGoals')}
          />
        </View>
      </View>
      <View style={styles.section}>
        <Text accessibilityRole="header" style={theme.heading}>
          App information
        </Text>
        <View style={styles.group}>
          <View style={styles.info}>
            <Text style={theme.muted}>Currency</Text>
            <Text style={theme.body}>
              Philippine Peso ({appConfig.DEFAULT_CURRENCY})
            </Text>
          </View>
          <View style={styles.divider} />
          <ProfileRow
            title="About the App"
            icon={<Info size={24} color={colors.primary} />}
            disabled={busy}
            onPress={() => navigation.navigate('About')}
          />
        </View>
      </View>
      <View style={primaryStyles.card}>
        {operation === 'logout' && !!error && (
          <Text
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={theme.error}
          >
            {error}
          </Text>
        )}
        <AppButton
          title="Log out"
          variant="secondary"
          disabled={busy}
          loading={busy && operation === 'logout'}
          onPress={() => performAction('logout')}
        />
        <Text style={theme.muted}>
          Logging out keeps your recorded goals and savings on this device.
        </Text>
      </View>
      <View style={[primaryStyles.card, styles.deviceData]}>
        <Text accessibilityRole="header" style={theme.heading}>
          Device data
        </Text>
        <Text style={theme.muted}>
          Accounts and savings are stored only on this device. Uninstalling the
          app removes them.
        </Text>
        <Text style={theme.body}>
          Reset permanently erases every local account, goal, and savings record
          on this device. This cannot be undone.
        </Text>
        {operation === 'reset' && !!error && (
          <Text
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={theme.error}
          >
            {error}
          </Text>
        )}
        <AppButton
          title="Reset all device data"
          variant="danger"
          disabled={busy}
          loading={busy && operation === 'reset'}
          onPress={() =>
            confirmAction(
              'Reset all app data?',
              'This will permanently remove ALL profiles, goals, and savings history from this device. This cannot be undone.',
              'Continue',
              () =>
                confirmAction(
                  'Permanently reset this device?',
                  'All local accounts and their records will be erased.',
                  'Reset Data',
                  () => performAction('reset'),
                ),
            )
          }
        />
      </View>
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  identityText: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    justifyContent: 'center',
    gap: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.4,
  },
  stacked: { flexDirection: 'column', alignItems: 'stretch' },
  unflex: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto' },
  section: { gap: 12 },
  deviceData: { borderColor: colors.danger },
  group: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },
  info: { padding: 16, gap: 4 },
});
