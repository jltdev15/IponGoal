import React from 'react';
import { Animated, Image, StyleSheet } from 'react-native';
import { FLIGHT } from '../SavingsFlightConfig';
export function Player({ tilt }: { tilt?: Animated.Value }) {
  return (
    <Animated.View
      style={
        tilt
          ? {
              transform: [
                {
                  rotate: tilt.interpolate({
                    inputRange: [-8, 8],
                    outputRange: ['-8deg', '8deg'],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            }
          : undefined
      }
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Image
        source={require('../../../../assets/branding/games/savings-flight-pig-side.png')}
        resizeMode="contain"
        style={styles.sprite}
        accessible={false}
      />
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  sprite: { width: FLIGHT.playerSize, height: FLIGHT.playerSize },
});
