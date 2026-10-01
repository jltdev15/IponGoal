import React from 'react';
import { Text, View } from 'react-native';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppButton } from '../../components/AppButton';
import { theme } from '../../theme/theme';
import { formatCurrency } from '../../utils/currency';
import { FlightResult } from './SavingsFlightEngine';
export function SavingsFlightResult({
  result,
  onAgain,
  onExit,
}: {
  result: FlightResult;
  onAgain: () => void;
  onExit: () => void;
}) {
  const complete = result.gameStatus === 'completed';
  return (
    <ScreenContainer>
      <Text style={theme.title}>
        {complete ? 'Savings Flight Complete' : 'Try Another Flight'}
      </Text>
      {!complete && (
        <Text style={theme.body}>
          You reached {result.decisionCount} of 5 financial decisions. Each
          flight is another chance to practice.
        </Text>
      )}
      <View style={theme.card}>
        <Text style={theme.heading}>
          Arcade Score:{' '}
          {result.mode === 'assisted' ? 'Not applicable' : result.score}
        </Text>
        <Text style={theme.body}>
          Thoughtful Financial Decisions: {result.correctDecisionCount} / 5
        </Text>
        <Text style={theme.body}>
          Practice Savings: {formatCurrency(result.level.startingSavings, true)}{' '}
          → {formatCurrency(result.practiceSavings, true)}
        </Text>
        <Text style={theme.body}>
          Goal Progress:{' '}
          {((result.level.startingSavings / result.level.target) * 100).toFixed(
            1,
          )}
          % →{' '}
          {((result.practiceSavings / result.level.target) * 100).toFixed(1)}%
        </Text>
        <Text style={theme.muted}>
          Practice Spending: {formatCurrency(result.practiceSpent, true)} ·
          Coins collected: {result.coinsCollected}
        </Text>
        {result.practiceReserved > 0 && (
          <Text style={theme.body}>
            Practice emergency reserve:{' '}
            {formatCurrency(result.practiceReserved, true)} (separate from your
            goal)
          </Text>
        )}
        {result.budgetRemaining !== null && (
          <Text style={theme.body}>
            Daily Practice Budget remaining:{' '}
            {formatCurrency(result.budgetRemaining, true)}
          </Text>
        )}
      </View>
      <Text style={theme.heading}>What You Practiced</Text>
      <Text style={theme.body}>
        {[...new Set(result.decisions.map(d => d.concept))].join(' · ') ||
          'Navigating toward a practice goal'}
      </Text>
      <Text style={theme.body}>{result.level.takeaway}</Text>
      {result.decisions.map(decision => (
        <View key={decision.scenarioId} style={theme.card}>
          <Text style={theme.body}>{decision.prompt}</Text>
          <Text style={theme.heading}>{decision.answer}</Text>
          <Text style={theme.body}>{decision.explanation}</Text>
        </View>
      ))}
      <Text style={theme.muted}>
        Simulation only. Your real savings records have not changed.
      </Text>
      <AppButton title="Play Again" onPress={onAgain} />
      <AppButton title="Back to Games" variant="secondary" onPress={onExit} />
    </ScreenContainer>
  );
}
