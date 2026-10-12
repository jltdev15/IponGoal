import React, { useEffect } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParams } from '../../navigation/types';
import { AppButton } from '../../components/AppButton';
import { Icon } from '../../components/Icon';
import { ScreenContainer } from '../../components/ScreenContainer';
import { colors } from '../../theme/colors';
import { theme } from '../../theme/theme';
import {
  Classification,
  createNeedsOrWantsRound,
  ROUND_LENGTH,
} from './NeedsOrWantsScenarios';
import {
  needsOrWantsReducer,
  newNeedsOrWantsSession,
} from './NeedsOrWantsSession';
import { NeedsOrWantsResult } from './NeedsOrWantsResult';
import { GameTextAction } from '../GameReview';
import { useGameSession } from '../useGameSession';
import { GameSoundControl } from '../GameControls';

const choices = {
  need: {
    title: "It's a need",
    meaning: 'Essential for daily life',
    icon: 'home',
  },
  want: {
    title: "It's a want",
    meaning: 'An extra for enjoyment',
    icon: 'gift',
  },
};

function ChoiceCard({
  classification,
  onPress,
}: {
  classification: Classification;
  onPress: () => void;
}) {
  const choice = choices[classification];
  const need = classification === 'need';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={choice.title}
      accessibilityHint={`${choice.meaning}. Selects your answer.`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        need ? styles.needChoice : styles.wantChoice,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[styles.choiceIcon, need ? styles.needIcon : styles.wantIcon]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Icon
          name={choice.icon}
          size={26}
          color={need ? colors.text : colors.primary}
        />
      </View>
      <View style={styles.choiceCopy}>
        <Text style={[styles.choiceTitle, !need && styles.wantTitle]}>
          {choice.title}
        </Text>
        <Text style={styles.choiceMeaning}>{choice.meaning}</Text>
      </View>
      <Text
        style={styles.choiceArrow}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        ›
      </Text>
    </Pressable>
  );
}

