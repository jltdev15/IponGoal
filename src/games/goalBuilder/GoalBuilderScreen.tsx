import React, { useEffect } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParams } from '../../navigation/types';
import { AppButton } from '../../components/AppButton';
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
import { GameTextAction } from '../GameReview';
import {
  GameChoiceCard,
  GameProgress,
  GameScreen,
  gameStyles,
} from '../GameControls';
import { useGameSession } from '../useGameSession';

export function GoalBuilderScreen({
  navigation,
}: NativeStackScreenProps<MainStackParams, 'GoalBuilder'>) {
  const { session, dispatch, sound } = useGameSession(
    goalBuilderReducer,
    newGoalBuilderSession,
    navigation,
    (action, state) => {
      if (action.type === 'answer') return action.optionIndex;
      if (action.type === 'goal')
        return PRACTICE_GOALS.findIndex(g => g.id === action.goalId);
      if (action.type === 'weekly')
        return WEEKLY_CHOICES.findIndex(amount => amount === action.amount);
      if (action.type === 'target')
        return PRACTICE_GOALS.find(
          g => g.id === state.goalId,
        )!.targets.findIndex(amount => amount === action.amount);
      return undefined;
    },
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
    if (message) AccessibilityInfo.announceForAccessibility(message);
  }, [
    session.phase,
    session.weekly,
    session.savings,
    event,
    answer,
    affordable,
  ]);
  const actions =
    session.phase === 'intro' ? (
      <AppButton
        title="Start Goal Builder"
        onPress={() => dispatch({ type: 'start' })}
      />
    ) : session.phase === 'goal' ? (
      <>
        <Text style={gameStyles.prompt}>Tap a goal to plan for</Text>
        {PRACTICE_GOALS.map((g, index) => (
          <GameChoiceCard
            key={g.id}
            title={`Choose ${g.title}`}
            detail={`Practice prices from ${formatCurrency(g.targets[0])}`}
            index={index}
            onPress={() => dispatch({ type: 'goal', goalId: g.id })}
          />
        ))}
      </>
    ) : session.phase === 'target' ? (
      <>
        <Text style={gameStyles.prompt}>Tap a practice price</Text>
        {goal.targets.map((amount, index) => (
          <GameChoiceCard
            key={amount}
            title={`Target ${formatCurrency(amount)}`}
            index={index}
            onPress={() => dispatch({ type: 'target', amount })}
          />
        ))}
      </>
    ) : session.phase === 'plan' ? (
      <AppButton
        title="Explore Three Practice Weeks"
        disabled={!affordable}
        onPress={() => dispatch({ type: 'begin' })}
      />
    ) : session.phase === 'question' ? (
      <>
        <Text style={gameStyles.prompt}>What would you do this week?</Text>
        {event.options.map((option, index) => (
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
        title={session.index === 2 ? 'See Goal Review' : 'Next Practice Week'}
        onPress={() => dispatch({ type: 'continue' })}
      />
    ) : (
      <>
        <AppButton
          title="Build Another Goal"
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
        session.phase === 'goal'
          ? 3
          : ['target', 'question', 'completed'].includes(session.phase)
          ? 2
          : 1
      }
    >
      {session.phase === 'intro' ? (
        <>
          <Text accessibilityRole="header" style={theme.title}>
            Turn a wish into a plan
          </Text>
          <Text style={theme.body}>
            Pick a practice goal, choose a price, and decide how much to save
            each week.
          </Text>
          <View style={gameStyles.balance}>
            <Text style={theme.heading}>Start with ₱100 practice savings</Text>
            <Text style={theme.body}>
              Each week: ₱300 allowance − ₱200 essentials − ₱40 separate reserve
              = ₱60 for saving or extras.
            </Text>
          </View>
          <View style={gameStyles.scenario}>
            <Text style={theme.heading}>Build it. Try it. Learn from it.</Text>
            <Text style={theme.body}>
              Explore 3 practice weeks. See how a necessary expense or a planned
              treat can change your timeline.
            </Text>
            <Text style={theme.muted}>
              No timer. Prices and income are fictional. Time estimates assume
              steady future contributions.
            </Text>
          </View>
          <Text style={theme.muted}>
            Practice only. No real goal is created and your savings stay the
            same.
          </Text>
        </>
      ) : session.phase === 'goal' ? (
        <>
          <Text style={theme.muted}>STEP 1 OF 3 · YOUR GOAL</Text>
          <Text accessibilityRole="header" style={theme.title}>
            What are you saving for?
          </Text>
          <Text style={theme.body}>
            Choose something you’d enjoy planning for. All money and targets
            here are fictional.
          </Text>
        </>
      ) : session.phase === 'target' ? (
        <>
          <Text style={theme.muted}>STEP 2 OF 3 · YOUR TARGET</Text>
          <Text accessibilityRole="header" style={theme.title}>
            Set a target for {goal.title}
          </Text>
          <Text style={theme.body}>
            A clear price gives your plan something to work toward. Choose a
            fictional price below.
          </Text>
          <GameTextAction
            title="Change Goal"
            onPress={() => dispatch({ type: 'back' })}
          />
        </>
      ) : session.phase === 'plan' ? (
        <>
          <Text style={theme.muted}>STEP 3 OF 3 · YOUR WEEKLY PLAN</Text>
          <Text accessibilityRole="header" style={theme.title}>
            How much each week?
          </Text>
          <Text style={theme.body}>
            {goal.title} target: {formatCurrency(session.target)} · Starting
            savings: {formatCurrency(STARTING_SAVINGS)}
          </Text>
          <View style={gameStyles.balance}>
            <Text style={theme.heading}>You have ₱60 available each week</Text>
            <Text style={theme.body}>
              ₱300 allowance − ₱200 essentials − ₱40 separate reserve. Keep
              needs and the reserve covered.
            </Text>
          </View>
          <View
            style={gameStyles.section}
            accessibilityRole="radiogroup"
            accessibilityLabel="Weekly savings amount"
          >
            {WEEKLY_CHOICES.map((amount, index) => (
              <GameChoiceCard
                key={amount}
                title={`Save ${formatCurrency(amount)} weekly`}
                detail={
                  amount <= WEEKLY_AVAILABLE
                    ? `${formatCurrency(
                        WEEKLY_AVAILABLE - amount,
                      )} left for extras`
                    : 'Above the ₱60 available — try a smaller amount'
                }
                selected={session.weekly === amount}
                index={index}
                onPress={() => dispatch({ type: 'weekly', amount })}
              />
            ))}
          </View>
          <View
            style={[gameStyles.feedback, affordable && gameStyles.positive]}
            accessibilityLiveRegion="polite"
          >
            <Text style={theme.heading}>
              {affordable ? 'This plan fits!' : 'Choose a smaller amount'}
            </Text>
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
              Whole-week estimate assumes steady contributions with no
              withdrawals or extra income.
            </Text>
          </View>
          <GameTextAction
            title="Change Target"
            onPress={() => dispatch({ type: 'back' })}
          />
        </>
      ) : session.phase === 'completed' ? (
        <GoalBuilderResult session={session} />
      ) : (
        <>
          <GameProgress
            index={session.index}
            total={3}
            answered={session.answers.length}
            label="Practice week"
          />
          {session.phase === 'question' ? (
            <View style={gameStyles.scenario}>
              <Text accessibilityRole="header" style={theme.title}>
                {event.title}
              </Text>
              {session.phase === 'question' && (
                <Text style={theme.body}>{event.context}</Text>
              )}
            </View>
          ) : (
            <Text style={theme.heading}>{event.title}</Text>
          )}
          {session.phase === 'question' && (
            <View style={gameStyles.balance}>
              <Text style={theme.body}>
                {goal.title} target: {formatCurrency(session.target)}
              </Text>
              <Text style={theme.body}>
                Usual contribution: {formatCurrency(session.weekly)} weekly
              </Text>
              <Text style={theme.heading}>
                Current practice goal savings: {formatCurrency(session.savings)}
              </Text>
            </View>
          )}
          {session.phase === 'feedback' && (
            <>
              <View
                style={[
                  gameStyles.feedback,
                  answer.option.thoughtful && gameStyles.positive,
                ]}
              >
                <Text accessibilityRole="header" style={theme.heading}>
                  {answer.option.thoughtful
                    ? 'A thoughtful adjustment'
                    : 'Review the priority'}
                </Text>
                <Text style={theme.body}>You chose: {answer.option.label}</Text>
                <Text style={theme.body}>{answer.option.explanation}</Text>
              </View>
              <View style={gameStyles.scenario}>
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
                  Assumes your usual contribution resumes with no further
                  withdrawals or extra income. This is a practice estimate.
                </Text>
              </View>
            </>
          )}
        </>
      )}
      {session.phase !== 'intro' &&
        session.phase !== 'completed' &&
        session.phase !== 'question' && (
          <GameTextAction title="Restart Practice" onPress={restart} />
        )}
    </GameScreen>
  );
}
