import React, { useEffect, useReducer } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParams } from '../../navigation/types';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppButton } from '../../components/AppButton';
import { theme } from '../../theme/theme';
import { formatCurrency } from '../../utils/currency';
import { SAVE_OR_SPEND_SCENARIOS } from './SaveOrSpendScenarios';
import {
  newSaveOrSpendSession,
  saveOrSpendReducer,
} from './SaveOrSpendSession';
import { SaveOrSpendResult } from './SaveOrSpendResult';
export function SaveOrSpendScreen(
  _props: NativeStackScreenProps<MainStackParams, 'SaveOrSpend'>,
) {
  const [session, dispatch] = useReducer(
    saveOrSpendReducer,
    undefined,
    newSaveOrSpendSession,
  );
  const scenario = SAVE_OR_SPEND_SCENARIOS[session.index];
  const answer = session.answers[session.index];
  const restart = () => dispatch({ type: 'restart' });
  useEffect(() => {
    if (session.phase === 'question') {
      AccessibilityInfo.announceForAccessibility(
        `Situation ${session.index + 1} of 5. ${scenario.title}. ${
          scenario.context
        }`,
      );
    } else if (session.phase === 'feedback') {
      AccessibilityInfo.announceForAccessibility(
        `${
          answer.option.thoughtful
            ? 'Good thinking'
            : 'Let’s consider the trade-off'
        }. ${
          answer.option.explanation
        }. Practice savings after this choice: ${formatCurrency(
          answer.savingsAfter,
        )}.`,
      );
    } else if (session.phase === 'completed') {
      AccessibilityInfo.announceForAccessibility(
        'Save or Spend complete. Your learning summary is ready.',
      );
    }
  }, [session.phase, session.index, scenario, answer]);
  return (
    <ScreenContainer key={`${session.phase}-${session.index}`}>
      {session.phase === 'intro' ? (
        <>
          <Text accessibilityRole="header" style={theme.title}>
            Save or Spend
          </Text>
          <Text style={theme.body}>
            Practice five money decisions with no timer. Read where the money
            comes from, choose an option, and learn how it affects savings and
            spending.
          </Text>
          <Text style={theme.body}>
            Each situation is a separate fictional example with its own starting
            savings. The money does not carry into the next example.
          </Text>
          <Text style={theme.body}>
            Saving is useful, but essentials can come first. A planned,
            affordable treat can be responsible too.
          </Text>
          <Text style={theme.muted}>
            Practice only. Your real goals, transactions, and savings stay
            unchanged.
          </Text>
          <AppButton
            title="Start Save or Spend"
            onPress={() => dispatch({ type: 'start' })}
          />
        </>
      ) : session.phase === 'completed' ? (
        <SaveOrSpendResult answers={session.answers} onAgain={restart} />
      ) : (
        <>
          <Text style={theme.muted}>
            Situation {session.index + 1} / 5 · No timer · Separate example
          </Text>
          <Text accessibilityRole="header" style={theme.title}>
            {scenario.title}
          </Text>
          {session.phase === 'question' ? (
            <>
              <View style={theme.card}>
                <Text style={theme.body}>
                  Starting practice savings:{' '}
                  {formatCurrency(scenario.savingsBefore)}
                </Text>
                <Text style={theme.body}>
                  New money available: {formatCurrency(scenario.newMoney)}
                </Text>
              </View>
              <Text style={theme.body}>{scenario.context}</Text>
              {scenario.options.map((option, index) => (
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
                  ? 'Good thinking'
                  : 'Let’s consider the trade-off'}
              </Text>
              <Text style={theme.body}>You chose: {answer.option.label}</Text>
              <Text style={theme.body}>{answer.option.explanation}</Text>
              <View style={theme.card}>
                <Text style={theme.body}>
                  Practice savings: {formatCurrency(scenario.savingsBefore)} →{' '}
                  {formatCurrency(answer.savingsAfter)}
                </Text>
                <Text style={theme.body}>
                  Practice spending:{' '}
                  {formatCurrency(answer.option.outcome.spending)}
                </Text>
              </View>
              <AppButton
                title={
                  session.index === 4
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
        </>
      )}
    </ScreenContainer>
  );
}
