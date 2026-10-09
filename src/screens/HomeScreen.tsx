import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowRight,
  CircleCheck,
  Flag,
  Gamepad2,
  Lightbulb,
} from 'lucide-react-native';
import { MainStackParams } from '../navigation/types';
import { useAuthStore } from '../stores/authStore';
import { useGoalStore } from '../stores/goalStore';
import { useSavingsStore } from '../stores/savingsStore';
import { ScreenContainer } from '../components/ScreenContainer';
import { HomeGoalRow } from '../components/HomeGoalRow';
import {
  PrimaryScreenHeader,
  primaryStyles,
  usePrimaryScreenLayout,
} from '../components/PrimaryScreen';
import { SavingsSummary, summaryStyles } from '../components/SavingsSummary';
import { financialTips } from '../data/financialTips';
import { theme } from '../theme/theme';
import { colors } from '../theme/colors';
import { formatCurrency } from '../utils/currency';

export function HomeScreen() {
  const { contentStyle, stacked } = usePrimaryScreenLayout();
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParams>>();
  const user = useAuthStore(s => s.user)!;
  const goals = useGoalStore(s => s.goals);
  const savings = useSavingsStore(s => s.savings);
  const active = goals.filter(g => g.status === 'active');
  const total = savings.reduce((n, s) => n + s.amount, 0);
  const totalLabel = formatCurrency(total, true);
  const completed = goals.filter(g => g.status === 'completed').length;
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <ScreenContainer scroll={false} bottomSafeArea={false}>
      <FlatList
        style={primaryStyles.list}
        contentContainerStyle={[contentStyle, { gap: 12 }]}
        data={active}
        keyExtractor={g => g.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <PrimaryScreenHeader
              title={user.fullName.trim().split(/\s+/)[0]}
              subtitle={greeting + ','}
              profileShortcut
            />
            <SavingsSummary
              label="Saved so far"
              amount={totalLabel}
              stacked={stacked}
              note="Recorded across all your goals, including completed and archived ones."
            >
              <View style={[summaryStyles.counts, stacked && styles.stacked]}>
                <View
                  style={[
                    summaryStyles.countChip,
                    stacked && summaryStyles.unflex,
                  ]}
                >
                  <View
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                  >
                    <Flag size={16} color={colors.white} strokeWidth={1.8} />
                  </View>
                  <Text style={summaryStyles.countText}>
                    <Text style={summaryStyles.countNumber}>
                      {active.length}
                    </Text>{' '}
                    in progress
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`View completed goals, ${completed} completed`}
                  onPress={() => navigation.navigate('CompletedGoals')}
                  style={({ pressed }) => [
                    summaryStyles.countChip,
                    summaryStyles.actionChip,
                    stacked && summaryStyles.unflex,
                    pressed && styles.pressed,
                  ]}
                >
                  <View
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                  >
                    <CircleCheck
                      size={16}
                      color={colors.white}
                      strokeWidth={1.8}
                    />
                  </View>
                  <Text style={summaryStyles.countText}>
                    <Text style={summaryStyles.countNumber}>{completed}</Text>{' '}
                    completed
                  </Text>
                </Pressable>
              </View>
            </SavingsSummary>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Explore learning games"
              onPress={() => navigation.navigate('Games')}
              style={({ pressed }) => [
                primaryStyles.card,
                styles.games,
                pressed && styles.pressed,
              ]}
            >
              <View
                style={styles.gamesIcon}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <Gamepad2 size={24} color={colors.primary} strokeWidth={1.8} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.gamesTitle}>Learning games</Text>
                <Text style={theme.muted}>
                  Practice everyday money choices.
                </Text>
              </View>
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <ArrowRight
                  size={20}
                  color={colors.primary}
                  strokeWidth={1.8}
                />
              </View>
            </Pressable>
            <View style={[styles.goalsHeading, stacked && styles.stacked]}>
              <Text
                accessibilityRole="header"
                style={[theme.heading, styles.flex, stacked && { flex: 0 }]}
              >
                Your savings goals
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="View all goals"
                onPress={() => navigation.navigate('AllGoals')}
                style={({ pressed }) => [
                  styles.allGoalsButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.allGoalsLabel}>View all goals</Text>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <HomeGoalRow
            goal={item}
            onOpen={() =>
              navigation.navigate('GoalDetails', { goalId: item.id })
            }
            onAdd={() => navigation.navigate('AddSavings', { goalId: item.id })}
          />
        )}
        ListEmptyComponent={
          <View style={[primaryStyles.card, styles.empty]}>
            <View
              style={styles.emptyIcon}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <Flag size={26} color={colors.primary} strokeWidth={1.8} />
            </View>
            <Text accessibilityRole="header" style={styles.emptyTitle}>
              {goals.length
                ? 'Ready for another goal?'
                : 'Start your first savings goal'}
            </Text>
            <Text style={styles.emptyBody}>
              {goals.length
                ? 'Tap + below to start something new.'
                : 'Tap + below to choose what you’re saving for.'}
            </Text>
          </View>
        }
        ListFooterComponent={
          <View style={[primaryStyles.card, styles.tip]}>
            <View style={styles.tipHeading}>
              <View
                style={styles.tipIcon}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <Lightbulb size={20} color={colors.text} strokeWidth={1.8} />
              </View>
              <Text
                accessibilityRole="header"
                style={[styles.tipTitle, styles.flex]}
              >
                Saving tip
              </Text>
            </View>
            <Text style={theme.muted}>
              {financialTips[now.getDate() % financialTips.length]}
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  header: { gap: 16 },
  goalsHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  allGoalsButton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  allGoalsLabel: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.75 },
  games: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gamesIcon: {
    padding: 10,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
  },
  gamesTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  empty: {
    gap: 10,
  },
  emptyIcon: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    padding: 12,
    borderRadius: 16,
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  emptyBody: { fontSize: 14, lineHeight: 22, color: colors.muted },
  stacked: { flexDirection: 'column', alignItems: 'stretch' },
  tip: {
    gap: 8,
    marginTop: 4,
  },
  tipIcon: {
    backgroundColor: colors.goldSoft,
    borderRadius: 12,
    padding: 8,
  },
  tipTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  tipHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
