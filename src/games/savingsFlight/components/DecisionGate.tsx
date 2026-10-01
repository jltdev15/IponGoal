import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { FLIGHT, FlightScenario } from '../SavingsFlightConfig';
export function DecisionGate({ scenario }: { scenario: FlightScenario }) {
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants">
      {scenario.options.map((option, index) => (
        <View
          key={option.id}
          style={[
            styles.gate,
            { top: index === 0 ? FLIGHT.upperGateTop : FLIGHT.lowerGateTop },
          ]}
        >
          <Text accessible={false} style={styles.label}>
            {option.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  gate: {
    position: 'absolute',
    width: FLIGHT.gateWidth,
    height: FLIGHT.gateHeight,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  label: {
    fontSize: 13,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '700',
  },
});
