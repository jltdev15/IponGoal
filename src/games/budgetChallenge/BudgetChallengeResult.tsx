import React from 'react';
import { Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { theme } from '../../theme/theme';
import { formatCurrency } from '../../utils/currency';
import {
  BUDGET_CATEGORIES,
  BudgetAnswer,
  DAILY_BUDGET,
  SAVINGS_TARGET,
  budgetSummary,
} from './BudgetChallengeSession';
export function BudgetChallengeResult({
  answers,
  onAgain,
  onExit,
}: {
  answers: readonly BudgetAnswer[];
  onAgain: () => void;
  onExit: () => void;
}) {
  const summary = budgetSummary(answers);
  const complete = !summary.shortfall && !summary.unmetNeeds.length;
  return (
    <>
      <Text accessibilityRole="header" style={theme.title}>
        Budget Challenge Complete
      </Text>
      <Text style={theme.body}>
        {complete
          ? 'Your plan covers essential needs within the allowance.'
          : 'Every plan is a chance to learn. Review the gaps, then try another combination.'}
      </Text>
      <View style={theme.card}>
        <Text style={theme.heading}>
          Fictional daily allowance: {formatCurrency(DAILY_BUDGET)}
        </Text>
        <Text style={theme.body}>
          Planned spending: {formatCurrency(summary.spending)}
        </Text>
        <Text style={theme.body}>
          Planned savings: {formatCurrency(summary.plannedSavings)}
        </Text>
        <Text style={theme.body}>
          Savings affordable after spending:{' '}
          {formatCurrency(summary.affordableSavings)}
        </Text>
        <Text style={theme.body}>
          {summary.shortfall
            ? `Plan shortfall: ${formatCurrency(summary.shortfall)}`
            : `Unallocated: ${formatCurrency(summary.remaining)}`}
        </Text>
        <Text style={theme.body}>
          Essential needs covered: {3 - summary.unmetNeeds.length} / 3
        </Text>
        <Text style={theme.body}>
          {summary.unmetNeeds.length
            ? `Unfunded needs: ${summary.unmetNeeds
                .map(c => c.title)
                .join(', ')}`
            : 'Transportation, lunch, and required materials are funded.'}
        </Text>
        <Text style={theme.body}>
          {complete && summary.affordableSavings >= SAVINGS_TARGET
            ? 'The ₱60 savings target fits your complete plan.'
            : 'The ₱60 savings target needs a plan that also covers essentials and fits the allowance.'}
        </Text>
      </View>
      <Text accessibilityRole="header" style={theme.heading}>
        Learning takeaways
      </Text>
      <Text style={theme.body}>
        Fund essentials first. Check how upgrades affect later priorities. A
        budgeted want can fit: ₱50 transport + ₱100 lunch + ₱40 materials + ₱50
        snack + ₱60 savings = ₱300.
      </Text>
      <Text style={theme.body}>
        Skipping the snack could allow ₱110 savings. Savings are not always the
        first priority: an unfunded essential still needs attention. Unallocated
        money needs a purpose.
      </Text>
      <AppButton title="Play Again" onPress={onAgain} />
      <AppButton title="Back to Games" variant="secondary" onPress={onExit} />
      <Text accessibilityRole="header" style={theme.heading}>
        Review your choices
      </Text>
      {answers.map(answer => {
        const category = BUDGET_CATEGORIES.find(
          c => c.id === answer.categoryId,
        )!;
        const option = category.options[answer.optionIndex];
        return (
          <View key={category.id} style={theme.card}>
            <Text style={theme.heading}>{category.title}</Text>
            <Text style={theme.body}>
              {option.label}: {formatCurrency(answer.amount)}
            </Text>
            <Text style={theme.body}>{option.explanation}</Text>
          </View>
        );
      })}
      <Text style={theme.muted}>
        These are planned practice allocations. No real money was moved.
      </Text>
    </>
  );
}