export function NeedsOrWantsScreen({
  navigation,
}: NativeStackScreenProps<MainStackParams, 'NeedsOrWants'>) {
  const { session, dispatch, sound } = useGameSession(
    needsOrWantsReducer,
    () => newNeedsOrWantsSession(createNeedsOrWantsRound()),
    navigation,
    action =>
      action.type === 'answer'
        ? action.classification === 'need'
          ? 0
          : 1
        : undefined,
  );
  const { height, fontScale } = useWindowDimensions();
  const keepActionsVisible = height >= 600 && fontScale <= 1.4;
  const scenario = session.scenarios[session.index];
  const answer = session.answers[session.answers.length - 1];
  const restart = () =>
    dispatch({ type: 'restart', scenarios: createNeedsOrWantsRound() });
  const playAgain = () => {
    restart();
    dispatch({ type: 'start' });
  };
  useEffect(() => {
    if (session.phase === 'question') {
      AccessibilityInfo.announceForAccessibility(
        `Situation ${session.index + 1} of ${ROUND_LENGTH}. ${scenario.item}. ${
          scenario.context
        } Tap It's a need or It's a want.`,
      );
    } else if (session.phase === 'feedback') {
      AccessibilityInfo.announceForAccessibility(
        `${
          answer.correct ? 'Good thinking' : 'Let’s learn together'
        }. In this situation, it is a ${scenario.classification}. ${
          scenario.explanation
        }`,
      );
    } else if (session.phase === 'completed') {
      AccessibilityInfo.announceForAccessibility(
        'Needs or Wants complete. Your learning summary is ready.',
      );
    }
  }, [session.phase, session.index, scenario, answer]);

  const actions = (
    <View style={styles.actions} testID="needs-wants-actions">
      {session.phase === 'question' ? (
        <>
          <Text style={styles.actionPrompt}>Tap your answer</Text>
          <ChoiceCard
            classification="need"
            onPress={() => dispatch({ type: 'answer', classification: 'need' })}
          />
          <ChoiceCard
            classification="want"
            onPress={() => dispatch({ type: 'answer', classification: 'want' })}
          />
        </>
      ) : session.phase === 'intro' ? (
        <AppButton
          title="Start playing"
          onPress={() => dispatch({ type: 'start' })}
        />
      ) : session.phase === 'feedback' ? (
        <AppButton
          title={
            session.index + 1 === ROUND_LENGTH
              ? 'See my results'
              : 'Next question'
          }
          onPress={() => dispatch({ type: 'continue' })}
        />
      ) : (
        <>
          <AppButton title="Play Again" onPress={playAgain} />
          <AppButton
            title="Back to Games"
            variant="secondary"
            onPress={() => navigation.popTo('Games')}
          />
        </>
      )}
    </View>
  );
  return (
    <ScreenContainer
      responsive
      key={`${session.phase}-${session.index}`}
      footer={keepActionsVisible ? actions : undefined}
    >
      <View style={{ alignItems: 'flex-end' }}>
        <GameSoundControl {...sound} />
      </View>
      {session.phase === 'intro' ? (
        <>
          <View style={styles.introBadge}>
            <Text style={styles.badgeText}>5 situations · No timer</Text>
          </View>
          <View style={styles.section}>
            <Text accessibilityRole="header" style={theme.title}>
              Need it or want it?
            </Text>
            <Text style={theme.body}>
              Read a situation. Choose what fits. Discover why.
            </Text>
          </View>
          <View style={styles.section}>
            {(['need', 'want'] as const).map(classification => (
              <View
                key={classification}
                style={[
                  styles.definition,
                  classification === 'need'
                    ? styles.needChoice
                    : styles.wantChoice,
                ]}
              >
                <Icon
                  name={choices[classification].icon}
                  color={
                    classification === 'need' ? colors.text : colors.primary
                  }
                />
                <View style={styles.choiceCopy}>
                  <Text style={styles.definitionTitle}>
                    {classification === 'need' ? 'Need' : 'Want'}
                  </Text>
                  <Text style={theme.body}>
                    {choices[classification].meaning}
                  </Text>
                  <Text style={theme.muted}>
                    {classification === 'need'
                      ? 'For example: a meal or a notebook for class.'
                      : 'For example: a treat or an extra decoration.'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          <Text style={theme.body}>
            Tap one answer to see the explanation, then move to the next
            question. Take your time!
          </Text>
          <Text style={theme.muted}>
            Practice only. Your real savings stay the same.
          </Text>
        </>
      ) : session.phase === 'completed' ? (
        <NeedsOrWantsResult answers={session.answers} />
      ) : (
        <>
          <View style={styles.section}>
            <View style={theme.row}>
              <Text style={styles.progressText}>
                Question {session.index + 1} of {ROUND_LENGTH}
              </Text>
              <Text style={theme.muted}>Take your time</Text>
            </View>
            <View
              style={styles.progressTrack}
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel="Questions answered"
              accessibilityValue={{
                min: 0,
                max: ROUND_LENGTH,
                now: session.answers.length,
              }}
            >
              {session.scenarios.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.progressStep,
                    index < session.answers.length && styles.progressDone,
                  ]}
                />
              ))}
            </View>
          </View>
          <View style={styles.scenario}>
            <Text style={styles.eyebrow}>THE SITUATION</Text>
            <Text accessibilityRole="header" style={styles.item}>
              {scenario.item}
            </Text>
            <Text style={theme.body}>{scenario.context}</Text>
          </View>
          {session.phase === 'question' ? (
            <View style={styles.section}>
              <Text accessibilityRole="header" style={theme.heading}>
                Do you need it, or is it an extra?
              </Text>
              <Text style={theme.muted}>
                Think about this situation before choosing.
              </Text>
            </View>
          ) : (
            <>
              <View
                style={[
                  styles.feedback,
                  answer.correct && styles.correctFeedback,
                ]}
              >
                <Text accessibilityRole="header" style={theme.heading}>
                  {answer.correct ? 'Good thinking!' : 'Let’s learn together'}
                </Text>
                <Text style={theme.muted}>
                  You chose: {answer.selected === 'need' ? 'Need' : 'Want'}
                </Text>
                <Text style={styles.answerTitle}>
                  In this situation, it’s a {scenario.classification}.
                </Text>
                <Text style={theme.body}>{scenario.explanation}</Text>
              </View>
              <GameTextAction title="Start over" onPress={restart} />
            </>
          )}
        </>
      )}
      {!keepActionsVisible && actions}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  actions: { gap: 10 },
  actionPrompt: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  choice: {
    minHeight: 92,
    padding: 16,
    borderRadius: 20,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  needChoice: { backgroundColor: '#EFF6FF', borderColor: '#B8CCE2' },
  wantChoice: { backgroundColor: colors.primarySoft, borderColor: '#E9A7BF' },
  choiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  needIcon: { backgroundColor: '#DBEAFE' },
  wantIcon: { backgroundColor: '#F9CBDE' },
  choiceCopy: { flex: 1, minWidth: 0, gap: 4 },
  choiceTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 26,
  },
  wantTitle: { color: colors.primary },
  choiceMeaning: { color: colors.text, fontSize: 14, lineHeight: 21 },
  choiceArrow: { fontSize: 30, color: colors.muted },
  pressed: { opacity: 0.75 },
  introBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.goldSoft,
  },
  badgeText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  definition: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  definitionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.text,
  },
  progressText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
  },
  progressTrack: { flexDirection: 'row', gap: 6 },
  progressStep: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.track,
    flex: 1,
  },
  progressDone: { backgroundColor: colors.primary },
  scenario: { ...theme.card, gap: 14, padding: 22 },
  eyebrow: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: colors.muted,
  },
  item: { ...theme.title, fontSize: 26, lineHeight: 32 },
  feedback: {
    ...theme.card,
    backgroundColor: colors.goldSoft,
    borderColor: '#EDD898',
  },
  correctFeedback: {
    backgroundColor: colors.positiveSoft,
    borderColor: '#B2DDC6',
  },
  answerTitle: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    color: colors.text,
  },
});
