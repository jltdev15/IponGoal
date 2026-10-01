import React, { useEffect, useState } from 'react';
import { FlatList, ScrollView, Text, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParams, TabParams } from '../navigation/types';
import { useGoalStore } from '../stores/goalStore';
import { useSavingsStore } from '../stores/savingsStore';
import { ScreenContainer } from '../components/ScreenContainer';
import { FilterChip } from '../components/FilterChip';
import { AppInput } from '../components/AppInput';
import { AppButton } from '../components/AppButton';
import { EmptyState } from '../components/EmptyState';
import { SavingsListItem } from '../components/SavingsListItem';
import { theme } from '../theme/theme';
import { formatCurrency } from '../utils/currency';
import { formatDate, isValidDate, periodBounds } from '../utils/dates';
export function HistoryScreen() {
  const navigation =
      useNavigation<NativeStackNavigationProp<MainStackParams>>(),
    route = useRoute<RouteProp<TabParams, 'History'>>();
  const goals = useGoalStore(s => s.goals),
    savings = useSavingsStore(s => s.savings);
  const [period, setPeriod] = useState('All'),
    [goalId, setGoalId] = useState<string | undefined>(route.params?.goalId),
    [goalPicker, setGoalPicker] = useState(!!route.params?.goalId),
    [from, setFrom] = useState(''),
    [to, setTo] = useState(''),
    [range, setRange] = useState<{ from: string; to: string } | undefined>(),
    [error, setError] = useState('');
  useEffect(() => {
    setGoalId(route.params?.goalId);
    setGoalPicker(!!route.params?.goalId);
  }, [route.params]);
  const bounds =
    period === 'This Week'
      ? periodBounds('week')
      : period === 'This Month'
      ? periodBounds('month')
      : period === 'Date Range'
      ? range
      : undefined;
  const filtered = savings.filter(
    s =>
      (!goalId || s.goalId === goalId) &&
      (!bounds ||
        (s.transactionDate >= bounds.from && s.transactionDate <= bounds.to)),
  );
  return (
    <ScreenContainer scroll={false}>
      <FlatList
        contentContainerStyle={{ padding: 24, paddingBottom: 32 }}
        data={filtered}
        keyExtractor={s => s.id}
        ListHeaderComponent={
          <View style={{ gap: 20, marginBottom: 12 }}>
            <Text style={theme.title}>Every saving has a story</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {['All', 'This Week', 'This Month', 'Date Range'].map(p => (
                <FilterChip
                  key={p}
                  label={p}
                  selected={period === p}
                  onPress={() => {
                    setPeriod(p);
                    setError('');
                  }}
                />
              ))}
              <FilterChip
                label="By Goal"
                selected={goalPicker}
                onPress={() => setGoalPicker(!goalPicker)}
              />
            </ScrollView>
            {goalPicker && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                <FilterChip
                  label="All Goals"
                  selected={!goalId}
                  onPress={() => setGoalId(undefined)}
                />
                {goals.map(g => (
                  <FilterChip
                    key={g.id}
                    label={g.name}
                    selected={g.id === goalId}
                    onPress={() => setGoalId(g.id)}
                  />
                ))}
              </ScrollView>
            )}
            {period === 'Date Range' && (
              <View style={{ gap: 14 }}>
                <AppInput
                  label="From"
                  value={from}
                  onChangeText={setFrom}
                  placeholder="YYYY-MM-DD"
                  maxLength={10}
                />
                <AppInput
                  label="To"
                  value={to}
                  onChangeText={setTo}
                  placeholder="YYYY-MM-DD"
                  maxLength={10}
                />
                <AppButton
                  title="Apply Date Range"
                  variant="secondary"
                  onPress={() => {
                    if (!isValidDate(from) || !isValidDate(to) || from > to) {
                      setError('Enter valid dates, with From on or before To.');
                      return;
                    }
                    setError('');
                    setRange({ from, to });
                  }}
                />
                {!!error && (
                  <Text accessibilityRole="alert" style={theme.error}>
                    {error}
                  </Text>
                )}
              </View>
            )}
            <View style={{ gap: 6 }}>
              <Text style={theme.muted}>
                SAVED IN THIS VIEW
                {goalId
                  ? ` · ${
                      goals.find(g => g.id === goalId)?.name || 'Selected goal'
                    }`
                  : ''}
              </Text>
              <Text style={theme.amount}>
                {formatCurrency(
                  filtered.reduce((n, s) => n + s.amount, 0),
                  true,
                )}
              </Text>
              <Text style={theme.muted}>
                {filtered.length} savings entries
                {bounds
                  ? ` · ${formatDate(bounds.from, true)} – ${formatDate(
                      bounds.to,
                      true,
                    )}`
                  : ''}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <View>
            {(index === 0 ||
              filtered[index - 1].transactionDate.slice(0, 7) !==
                item.transactionDate.slice(0, 7)) && (
              <Text style={[theme.heading, { paddingTop: 20 }]}>
                {new Date(
                  `${item.transactionDate}T12:00:00`,
                ).toLocaleDateString('en-PH', {
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            )}
            <SavingsListItem
              saving={item}
              onPress={() =>
                navigation.navigate('SavingsDetails', { savingId: item.id })
              }
            />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="history"
            title="No savings entries here yet."
            body="Try another filter or record savings toward your goals."
            action="Go to Goals"
            onPress={() =>
              navigation.navigate('BottomTabs', { screen: 'Home' })
            }
          />
        }
      />
    </ScreenContainer>
  );
}
