import React, { useEffect } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParams } from '../../navigation/types';
import { AppButton } from '../../components/AppButton';
import { theme } from '../../theme/theme';
import { formatCurrency } from '../../utils/currency';
import { SAVE_OR_SPEND_SCENARIOS } from './SaveOrSpendScenarios';
import {
  newSaveOrSpendSession,
  saveOrSpendReducer,
} from './SaveOrSpendSession';
import { SaveOrSpendResult } from './SaveOrSpendResult';
import { GameTextAction } from '../GameReview';
import {
  GameChoiceCard,
  GameProgress,
  GameScreen,
  gameStyles,
} from '../GameControls';
import { useGameSession } from '../useGameSession';

export function SaveOrSpendScreen({
  navigation,
}: NativeStackScreenProps<MainStackParams, 'SaveOrSpend'>) {
  const { session, dispatch, sound } = useGameSession(
    saveOrSpendReducer,
    newSaveOrSpendSession,
    navigation,
    action => (action.type === 'answer' ? action.optionIndex : undefined),
  );
  const scenario = SAVE_OR_SPEND_SCENARIOS[session.index];
  const answer = session.answers[session.index];
  const restart = () => dispatch({ type: 'restart' });
  useEffect(() => {
    const message =
      session.phase === 'question'
        ? `Situation ${session.index + 1} of 5. ${scenario.title}. ${
            scenario.context
          }`
        : session.phase === 'feedback'
        ? `${
            answer.option.thoughtful
              ? 'Good thinking'
              : 'Let’s consider the trade-off'
          }. ${
            answer.option.explanation
          }. Practice savings after this choice: ${formatCurrency(
            answer.savingsAfter,
          )}.`
        : session.phase === 'completed'
        ? 'Save or Spend complete. Your learning summary is ready.'
        : '';
    if (message) AccessibilityInfo.announceForAccessibility(message);
  }, [session.phase, session.index, scenario, answer]);
  const actions =
    session.phase === 'intro' ? (
      <AppButton
        title="Start Save or Spend"
        onPress={() => dispatch({ type: 'start' })}
      />
    ) : session.phase === 'question' ? (
      <>
        <Text style={gameStyles.prompt}>What would you choose?</Text>
        {scenario.options.map((option, index) => (
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
        title={session.index === 4 ? 'See Learning Summary' : 'Next Situation'}
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
        session.phase === 'question' || session.phase === 'completed' ? 2 : 1
      }
    >
      {session.phase === 'intro' ? (
        <>
          <Text accessibilityRole="header" style={theme.title}>
            Save it or spend it?
          </Text>
          <Text style={theme.body}>
            Everyday choices can help your goals. Sometimes saving makes sense;
            sometimes spending on a need or a planned treat does too.
          </Text>
          <View style={gameStyles.scenario}>
            <Text style={theme.heading}>5 situations. No timer.</Text>
            <Text style={theme.body}>
              Read the story, tap your choice, and see what happens to the
              money.
            </Text>
            <Text style={theme.muted}>
              Each story starts fresh with its own fictional savings. Money does
              not carry into the next story.
            </Text>
          </View>
          <Text style={theme.muted}>
            Practice only. Your real savings stay the same.
          </Text>
        </>
      ) : session.phase === 'completed' ? (
        <SaveOrSpendResult answers={session.answers} />
      ) : (
        <>
          <GameProgress
            index={session.index}
            total={5}
            answered={session.answers.length}
            label="Situation"
          />
          {session.phase === 'question' ? (
            <View style={gameStyles.scenario}>
              <Text style={theme.muted}>A FRESH PRACTICE STORY</Text>
              <Text accessibilityRole="header" style={theme.title}>
                {scenario.title}
              </Text>
              {session.phase === 'question' && (
                <Text style={theme.body}>{scenario.context}</Text>
              )}
            </View>
          ) : (
            <Text style={theme.heading}>{scenario.title}</Text>
          )}
          {session.phase === 'question' ? (
            <View style={gameStyles.balance}>
              <Text style={theme.body}>
                Starting practice savings:{' '}
                {formatCurrency(scenario.savingsBefore)}
              </Text>
              <Text style={theme.body}>
                New money available: {formatCurrency(scenario.newMoney)}
              </Text>
              <Text style={theme.muted}>
                This money belongs to this story only.
              </Text>
            </View>
          ) : (
            <>
              <View
                style={[
                  gameStyles.feedback,
                  answer.option.thoughtful && gameStyles.positive,
                ]}
              >
                <Text accessibilityRole="header" style={theme.heading}>
                  {answer.option.thoughtful
                    ? 'Good thinking!'
                    : 'Let’s consider the trade-off'}
                </Text>
                <Text style={theme.body}>You chose: {answer.option.label}</Text>
                <Text style={theme.body}>{answer.option.explanation}</Text>
              </View>
              <View style={gameStyles.balance}>
                <Text style={theme.body}>
                  Practice savings: {formatCurrency(scenario.savingsBefore)} →{' '}
                  {formatCurrency(answer.savingsAfter)}
                </Text>
                <Text style={theme.body}>
                  Practice spending:{' '}
                  {formatCurrency(answer.option.outcome.spending)}
                </Text>
              </View>
              <GameTextAction title="Restart Practice" onPress={restart} />
            </>
          )}
        </>
      )}
    </GameScreen>
  );
}
