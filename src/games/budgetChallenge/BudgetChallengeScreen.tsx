import React, { useEffect } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParams } from '../../navigation/types';
import { AppButton } from '../../components/AppButton';
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
import {
  GameChoiceCard,
  GameProgress,
  GameScreen,
  gameStyles,
} from '../GameControls';
import { useGameSession } from '../useGameSession';

export function BudgetChallengeScreen({
  navigation,
}: NativeStackScreenProps<MainStackParams, 'BudgetChallenge'>) {
  const { session, dispatch, sound } = useGameSession(
    budgetReducer,
    newBudgetSession,
    navigation,
    action => (action.type === 'answer' ? action.optionIndex : undefined),
  );
  const category = BUDGET_CATEGORIES[session.index];
  const summary = budgetSummary(session.answers);
  const answer = session.answers[session.index];
  const feedback = session.phase === 'feedback' ? budgetFeedback(session) : '';
  const restart = () => dispatch({ type: 'restart' });
  useEffect(() => {
    const message =
      session.phase === 'question'
        ? `Choice ${session.index + 1} of 5. ${category.title}. ${
            category.context
          }`
        : session.phase === 'feedback'
        ? feedback
        : session.phase === 'completed'
        ? 'Budget Challenge complete. Your budget review is ready.'
        : '';
    if (message) AccessibilityInfo.announceForAccessibility(message);
  }, [session.phase, session.index, category, feedback]);
  const actions =
    session.phase === 'intro' ? (
      <AppButton
        title="Start Budget Challenge"
        onPress={() => dispatch({ type: 'start' })}
      />
    ) : session.phase === 'question' ? (
      <>
        <Text style={gameStyles.prompt}>Tap a choice for your plan</Text>
        {category.options.map((option, index) => (
          <GameChoiceCard
            key={option.label}
            title={option.label}
            index={index}
            onPress={() => dispatch({ type: 'answer', optionIndex: index })}
          />
        ))}
      </>
    ) : session.phase === 'feedback' ? (
      <AppButton
        title={session.index === 4 ? 'See Budget Review' : 'Next Choice'}
        onPress={() => dispatch({ type: 'continue' })}
      />
    ) : (
      <>
        <AppButton
          title="Play Again"
          onPress={() => {
            restart();
            dispatch({ type: 'start' });
          }}
        />
        <AppButton
          title="Back to Games"
          variant="secondary"
          onPress={() => navigation.popTo('Games')}
        />
      </>
    );
  return (
    <GameScreen
      key={`${session.phase}-${session.index}`}
      sound={sound}
      actions={actions}
      actionCount={
        session.phase === 'question' ? 3 : session.phase === 'completed' ? 2 : 1
      }
    >
      {session.phase === 'intro' ? (
        <>
          <Text accessibilityRole="header" style={theme.title}>
            Make your money go further
          </Text>
          <Text style={theme.body}>
            Build a school-day plan. Cover what you need, choose your extras,
            and make room for savings.
          </Text>
          <View style={gameStyles.balance}>
            <Text style={theme.muted}>YOUR PRACTICE ALLOWANCE</Text>
            <Text style={theme.title}>
              {formatCurrency(DAILY_BUDGET, true)}
            </Text>
            <Text style={theme.body}>Your savings goal for today: ₱60</Text>
          </View>
          <View style={gameStyles.scenario}>
            <Text style={theme.heading}>5 choices. One school day.</Text>
            <Text style={theme.body}>1. Read what you need for today.</Text>
            <Text style={theme.body}>
              2. Tap one option to add it to your plan.
            </Text>
            <Text style={theme.body}>
              3. Check the money left, then keep going.
            </Text>
          </View>
          <Text style={theme.muted}>
            No timer. Practice only. Your real savings stay the same.
          </Text>
        </>
      ) : session.phase === 'completed' ? (
        <BudgetChallengeResult answers={session.answers} />
      ) : (
        <>
          <GameProgress
            index={session.index}
            total={5}
            answered={session.answers.length}
          />
          {session.phase === 'question' ? (
            <View style={gameStyles.scenario}>
              <Text style={theme.muted}>TODAY’S CHOICE</Text>
              <Text accessibilityRole="header" style={theme.title}>
                {category.title}
              </Text>
              {session.phase === 'question' && (
                <Text style={theme.body}>{category.context}</Text>
              )}
            </View>
          ) : (
            <Text style={theme.heading}>{category.title}</Text>
          )}
          {session.phase === 'feedback' && (
            <View style={gameStyles.feedback}>
              <Text accessibilityRole="header" style={theme.heading}>
                Here’s how your choice fits
              </Text>
              <Text style={theme.body}>
                You chose: {category.options[answer.optionIndex].label}
              </Text>
              <Text style={theme.body}>
                {category.options[answer.optionIndex].explanation}
              </Text>
              <Text style={theme.body}>{feedback}</Text>
            </View>
          )}
          <View style={gameStyles.balance}>
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
          {session.phase === 'feedback' && (
            <>
              <GameTextAction title="Restart Budget" onPress={restart} />
            </>
          )}
        </>
      )}
    </GameScreen>
  );
}
