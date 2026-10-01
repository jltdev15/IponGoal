import React from 'react';
import { Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { theme } from '../../theme/theme';
import { formatCurrency } from '../../utils/currency';
import {
  GoalBuilderSession,
  PRACTICE_GOALS,
  STARTING_SAVINGS,
  weeksToGoal,
} from './GoalBuilderSession';
export function GoalBuilderResult({
  session,
  onAgain,
  onExit,
}: {
  session: GoalBuilderSession;
  onAgain: () => void;
  onExit: () => void;
}) {
  const goal = PRACTICE_GOALS.find(g => g.id === session.goalId)!;
  const initialWeeks = weeksToGoal(
    session.target,
    STARTING_SAVINGS,
    session.weekly,
  );
  const remainingWeeks = weeksToGoal(
    session.target,
    session.savings,
    session.weekly,
  );
  const total = (key: 'spending' | 'reserve' | 'unallocated') =>
    session.answers.reduce((sum, a) => sum + a[key], 0);
  const unmet = session.answers.filter(
    a => a.event.id !== 'treat' && !a.option.thoughtful,
  );
  return (
    <>
      <Text accessibilityRole="header" style={theme.title}>
        Goal Builder Complete
      </Text>
      <View style={theme.card}>
        <Text style={theme.heading}>Practice goal: {goal.title}</Text>
        <Text style={theme.body}>Target: {formatCurrency(session.target)}</Text>
        <Text style={theme.body}>
          Usual weekly contribution: {formatCurrency(session.weekly)}
        </Text>
        <Text style={theme.body}>
          Practice goal savings: {formatCurrency(STARTING_SAVINGS)} →{' '}
          {formatCurrency(session.savings)}
        </Text>
        <Text style={theme.body}>
          Remaining to goal:{' '}
          {formatCurrency(Math.max(0, session.target - session.savings))}
        </Text>
        <Text style={theme.body}>Original estimate: {initialWeeks} weeks</Text>
        <Text style={theme.body}>
          Updated estimate: {remainingWeeks} more weeks after these 3 practice
          weeks
        </Text>
        <Text style={theme.body}>
          Practice spending over 3 weeks: {formatCurrency(total('spending'))}
        </Text>
        <Text style={theme.body}>
          Separate reserve allocations: {formatCurrency(total('reserve'))}
        </Text>
        <Text style={theme.body}>
          Unallocated money: {formatCurrency(total('unallocated'))}
        </Text>
      </View>
      <Text style={theme.body}>
        {unmet.length
          ? `Unfunded essential needs: ${unmet
              .map(a => a.event.title)
              .join(
                ', ',
              )}. A faster timeline does not make this a complete plan.`
          : 'The extra school materials and necessary repair were funded.'}
      </Text>
      <Text accessibilityRole="header" style={theme.heading}>
        What your plan teaches
      </Text>
      <Text style={theme.body}>
        A clear target and an affordable contribution help you plan. Essential
        expenses can reduce savings, and a modest want can fit. Adjusting the
        timeline is responsible; an estimate is not a deadline or a guarantee.
      </Text>
      <Text style={theme.body}>
        The updated estimate assumes your usual weekly contribution resumes,
        with no further withdrawals or extra income. It rounds up to whole
        weeks. Unallocated money and reserves are not counted toward the goal.
      </Text>
      <AppButton title="Build Another Goal" onPress={onAgain} />
      <AppButton title="Back to Games" variant="secondary" onPress={onExit} />
      <Text accessibilityRole="header" style={theme.heading}>
        Review the three practice weeks
      </Text>
      {session.answers.map(answer => (
        <View key={answer.event.id} style={theme.card}>
          <Text style={theme.heading}>{answer.event.title}</Text>
          <Text style={theme.body}>You chose: {answer.option.label}</Text>
          <Text style={theme.body}>{answer.option.explanation}</Text>
          <Text style={theme.body}>
            Goal contribution: {formatCurrency(answer.contribution)}
          </Text>
          <Text style={theme.body}>
            Goal savings: {formatCurrency(answer.savingsBefore)} →{' '}
            {formatCurrency(answer.savingsAfter)}
          </Text>
        </View>
      ))}
      <Text style={theme.muted}>
        This fictional goal was never added to your real goals. Nothing was
        saved to your account.
      </Text>
    </>
  );
}
