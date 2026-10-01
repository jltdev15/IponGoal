import React from 'react';
import { FlatList, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParams } from '../navigation/types';
import { useAuthStore } from '../stores/authStore';
import { useGoalStore } from '../stores/goalStore';
import { useSavingsStore } from '../stores/savingsStore';
import { ScreenContainer } from '../components/ScreenContainer';
import { GoalCard } from '../components/GoalCard';
import { EmptyState } from '../components/EmptyState';
import { AppButton } from '../components/AppButton';
import { SectionHeader } from '../components/SectionHeader';
import { FinancialTipCard } from '../components/FinancialTipCard';
import { theme } from '../theme/theme';
import { formatCurrency } from '../utils/currency';
export function HomeScreen() {
  const navigation =
      useNavigation<NativeStackNavigationProp<MainStackParams>>(),
    user = useAuthStore(s => s.user)!;
  const goals = useGoalStore(s => s.goals),
    savings = useSavingsStore(s => s.savings);
  const active = goals.filter(g => g.status === 'active'),
    total = savings.reduce((n, s) => n + s.amount, 0),
    completed = goals.filter(g => g.status === 'completed').length;
  const hour = new Date().getHours(),
    greeting =
      hour < 12
        ? 'Good morning'
        : hour < 18
        ? 'Good afternoon'
        : 'Good evening';
  return (
    <ScreenContainer scroll={false}>
      <FlatList
        contentContainerStyle={{ padding: 24, gap: 18, paddingBottom: 32 }}
        data={active}
        keyExtractor={g => g.id}
        ListHeaderComponent={
          <View style={{ gap: 24 }}>
            <View style={{ gap: 6 }}>
              <Text style={theme.title}>
                {greeting}, {user.fullName.split(' ')[0]}
              </Text>
              <Text style={theme.muted}>Small savings add up.</Text>
            </View>
            <View style={{ gap: 12, paddingVertical: 8 }}>
              <Text style={theme.muted}>TOTAL SAVINGS</Text>
              <Text style={theme.amount}>{formatCurrency(total, true)}</Text>
              <Text style={theme.body}>
                {active.length} active goals · {completed} completed
              </Text>
            </View>
            <SectionHeader
              title="Your Goals"
              action="Completed"
              onPress={() => navigation.navigate('CompletedGoals')}
            />
          </View>
        }
        renderItem={({ item }) => (
          <GoalCard
            goal={item}
            onOpen={() =>
              navigation.navigate('GoalDetails', { goalId: item.id })
            }
            onAdd={() => navigation.navigate('AddSavings', { goalId: item.id })}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            compact
            title={
              goals.length
                ? 'Ready for your next goal?'
                : "You don't have a savings goal yet."
            }
            body={
              goals.length
                ? 'Your earlier goals are saved. Set a new goal and keep building your habits.'
                : 'Create your first goal and start building your savings little by little.'
            }
            action={goals.length ? 'Create New Goal' : 'Create My First Goal'}
            onPress={() => navigation.navigate('CreateGoal')}
          />
        }
        ListFooterComponent={
          <View style={{ gap: 24, marginTop: 8 }}>
            {active.length > 0 && (
              <AppButton
                title="+ Create New Goal"
                onPress={() => navigation.navigate('CreateGoal')}
              />
            )}
            <FinancialTipCard />
            <AppButton
              title="Learning Games"
              variant="secondary"
              onPress={() => navigation.navigate('Games')}
            />
          </View>
        }
      />
    </ScreenContainer>
  );
}
