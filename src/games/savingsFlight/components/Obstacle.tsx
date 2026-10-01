import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { FLIGHT } from '../SavingsFlightConfig';
export function Obstacle({
  gapTop,
  gapBottom,
}: {
  gapTop: number;
  gapBottom: number;
}) {
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants">
      <View style={[styles.card, { height: gapTop }]}>
        <Text accessible={false} style={styles.symbol}>
          ₱
        </Text>
      </View>
      <View
        style={[
          styles.card,
          { top: gapBottom, height: FLIGHT.height - gapBottom },
        ]}
      >
        <Text accessible={false} style={styles.symbol}>
          ₱
        </Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: FLIGHT.obstacleWidth,
    backgroundColor: colors.primarySoft,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: { color: colors.primary, fontSize: 22, fontWeight: '700' },
});
