import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParams } from '../navigation/types';
import { useAuthStore } from '../stores/authStore';
import { useGoalStore } from '../stores/goalStore';
import {
  createGoal,
  updateGoal,
} from '../database/repositories/goalRepository';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppInput } from '../components/AppInput';
import { AmountInput } from '../components/AmountInput';
import { AppButton } from '../components/AppButton';
import { EmptyState } from '../components/EmptyState';
import { FilterChip } from '../components/FilterChip';
import { Icon } from '../components/Icon';
import { theme } from '../theme/theme';
import { categories } from '../data/categories';
import { amountInputValue, toCentavos } from '../utils/currency';
import { useFormAction } from '../services/useFormAction';
import { refreshData } from '../services/refresh';
type Props = NativeStackScreenProps<MainStackParams, 'CreateGoal' | 'EditGoal'>;
export function GoalFormScreen({ route, navigation }: Props) {
  const id =
    route.params && 'goalId' in route.params ? route.params.goalId : undefined;
  const goal = useGoalStore(s => s.goals.find(g => g.id === id)),
    user = useAuthStore(s => s.user)!;
  const [name, setName] = useState(goal?.name || ''),
    [target, setTarget] = useState(
      goal ? amountInputValue(goal.targetAmount) : '',
    ),
    [starting, setStarting] = useState('0'),
    [date, setDate] = useState(goal?.targetDate || ''),
    [category, setCategory] = useState(goal?.category || 'Electronics'),
    [note, setNote] = useState(goal?.note || '');
  const { busy, error, run } = useFormAction();
  if (id && !goal) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Goal not found."
          body="This goal may have been removed."
          action="Go Back"
          onPress={() => navigation.goBack()}
        />
      </ScreenContainer>
    );
  }
  return (
    <ScreenContainer>
      <Text style={theme.title}>
        {id ? 'Make your goal work for you' : 'What are you saving for?'}
      </Text>
      <Text style={theme.muted}>
        A clear, realistic goal makes it easier to save little by little.
      </Text>
      <AppInput
        label="Goal Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. New Phone"
        maxLength={80}
      />
      <AmountInput
        label="Target Amount"
        value={target}
        onChangeText={setTarget}
        helper="The total amount you want to save."
      />
      {!id && (
        <AmountInput
          label="Starting Amount"
          value={starting}
          onChangeText={setStarting}
          helper="Already saved something? Start with that amount."
        />
      )}
      <AppInput
        label="Target Date (optional)"
        value={date}
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
        keyboardType="numbers-and-punctuation"
        maxLength={10}
        helper="Leave blank if you don't have a deadline."
      />
      <View style={{ gap: 12 }}>
        <Text style={theme.body}>Category & icon</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {categories.map(c => (
            <View
              key={c.name}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Icon name={c.icon} size={18} />
              <FilterChip
                label={c.name}
                selected={category === c.name}
                onPress={() => setCategory(c.name)}
              />
            </View>
          ))}
        </View>
      </View>
      <AppInput
        label="Note (optional)"
        value={note}
        onChangeText={setNote}
        multiline
        placeholder="Why is this goal meaningful to you?"
      />
      {!!error && (
        <Text accessibilityRole="alert" style={theme.error}>
          {error}
        </Text>
      )}
      <AppButton
        title={id ? 'Save Changes' : 'Create Goal'}
        loading={busy}
        onPress={() => {
          void run(() => {
            const input = {
              name,
              targetAmount: toCentavos(target),
              targetDate: date.trim() || null,
              category,
              icon: categories.find(c => c.name === category)!.icon,
              note,
            };
            if (id) {
              updateGoal(user.id, id, input);
              refreshData(user.id);
              navigation.goBack();
            } else {
              const startingAmount = toCentavos(starting || '0'),
                goalId = createGoal(user.id, input, startingAmount);
              refreshData(user.id);
              navigation.replace('GoalDetails', { goalId });
              if (startingAmount >= input.targetAmount) {
                Alert.alert(
                  'Goal Reached!',
                  'Your starting savings already meet this target. Your goal has been marked as completed.',
                );
              }
            }
          }, 'Unable to save your goal. Please try again.');
        }}
      />
    </ScreenContainer>
  );
}
