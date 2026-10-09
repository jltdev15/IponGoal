import React from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParams } from '../navigation/types';
import { useGoalStore } from '../stores/goalStore';
import { useSavingsStore } from '../stores/savingsStore';
import { ScreenContainer } from '../components/ScreenContainer';
import {
  PrimaryScreenHeader,
  primaryStyles,
  usePrimaryScreenLayout,
} from '../components/PrimaryScreen';
import { SavingsSummary } from '../components/SavingsSummary';
import { StatCard } from '../components/StatCard';
import { WeeklyChart } from '../components/WeeklyChart';
import { EmptyState } from '../components/EmptyState';
import { theme } from '../theme/theme';
import { statistics } from '../utils/calculations';
import { formatCurrency } from '../utils/currency';

export function StatisticsScreen() {
  const { contentStyle, stacked } = usePrimaryScreenLayout();
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParams>>();
  const goals = useGoalStore(s => s.goals);
  const savings = useSavingsStore(s => s.savings);
  const stats = statistics(goals, savings);
  return (
    <ScreenContainer
      bottomSafeArea={false}
      contentContainerStyle={contentStyle}
    >
      <PrimaryScreenHeader
        title="Statistics"
        subtitle="See your habits grow"
        profileShortcut
      />
      <SavingsSummary
        label="Total savings"
        amount={formatCurrency(stats.total, true)}
        stacked={stacked}
        note="Recorded across all your goals, including completed and archived ones."
      />
      {!stats.count ? (
        <View style={primaryStyles.card}>
          <EmptyState
            compact
            icon="statistics"
            title="No savings data yet."
            body="Start adding savings and your statistics will appear here."
            action="Go to Goals"
            onPress={() =>
              navigation.navigate('BottomTabs', { screen: 'Home' })
            }
          />
        </View>
      ) : (
        <>
          <View style={{ gap: 12 }}>
            <Text accessibilityRole="header" style={theme.heading}>
              Savings overview
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <StatCard
                label="This month"
                value={formatCurrency(stats.month, true)}
                stacked={stacked}
              />
              <StatCard
                label="This week"
                value={formatCurrency(stats.week, true)}
                stacked={stacked}
              />
              <StatCard
                label="Average entry"
                value={formatCurrency(stats.average)}
                stacked={stacked}
              />
              <StatCard
                label="Savings entries"
                value={stats.count}
                stacked={stacked}
              />
              <StatCard
                label="Active goals"
                value={stats.active}
                stacked={stacked}
              />
              <StatCard
                label="Completed goals"
                value={stats.completed}
                stacked={stacked}
              />
            </View>
          </View>
          <WeeklyChart buckets={stats.buckets} />
          <View style={primaryStyles.card}>
            <Text accessibilityRole="header" style={theme.heading}>
              Your saving habits
            </Text>
            <Text style={theme.body}>
              You've saved {formatCurrency(stats.month, true)} this month across{' '}
              {stats.monthCount} entries.
            </Text>
            {stats.mostGoal && (
              <Text style={theme.body}>
                You have saved the most toward {stats.mostGoal}.
              </Text>
            )}
            <Text style={theme.muted}>
              Calculated from your records. This week starts on Monday. Archived
              goals remain included in savings totals.
            </Text>
          </View>
        </>
      )}
    </ScreenContainer>
  );
}
