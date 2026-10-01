import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Archive, BadgeCheck, Info } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParams } from '../navigation/types';
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
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParams>>();
  const user = useAuthStore(s => s.user)!;
  const logout = useAuthStore(s => s.logout);
  const reset = useAuthStore(s => s.reset);
  const goals = useGoalStore(s => s.goals);
  const entries = useSavingsStore(s => s.savings);
  const { busy, error, run } = useFormAction();
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 380 || fontScale > 1.2;
  const active = goals.filter(g => g.status === 'active').length;
  const completed = goals.filter(g => g.status === 'completed').length;
  const archived = goals.filter(g => g.status === 'archived').length;
  return (
    <ScreenContainer>
      <View style={theme.card}>
        <View style={[styles.identity, stacked && styles.stacked]}>
          <ProfileAvatar
            fullName={user.fullName}
            photo={user.profilePhoto}
            size={72}
          />
          <View style={[styles.identityText, stacked && styles.unflex]}>
            <Text accessibilityRole="header" style={theme.title}>
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
      <View style={theme.card}>
        <Text accessibilityRole="header" style={theme.heading}>
          Total recorded savings
        </Text>
        <Text style={theme.amount}>
          {formatCurrency(
            entries.reduce((sum, entry) => sum + entry.amount, 0),
            true,
          )}
        </Text>
        <Text style={theme.muted}>
          Includes savings recorded for active, completed, and archived goals.
        </Text>
        <View style={[styles.counts, stacked && styles.stacked]}>
          <View style={[styles.count, stacked && styles.unflex]}>
            <Text style={styles.number}>{active}</Text>
            <Text style={theme.muted}>Active goals</Text>
          </View>
          <View style={[styles.count, stacked && styles.unflex]}>
            <Text style={styles.number}>{completed}</Text>
            <Text style={theme.muted}>Completed goals</Text>
          </View>
        </View>
      </View>
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
      <View style={styles.section}>
        <AppButton
          title="Log out"
          variant="secondary"
          disabled={busy}
          onPress={() => {
            void run(logout, 'Unable to log out. Please try again.');
          }}
        />
        <Text style={theme.muted}>
          Logging out keeps your recorded goals and savings on this device.
        </Text>
      </View>
      <View style={theme.card}>
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
        <AppButton
          title="Reset all device data"
          variant="danger"
          disabled={busy}
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
                  () => {
                    void run(
                      reset,
                      'Unable to reset your data. Please try again.',
                    );
                  },
                ),
            )
          }
        />
      </View>
      {!!error && (
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={theme.error}
        >
          {error}
        </Text>
      )}
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  identityText: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    gap: 4,
  },
  stacked: { flexDirection: 'column', alignItems: 'stretch' },
  unflex: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto' },
  counts: { flexDirection: 'row', gap: 12 },
  count: {
    flex: 1,
    padding: 12,
    gap: 4,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
  },
  number: { fontSize: 22, fontWeight: '700', color: colors.text },
  section: { gap: 12 },
  group: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },
  info: { padding: 16, gap: 4 },
});
