import React from 'react';
import { Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { theme } from '../../theme/theme';
import { formatCurrency } from '../../utils/currency';
import { SaveOrSpendAnswer } from './SaveOrSpendSession';
export function SaveOrSpendResult({
  answers,
  onAgain,
}: {
  answers: readonly SaveOrSpendAnswer[];
  onAgain: () => void;
}) {
  return (
    <>
      <Text accessibilityRole="header" style={theme.title}>
        Save or Spend Complete
      </Text>
      <Text style={theme.heading}>
        Thoughtful choices: {answers.filter(a => a.option.thoughtful).length} /{' '}
        {answers.length}
      </Text>
      <Text style={theme.body}>
        Every choice is a chance to learn. Cover essential needs, compare
        optional purchases with your goals, and allow affordable wants when they
        fit your plan.
      </Text>
      <Text style={theme.body}>
        Saving part of an allowance can work alongside responsible spending.
        Using savings for a necessary expense can also be thoughtful.
      </Text>
      <Text style={theme.muted}>
        These were five separate examples. Their balances are not combined into
        a wallet, and no real money was moved.
      </Text>
      <AppButton title="Play Again" onPress={onAgain} />
      <Text accessibilityRole="header" style={theme.heading}>
        Review your choices
      </Text>
      {answers.map(answer => (
        <View key={answer.scenario.id} style={theme.card}>
          <Text style={theme.heading}>{answer.scenario.title}</Text>
          <Text style={theme.body}>You chose: {answer.option.label}</Text>
          <Text style={theme.body}>{answer.option.explanation}</Text>
          <Text style={theme.body}>
            Practice savings: {formatCurrency(answer.scenario.savingsBefore)} →{' '}
            {formatCurrency(answer.savingsAfter)}
          </Text>
          <Text style={theme.body}>
            Practice spending: {formatCurrency(answer.option.outcome.spending)}
          </Text>
        </View>
      ))}
    </>
  );
}
