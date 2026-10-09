import React, { useEffect, useReducer } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParams } from '../../navigation/types';
import { AppButton } from '../../components/AppButton';
import { ScreenContainer } from '../../components/ScreenContainer';
import { theme } from '../../theme/theme';
import { formatCurrency } from '../../utils/currency';
import {
  goalBuilderReducer,
  newGoalBuilderSession,
  PRACTICE_GOALS,
  GOAL_EVENTS,
  WEEKLY_CHOICES,
  WEEKLY_AVAILABLE,
  STARTING_SAVINGS,
  weeksToGoal,
} from './GoalBuilderSession';
import { GoalBuilderResult } from './GoalBuilderResult';
export function GoalBuilderScreen(
  _props: NativeStackScreenProps<MainStackParams, 'GoalBuilder'>,
) {
  const [session, dispatch] = useReducer(
    goalBuilderReducer,
    undefined,
    newGoalBuilderSession,
  );
  const goal = PRACTICE_GOALS.find(g => g.id === session.goalId)!;
  const event = GOAL_EVENTS[session.index];
  const answer = session.answers[session.index];
  const affordable = session.weekly <= WEEKLY_AVAILABLE;
  const restart = () => dispatch({ type: 'restart' });
  useEffect(() => {
    const message =
      session.phase === 'question'
        ? `${event.title}. ${event.context}`
        : session.phase === 'feedback'
        ? `${answer.option.explanation} Goal savings now ${formatCurrency(
            session.savings,
          )}.`
        : session.phase === 'completed'
        ? 'Goal Builder complete. Your plan review is ready.'
        : session.phase === 'plan'
        ? `Choose an affordable weekly contribution. ${
            affordable
              ? 'Selected plan fits.'
              : 'Selected plan exceeds available money.'
          }`
        : session.phase === 'target'
        ? 'Choose a fictional target price.'
        : session.phase === 'goal'
        ? 'Choose a fictional practice goal.'
        : '';
    if (message) {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, [
    session.phase,
    session.weekly,
    session.savings,
    event,
    answer,
    affordable,
  ]);
  return (
    <ScreenContainer key={`${session.phase}-${session.index}`}>
      {session.phase === 'intro' ? (
        <>
          <Text accessibilityRole="header" style={theme.title}>
            Goal Builder
          </Text>
          <Text style={theme.body}>
            Choose a fictional goal, set its target price, and build an
            affordable weekly savings plan. Then explore three practice weeks to
            see how essential expenses and optional wants affect the timeline.
          </Text>
          <Text style={theme.body}>
            Start with ₱100 fictional goal savings. Each practice week provides
            ₱300 new allowance: ₱200 for regular essentials and ₱40 for a
            separate reserve leave ₱60 available for goal saving or extras.
          </Text>
          <Text style={theme.body}>
            There is no timer. Prices and weekly income are invented for
            practice. Estimates assume steady future contributions, not a
            promise of when a real goal will be reached.
          </Text>
          <Text style={theme.muted}>
            No real goal is created. Your goals, savings, transactions, and
            statistics stay unchanged.
          </Text>
          <AppButton
            title="Start Goal Builder"
            onPress={() => dispatch({ type: 'start' })}
          />
        </>
      ) : session.phase === 'goal' ? (
        <>
          <Text accessibilityRole="header" style={theme.title}>
            Choose a practice goal
          </Text>
          <Text style={theme.body}>
            Pick something to plan for. All targets and money in this activity
            are fictional.
          </Text>
          {PRACTICE_GOALS.map(g => (
            <AppButton
              key={g.id}
              title={`Choose ${g.title}`}
              onPress={() => dispatch({ type: 'goal', goalId: g.id })}
            />
          ))}
        </>
      ) : session.phase === 'target' ? (
        <>
          <Text accessibilityRole="header" style={theme.title}>
            Set a target for {goal.title}
          </Text>
          <Text style={theme.body}>
            A specific price gives you a clear amount to work toward. Choose one
            of these fictional prices.
          </Text>
          {goal.targets.map(amount => (
            <AppButton
              key={amount}
              title={`Target ${formatCurrency(amount)}`}
              onPress={() => dispatch({ type: 'target', amount })}
            />
          ))}
          <AppButton
            title="Change Goal"
            variant="secondary"
            onPress={() => dispatch({ type: 'back' })}
          />
        </>
      ) : session.phase === 'plan' ? (
        <>
          <Text accessibilityRole="header" style={theme.title}>
            Make a weekly plan
          </Text>
          <Text style={theme.body}>
            {goal.title} target: {formatCurrency(session.target)}. Starting
            savings: {formatCurrency(STARTING_SAVINGS)}.
          </Text>
          <Text style={theme.body}>
            Weekly allowance ₱300 − regular essentials ₱200 − separate reserve
            ₱40 = ₱60 available. Keep needs and the reserve covered.
          </Text>
          {WEEKLY_CHOICES.map(amount => (
            <AppButton
              key={amount}
              title={`Save ${formatCurrency(amount)} weekly${
                session.weekly === amount ? ' · Selected' : ''
              }`}
              variant={session.weekly === amount ? 'primary' : 'secondary'}
              onPress={() => dispatch({ type: 'weekly', amount })}
            />
          ))}
          <View style={theme.card}>
            <Text style={theme.body}>
              {affordable
                ? `Estimated time: ${weeksToGoal(
                    session.target,
                    STARTING_SAVINGS,
                    session.weekly,
                  )} weeks from the starting balance.`
                : `This plan is ${formatCurrency(
                    session.weekly - WEEKLY_AVAILABLE,
                  )} over the available weekly money. Choose ₱60 or less before continuing.`}
            </Text>
            <Text style={theme.muted}>
              Whole-week estimate assumes this contribution stays steady, with
              no withdrawals or extra income. A faster estimate does not make an
              unaffordable plan work.
            </Text>
          </View>
          <AppButton
            title="Explore Three Practice Weeks"
            disabled={!affordable}
            onPress={() => dispatch({ type: 'begin' })}
          />
          <AppButton
            title="Change Target"
            variant="secondary"
            onPress={() => dispatch({ type: 'back' })}
          />
        </>
      ) : session.phase === 'completed' ? (
        <GoalBuilderResult session={session} onAgain={restart} />
      ) : (
        <>
          <Text style={theme.muted}>
            Practice week {session.index + 1} / 3 · No timer
          </Text>
          <Text accessibilityRole="header" style={theme.title}>
            {event.title}
          </Text>
          <Text style={theme.body}>
            {goal.title} target: {formatCurrency(session.target)} · Usual
            contribution: {formatCurrency(session.weekly)} weekly
          </Text>
          {session.phase === 'question' ? (
            <>
              <Text style={theme.body}>
                Current practice goal savings: {formatCurrency(session.savings)}
              </Text>
              <Text style={theme.body}>{event.context}</Text>
              {event.options.map((option, index) => (
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
                {answer.option.thoughtful
                  ? 'A thoughtful adjustment'
                  : 'Review the priority'}
              </Text>
              <Text style={theme.body}>You chose: {answer.option.label}</Text>
              <Text style={theme.body}>{answer.option.explanation}</Text>
              <View style={theme.card}>
                <Text style={theme.body}>
                  This week’s contribution:{' '}
                  {formatCurrency(answer.contribution)}
                </Text>
                <Text style={theme.body}>
                  Goal savings: {formatCurrency(answer.savingsBefore)} →{' '}
                  {formatCurrency(answer.savingsAfter)}
                </Text>
                <Text style={theme.body}>
                  Remaining to goal:{' '}
                  {formatCurrency(
                    Math.max(0, session.target - session.savings),
                  )}
                </Text>
                <Text style={theme.body}>
                  Estimated time from here:{' '}
                  {weeksToGoal(session.target, session.savings, session.weekly)}{' '}
                  more weeks
                </Text>
                <Text style={theme.muted}>
                  Assumes your usual contribution resumes with no more
                  withdrawals or extra income. This example week is not a timer
                  or a real transaction.
                </Text>
              </View>
              <AppButton
                title={
                  session.index === 2 ? 'See Goal Review' : 'Next Practice Week'
                }
                onPress={() => dispatch({ type: 'continue' })}
              />
            </>
          )}
        </>
      )}
      {session.phase !== 'intro' && session.phase !== 'completed' && (
        <AppButton
          title="Restart Practice"
          variant="secondary"
          onPress={restart}
        />
      )}
    </ScreenContainer>
  );
}
