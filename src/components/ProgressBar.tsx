import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';
export function ProgressBar({ percent }: { percent: number }) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round(Math.min(percent, 100)),
      }}
      accessibilityLabel="Savings progress"
      style={styles.track}
    >
      <View
        style={[
          styles.fill,
          { width: `${Math.min(Math.max(percent, 0), 100)}%` },
        ]}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: colors.track,
  },
  fill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
});
