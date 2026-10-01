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
  const feedback =
    session.phase === 'feedback'
      ? `${category.options[answer.optionIndex].explanation} ${budgetFeedback(
          session,
        )}`
      : '';
  const restart = () => dispatch({ type: 'restart' });
  const exit = () => navigation.navigate('Games');
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
    <ScreenContainer key={`${session.phase}-${session.index}`}>
      {session.phase === 'intro' ? (
        <>
          <Text accessibilityRole="header" style={theme.title}>
            Budget Challenge
          </Text>
          <Text style={theme.body}>
            Plan one school day using a fictional {formatCurrency(DAILY_BUDGET)}{' '}
            allowance from your family. This is all the money available for the
            day.
          </Text>
          <Text style={theme.body}>
            Cover transportation ₱50, lunch ₱100, and school materials ₱40. Then
            decide on optional snacks and aim to save ₱60. There is more than
            one responsible plan.
          </Text>
          <Text style={theme.body}>
            Make five untimed choices. You can explore an unaffordable plan and
            see its shortfall, then replay to improve it. Unallocated money is
            not automatically savings.
          </Text>
          <Text style={theme.muted}>
            Practice only. Your real goals, transactions, and savings stay
            unchanged.
          </Text>
          <AppButton
            title="Start Budget Challenge"
            onPress={() => dispatch({ type: 'start' })}
          />
          <AppButton title="Back to Games" variant="secondary" onPress={exit} />
        </>
      ) : session.phase === 'completed' ? (
        <BudgetChallengeResult
          answers={session.answers}
          onAgain={restart}
          onExit={exit}
        />
      ) : (
        <>
          <Text style={theme.muted}>
            Choice {session.index + 1} / 5 · No timer
          </Text>
          <Text accessibilityRole="header" style={theme.title}>
            {category.title}
          </Text>
          <View style={theme.card}>
            <Text style={theme.heading}>
              Daily allowance: {formatCurrency(DAILY_BUDGET)}
            </Text>
            <Text style={theme.body}>
              Planned spending: {formatCurrency(summary.spending)}
            </Text>
            <Text style={theme.body}>
              Planned savings: {formatCurrency(summary.plannedSavings)}
            </Text>
            <Text style={theme.body}>
              {summary.shortfall
                ? `Plan shortfall: ${formatCurrency(summary.shortfall)}`
                : `Unallocated: ${formatCurrency(summary.remaining)}`}
            </Text>
          </View>
          {session.phase === 'question' ? (
            <>
              <Text style={theme.body}>{category.context}</Text>
              {category.options.map((option, index) => (
                <AppButton
                  key={option.label}
                  title={option.label}
                  variant={index === 0 ? 'primary' : 'secondary'}
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
              <Text style={theme.body}>
                Allocated: {formatCurrency(answer.amount)}
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
          <AppButton
            title="Restart Budget"
            variant="secondary"
            onPress={restart}
          />
          <AppButton title="Back to Games" variant="secondary" onPress={exit} />
        </>
      )}
    </ScreenContainer>
  );
}
