import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

export function LoginDecor() {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
    >
      <Svg width={180} height={160} viewBox="0 0 180 160" style={styles.top}>
        <Path
          d="M0 0H180C128 64 79 29 39 85C24 108 15 124 0 133Z"
          fill="#FCE7EF"
          opacity={0.6}
        />
        <Path
          d="M134 0C123 62 111 63 79 80C42 99 47 128 0 147"
          stroke="#F7BDD3"
          strokeWidth={1.2}
          opacity={0.6}
          fill="none"
        />
      </Svg>
      <Svg width={190} height={150} viewBox="0 0 190 150" style={styles.bottom}>
        <Path
          d="M190 0C115 26 143 94 78 102C42 107 19 130 0 150H190Z"
          fill="#FCE7EF"
          opacity={0.6}
        />
        <Path
          d="M190 66C129 133 104 91 45 150H190Z"
          fill="#FAD5E2"
          opacity={0.45}
        />
      </Svg>
    </View>
  );
}
export function LoginGradient({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  if (width <= 0 || height <= 0) {
    return null;
  }
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
    >
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id="loginPink" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0" stopColor="#F72D7B" />
            <Stop offset="1" stopColor="#C91857" />
          </LinearGradient>
        </Defs>
        <Rect
          width={width}
          height={height}
          rx={20}
          ry={20}
          fill="url(#loginPink)"
        />
      </Svg>
    </View>
  );
}
const styles = StyleSheet.create({
  top: { position: 'absolute', top: 0, left: 0 },
  bottom: { position: 'absolute', bottom: 0, right: 0 },
});
