import React from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParams } from '../navigation/types';
import { useGoalStore } from '../stores/goalStore';
import { useSavingsStore } from '../stores/savingsStore';
import { ScreenContainer } from '../components/ScreenContainer';
import { StatCard } from '../components/StatCard';
import { WeeklyChart } from '../components/WeeklyChart';
import { EmptyState } from '../components/EmptyState';
import { theme } from '../theme/theme';
import { statistics } from '../utils/calculations';
import { formatCurrency } from '../utils/currency';
export function StatisticsScreen() {
  const navigation =
      useNavigation<NativeStackNavigationProp<MainStackParams>>(),
    goals = useGoalStore(s => s.goals),
    savings = useSavingsStore(s => s.savings),
    stats = statistics(goals, savings);
  if (!stats.count) {
    return (
      <ScreenContainer>
        <EmptyState
          icon="statistics"
          title="No savings data yet."
          body="Start adding savings and your statistics will appear here."
          action="Go to Goals"
          onPress={() => navigation.navigate('BottomTabs', { screen: 'Home' })}
        />
      </ScreenContainer>
    );
  }
  return (
    <ScreenContainer>
      <Text style={theme.title}>See your habits grow</Text>
      <View style={{ gap: 8 }}>
        <Text style={theme.muted}>TOTAL SAVINGS</Text>
        <Text style={theme.amount}>{formatCurrency(stats.total, true)}</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <StatCard
          label="This month"
          value={formatCurrency(stats.month, true)}
        />
        <StatCard label="This week" value={formatCurrency(stats.week, true)} />
        <StatCard label="Average entry" value={formatCurrency(stats.average)} />
        <StatCard label="Savings entries" value={stats.count} />
        <StatCard label="Active goals" value={stats.active} />
        <StatCard label="Completed goals" value={stats.completed} />
      </View>
      <WeeklyChart buckets={stats.buckets} />
      <View style={{ gap: 14 }}>
        <Text style={theme.heading}>Your saving habits</Text>
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
    </ScreenContainer>
  );
}
