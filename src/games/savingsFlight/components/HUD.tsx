import React from 'react';
import { Text, View } from 'react-native';
import { theme } from '../../../theme/theme';
import { formatCurrency } from '../../../utils/currency';
import { EngineSnapshot } from '../SavingsFlightEngine';
import { FlightLevel, FlightMode } from '../SavingsFlightConfig';
import { GoalProgress } from './GoalProgress';
export function HUD({
  state,
  level,
  mode,
}: {
  state: EngineSnapshot;
  level: FlightLevel;
  mode: FlightMode;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={theme.heading}>Goal: {level.goalName}</Text>
      <GoalProgress savings={state.practiceSavings} target={level.target} />
      <Text style={theme.muted}>
        Arcade Score: {mode === 'assisted' ? 'Not applicable' : state.score} ·
        Decisions: {state.decisionCount}/5
      </Text>
      {mode === 'manual' && (
        <Text
          style={theme.muted}
          accessibilityLabel={`${state.lives} of 3 hearts remaining`}
        >
          Hearts: {'♥'.repeat(state.lives)}
          {'♡'.repeat(3 - state.lives)}
        </Text>
      )}
      {state.budgetRemaining !== null && (
        <Text style={theme.body}>
          Daily Practice Budget: {formatCurrency(state.budgetRemaining, true)}{' '}
          remaining / ₱300
        </Text>
      )}
    </View>
  );
}
