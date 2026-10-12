import React from 'react';
import { Text, View } from 'react-native';
import { theme } from '../../theme/theme';
import { formatCurrency } from '../../utils/currency';
import { GameReview } from '../GameReview';
import {
  BUDGET_CATEGORIES,
  BudgetAnswer,
  DAILY_BUDGET,
  SAVINGS_TARGET,
  budgetSummary,
} from './BudgetChallengeSession';

export function BudgetChallengeResult({
  answers,
}: {
  answers: readonly BudgetAnswer[];
}) {
  const summary = budgetSummary(answers);
  const complete = !summary.shortfall && !summary.unmetNeeds.length;
  return (
    <>
      <Text accessibilityRole="header" style={theme.title}>
        Budget Challenge Complete
      </Text>
      <View style={theme.card}>
        <Text style={theme.heading}>
          {complete
            ? 'Your plan fits your allowance'
            : 'Your plan needs an adjustment'}
        </Text>
        <Text style={theme.body}>
          {complete
            ? 'All three essential needs are covered.'
            : summary.shortfall
            ? 'Over budget by ' + formatCurrency(summary.shortfall, true) + '.'
            : 'Unfunded needs: ' +
              summary.unmetNeeds.map(c => c.title).join(', ') +
              '.'}
        </Text>
        <Text style={theme.body}>
          Planned savings: {formatCurrency(summary.plannedSavings, true)}
        </Text>
        <Text style={theme.body}>
          Savings affordable after spending:{' '}
          {formatCurrency(summary.affordableSavings, true)}
        </Text>
        <Text style={theme.muted}>
          {complete && summary.affordableSavings >= SAVINGS_TARGET
            ? 'Your ₱60 savings target fits too.'
            : 'Cover essentials and stay within ₱300 before setting savings aside.'}
        </Text>
      </View>
      <Text style={theme.body}>
        Cover needs first, then balance treats and savings. More than one plan
        can work.
      </Text>
      <GameReview>
        <View style={theme.card}>
          <Text style={theme.heading}>Your ₱300 plan</Text>
          <Text style={theme.body}>
            Allowance: {formatCurrency(DAILY_BUDGET, true)}
          </Text>
          <Text style={theme.body}>
            Spending: {formatCurrency(summary.spending, true)}
          </Text>
          <Text style={theme.body}>
            {summary.shortfall
              ? 'Over budget by ' + formatCurrency(summary.shortfall, true)
              : 'Not assigned yet: ' + formatCurrency(summary.remaining, true)}
          </Text>
          <Text style={theme.body}>
            Essential needs covered: {3 - summary.unmetNeeds.length} / 3
          </Text>
          {summary.unmetNeeds.length > 0 && (
            <Text style={theme.body}>
              Unfunded: {summary.unmetNeeds.map(c => c.title).join(', ')}
            </Text>
          )}
        </View>
        {answers.map(answer => {
          const category = BUDGET_CATEGORIES.find(
            c => c.id === answer.categoryId,
          )!;
          const option = category.options[answer.optionIndex];
          return (
            <View key={category.id} style={theme.card}>
              <Text style={theme.heading}>{category.title}</Text>
              <Text style={theme.body}>You chose: {option.label}</Text>
              <Text style={theme.body}>
                Set aside: {formatCurrency(answer.amount, true)}
              </Text>
              <Text style={theme.body}>{option.explanation}</Text>
            </View>
          );
        })}
        <Text style={theme.body}>
          One balanced plan: ₱50 transport + ₱100 lunch + ₱40 materials + ₱50
          snack + ₱60 savings = ₱300. Skipping the snack could leave ₱110 for
          savings.
        </Text>
      </GameReview>
      <Text style={theme.muted}>Practice only. No real money was moved.</Text>
    </>
  );
}
