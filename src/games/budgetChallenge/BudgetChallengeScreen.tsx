import React, { useEffect, useReducer } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParams } from '../../navigation/types';
import { AppButton } from '../../components/AppButton';
import { ScreenContainer } from '../../components/ScreenContainer';
import { theme } from '../../theme/theme';
import { formatCurrency } from '../../utils/currency';
import {
  BUDGET_CATEGORIES,
  DAILY_BUDGET,
  budgetFeedback,
  budgetReducer,
  budgetSummary,
  newBudgetSession,
} from './BudgetChallengeSession';
import { BudgetChallengeResult } from './BudgetChallengeResult';
import { GameTextAction } from '../GameReview';

export function BudgetChallengeScreen({
  navigation,
}: NativeStackScreenProps<MainStackParams, 'BudgetChallenge'>) {
  const [session, dispatch] = useReducer(
    budgetReducer,
    undefined,
    newBudgetSession,
  );
  const category = BUDGET_CATEGORIES[session.index];
  const summary = budgetSummary(session.answers);
  const answer = session.answers[session.index];
  const feedback = session.phase === 'feedback' ? budgetFeedback(session) : '';
  const restart = () => dispatch({ type: 'restart' });
  useEffect(() => {
    if (session.phase === 'question') {
      AccessibilityInfo.announceForAccessibility(
        `Choice ${session.index + 1} of 5. ${category.title}. ${
          category.context
        }`,
      );
    } else if (session.phase === 'feedback') {
      AccessibilityInfo.announceForAccessibility(feedback);
    } else if (session.phase === 'completed') {
      AccessibilityInfo.announceForAccessibility(
        'Budget Challenge complete. Your budget review is ready.',
      );
    }
  }, [session.phase, session.index, category, feedback]);
  return (
    <ScreenContainer responsive key={`${session.phase}-${session.index}`}>
      {session.phase === 'intro' ? (
        <>
          <Text accessibilityRole="header" style={theme.title}>
            Budget Challenge
          </Text>
          <Text style={theme.body}>
            Make a school-day plan with {formatCurrency(DAILY_BUDGET, true)}.
            Cover your needs and aim to save ₱60.
          </Text>
          <Text style={theme.body}>
            Choose transport, lunch, materials, a snack, and savings. Watch how
            each choice changes the money left to plan.
          </Text>
          <Text style={theme.body}>
            5 choices. No timer. Try a plan, then review what fits.
          </Text>
          <Text style={theme.muted}>
            Practice only. Your real goals, transactions, and savings stay
            unchanged.
          </Text>
          <AppButton
            title="Start Budget Challenge"
            onPress={() => dispatch({ type: 'start' })}
          />
        </>
      ) : session.phase === 'completed' ? (
        <BudgetChallengeResult
          answers={session.answers}
          onAgain={restart}
          onExit={() => navigation.popTo('Games')}
        />
      ) : (
        <>
          <Text style={theme.muted}>
            Choice {session.index + 1} / 5 · No timer
          </Text>
          <Text accessibilityRole="header" style={theme.title}>
            {category.title}
          </Text>
          {session.phase === 'question' && (
            <Text style={theme.body}>{category.context}</Text>
          )}
          <View style={[theme.card, { padding: 16, gap: 8 }]}>
            <Text style={theme.heading}>
              {summary.shortfall
                ? `Over budget by ${formatCurrency(summary.shortfall, true)}`
                : `Money left to plan: ${formatCurrency(
                    summary.remaining,
                    true,
                  )}`}
            </Text>
            <Text style={theme.body}>
              Spending: {formatCurrency(summary.spending, true)} · Planned
              savings: {formatCurrency(summary.plannedSavings, true)}
            </Text>
            <Text style={theme.muted}>
              From a ₱300 allowance · Savings target ₱60
            </Text>
            {BUDGET_CATEGORIES.filter(item => item.essential > 0).map(item => {
              const allocation = session.answers.find(
                a => a.categoryId === item.id,
              );
              const status = !allocation
                ? 'Pending'
                : allocation.amount >= item.essential
                ? 'Covered'
                : 'Unfunded';
              return (
                <Text key={item.id} style={theme.muted}>
                  {item.title}: {status}
                </Text>
              );
            })}
          </View>
          {session.phase === 'question' ? (
            <>
              {category.options.map((option, index) => (
                <AppButton
                  key={option.label}
                  title={option.label}
                  variant="secondary"
                  onPress={() =>
                    dispatch({ type: 'answer', optionIndex: index })
                  }
                />
              ))}
            </>
          ) : (
            <>
              <Text accessibilityRole="header" style={theme.heading}>
                Check the trade-off
              </Text>
              <Text style={theme.body}>
                You chose: {category.options[answer.optionIndex].label}
              </Text>
              <Text style={theme.body}>{feedback}</Text>
              <AppButton
                title={
                  session.index === 4 ? 'See Budget Review' : 'Next Choice'
                }
                onPress={() => dispatch({ type: 'continue' })}
              />
            </>
          )}
          <GameTextAction title="Restart Budget" onPress={restart} />
        </>
      )}
    </ScreenContainer>
  );
}
