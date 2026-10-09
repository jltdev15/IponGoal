import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
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
    <View style={styles.panel}>
      <Text style={styles.title}>Goal: {level.goalName}</Text>
      <GoalProgress savings={state.practiceSavings} target={level.target} />
      <View style={styles.stats}>
        <Text
          style={styles.stat}
          accessibilityLabel={`Questions completed: ${state.decisionCount} of 5`}
        >
          Questions {state.decisionCount}/5
        </Text>
        {mode === 'manual' && (
          <Text
            style={styles.hearts}
            accessibilityLabel={`${state.lives} of 3 hearts remaining`}
          >
            {'♥'.repeat(state.lives)}
            {'♡'.repeat(3 - state.lives)}
          </Text>
        )}
      </View>
      {state.budgetRemaining !== null && (
        <Text style={styles.stat}>
          Budget left: {formatCurrency(state.budgetRemaining, true)}
        </Text>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 20,
    rowGap: 4,
    justifyContent: 'space-between',
  },
  stat: { ...theme.muted, fontSize: 14 },
  hearts: { color: colors.primary, fontSize: 16 },
  panel: {
    gap: 6,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.text, fontSize: 17, fontWeight: '700' },
});
