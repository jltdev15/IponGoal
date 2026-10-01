import React from 'react';
import { FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParams } from '../navigation/types';
import { useGoalStore } from '../stores/goalStore';
import { ScreenContainer } from '../components/ScreenContainer';
import { GoalCard } from '../components/GoalCard';
import { EmptyState } from '../components/EmptyState';
export function GoalCollectionScreen({
  route,
  navigation,
}: NativeStackScreenProps<
  MainStackParams,
  'CompletedGoals' | 'ArchivedGoals'
>) {
  const archived = route.name === 'ArchivedGoals',
    goals = useGoalStore(s => s.goals).filter(
      g => g.status === (archived ? 'archived' : 'completed'),
    );
  return (
    <ScreenContainer scroll={false}>
      <FlatList
        contentContainerStyle={{ padding: 24, gap: 18 }}
        data={goals}
        keyExtractor={g => g.id}
        renderItem={({ item }) => (
          <GoalCard
            goal={item}
            onOpen={() =>
              navigation.navigate('GoalDetails', { goalId: item.id })
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon={archived ? 'archive' : 'check'}
            title={
              archived
                ? 'No archived goals.'
                : 'Your first completed goal is ahead.'
            }
            body={
              archived
                ? 'Archived goals keep their savings history. You can restore them from their details.'
                : 'Keep saving little by little. Your accomplishments will appear here.'
            }
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
