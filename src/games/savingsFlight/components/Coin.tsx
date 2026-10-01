import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
export function Coin({ value }: { value: number }) {
  return (
    <View
      style={styles.coin}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <Text accessible={false} style={styles.text}>
        {value / 100}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  coin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.goldSoft,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontSize: 10, fontWeight: '700', color: colors.text },
});
