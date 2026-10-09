import React from 'react';
import { Text, View } from 'react-native';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppButton } from '../../components/AppButton';
import { theme } from '../../theme/theme';
import { formatCurrency } from '../../utils/currency';
import { GameReview } from '../GameReview';
import { FlightResult } from './SavingsFlightEngine';
import { FlightHero, MotionEntrance } from './components/FlightPresentation';

export function SavingsFlightResult({
  result,
  onAgain,
  onExit,
  motion = false,
}: {
  result: FlightResult;
  onAgain: () => void;
  onExit: () => void;
  motion?: boolean;
}) {
  const complete = result.gameStatus === 'completed';
  return (
    <ScreenContainer responsive>
      <MotionEntrance
        enabled={motion}
        duration={250}
        rise={0}
        style={{ gap: 20 }}
      >
        <FlightHero enabled={motion} celebration={complete} />
        <Text
          accessibilityRole="header"
          style={[theme.title, { fontSize: 24, textAlign: 'center' }]}
        >
          {complete ? 'Savings Flight Complete' : 'Try Another Flight'}
        </Text>
        <View style={[theme.card, { padding: 16, gap: 10 }]}>
          <Text style={theme.heading}>
            {complete
              ? '5 questions completed'
              : result.decisionCount + ' of 5 questions completed'}
          </Text>
          {result.decisionCount > 0 && (
            <Text style={theme.body}>
              Thoughtful choices: {result.correctDecisionCount} /{' '}
              {result.decisionCount}
            </Text>
          )}
          <Text style={theme.body}>
            Practice savings:{' '}
            {formatCurrency(result.level.startingSavings, true)} →{' '}
            {formatCurrency(result.practiceSavings, true)}
          </Text>
          {result.mode === 'manual' && (
            <Text style={theme.muted}>Arcade score: {result.score}</Text>
          )}
        </View>
        <Text style={theme.body}>{result.level.takeaway}</Text>
        <AppButton title="Play Again" onPress={onAgain} />
        <AppButton title="Back to Games" variant="secondary" onPress={onExit} />
        <GameReview>
          <View style={theme.card}>
            <Text style={theme.heading}>Your practice money</Text>
            <Text style={theme.body}>
              Goal: {result.level.goalName} ·{' '}
              {formatCurrency(result.level.target, true)}
            </Text>
            <Text style={theme.body}>
              Practice spending: {formatCurrency(result.practiceSpent, true)}
            </Text>
            <Text style={theme.body}>
              Coins collected: {result.coinsCollected}
            </Text>
            {result.practiceReserved > 0 && (
              <Text style={theme.body}>
                Separate emergency reserve:{' '}
                {formatCurrency(result.practiceReserved, true)}
              </Text>
            )}
            {result.budgetRemaining !== null && (
              <Text style={theme.body}>
                Daily budget remaining:{' '}
                {formatCurrency(result.budgetRemaining, true)}
              </Text>
            )}
          </View>
          {result.decisions.length === 0 && (
            <Text style={theme.body}>
              No questions answered yet. Try another flight to reach your first
              question.
            </Text>
          )}
          {result.decisions.map(decision => (
            <View key={decision.scenarioId} style={theme.card}>
              <Text style={theme.body}>{decision.prompt}</Text>
              <Text style={theme.heading}>You chose: {decision.answer}</Text>
              <Text style={theme.body}>{decision.explanation}</Text>
            </View>
          ))}
        </GameReview>
        <Text style={theme.muted}>
          Practice only. Your real savings stay unchanged.
        </Text>
      </MotionEntrance>
    </ScreenContainer>
  );
}
