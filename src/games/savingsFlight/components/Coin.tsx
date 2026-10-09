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
      <Text accessible={false} allowFontScaling={false} style={styles.text}>
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
    backgroundColor: colors.gold,
    borderWidth: 2,
    borderColor: '#A56A00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontSize: 10, fontWeight: '700', color: colors.text },
});
