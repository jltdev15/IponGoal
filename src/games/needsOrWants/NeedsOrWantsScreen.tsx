import React, { useEffect, useReducer } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParams } from '../../navigation/types';
import { AppButton } from '../../components/AppButton';
import { ScreenContainer } from '../../components/ScreenContainer';
import { theme } from '../../theme/theme';
import { createNeedsOrWantsRound, ROUND_LENGTH } from './NeedsOrWantsScenarios';
import {
  needsOrWantsReducer,
  newNeedsOrWantsSession,
} from './NeedsOrWantsSession';
import { NeedsOrWantsResult } from './NeedsOrWantsResult';
export function NeedsOrWantsScreen({
  navigation,
}: NativeStackScreenProps<MainStackParams, 'NeedsOrWants'>) {
  const [session, dispatch] = useReducer(needsOrWantsReducer, undefined, () =>
    newNeedsOrWantsSession(createNeedsOrWantsRound()),
  );
  const scenario = session.scenarios[session.index];
  const answer = session.answers[session.answers.length - 1];
  const restart = () =>
    dispatch({ type: 'restart', scenarios: createNeedsOrWantsRound() });
  const exit = () => navigation.navigate('Games');
  useEffect(() => {
    if (session.phase === 'question') {
      AccessibilityInfo.announceForAccessibility(
        `Situation ${session.index + 1} of ${ROUND_LENGTH}. ${scenario.item}. ${
          scenario.context
        } Is this a need or a want in this situation?`,
      );
    } else if (session.phase === 'feedback') {
      AccessibilityInfo.announceForAccessibility(
        `${answer.correct ? 'Good thinking' : 'Let’s think it through'}. ${
          scenario.explanation
        }`,
      );
    } else if (session.phase === 'completed') {
      AccessibilityInfo.announceForAccessibility(
        'Needs or Wants complete. Your learning summary is ready.',
      );
    }
  }, [session.phase, session.index, scenario, answer]);
  return (
    <ScreenContainer key={`${session.phase}-${session.index}`}>
      {session.phase === 'intro' ? (
        <>
          <Text accessibilityRole="header" style={theme.title}>
            Needs or Wants
          </Text>
          <Text style={theme.body}>
            A need supports essentials such as food, safety, health, or required
            schoolwork. A want adds enjoyment or something extra.
          </Text>
          <Text style={theme.body}>
            Read five short situations, choose Need or Want, and see why. The
            same item can have a different role in a different situation.
          </Text>
          <Text style={theme.body}>
            There is no timer. Wants are not automatically bad, and spending on
            an important need can be responsible.
          </Text>
          <Text style={theme.muted}>
            Practice only. This activity never changes your real savings.
          </Text>
          <AppButton
            title="Start Practice"
            onPress={() => dispatch({ type: 'start' })}
          />
          <AppButton title="Back to Games" variant="secondary" onPress={exit} />
        </>
      ) : session.phase === 'completed' ? (
        <NeedsOrWantsResult
          answers={session.answers}
          onAgain={restart}
          onExit={exit}
        />
      ) : (
        <>
          <Text style={theme.muted}>
            Situation {session.index + 1} / {ROUND_LENGTH} · No timer
          </Text>
          <Text accessibilityRole="header" style={theme.title}>
            {scenario.item}
          </Text>
          <View style={theme.card}>
            <Text style={theme.body}>{scenario.context}</Text>
          </View>
          {session.phase === 'question' ? (
            <>
              <Text style={theme.heading}>
                Is this a need or a want in this situation?
              </Text>
              <AppButton
                title="Need"
                onPress={() =>
                  dispatch({ type: 'answer', classification: 'need' })
                }
              />
              <AppButton
                title="Want"
                variant="secondary"
                onPress={() =>
                  dispatch({ type: 'answer', classification: 'want' })
                }
              />
            </>
          ) : (
            <>
              <Text accessibilityRole="header" style={theme.heading}>
                {answer.correct ? 'Good thinking' : 'Let’s think it through'}
              </Text>
              <Text style={theme.muted}>
                You chose: {answer.selected === 'need' ? 'Need' : 'Want'}
              </Text>
              <Text style={theme.heading}>
                In this situation:{' '}
                {scenario.classification === 'need' ? 'Need' : 'Want'}
              </Text>
              <Text style={theme.body}>{scenario.explanation}</Text>
              <AppButton
                title={
                  session.index + 1 === ROUND_LENGTH
                    ? 'See Learning Summary'
                    : 'Next Situation'
                }
                onPress={() => dispatch({ type: 'continue' })}
              />
            </>
          )}
          <AppButton
            title="Restart Practice"
            variant="secondary"
            onPress={restart}
          />
          <AppButton title="Back to Games" variant="secondary" onPress={exit} />
        </>
      )}
    </ScreenContainer>
  );
}
