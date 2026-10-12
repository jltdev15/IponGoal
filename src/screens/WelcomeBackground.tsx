import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

// Keep the decorative details at the edges so the mascot and copy stay clear.
export function WelcomeBackground() {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 390 844"
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id="welcomeSky" x1="0%" y1="0%" x2="70%" y2="100%">
            <Stop offset="0" stopColor="#FFE0EB" />
            <Stop offset="0.4" stopColor="#FFF8F4" />
            <Stop offset="0.72" stopColor="#FFF9F2" />
            <Stop offset="1" stopColor="#FCE8EF" />
          </LinearGradient>
          <RadialGradient id="welcomeGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.9} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id="welcomeHill" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0" stopColor="#FAD4E2" />
            <Stop offset="1" stopColor="#F4BFD2" />
          </LinearGradient>
        </Defs>

        <Rect width={390} height={844} fill="url(#welcomeSky)" />
        <Ellipse cx={195} cy={350} rx={220} ry={310} fill="url(#welcomeGlow)" />

        <Path
          d="M0 0H224C195 44 139 29 113 83C88 135 31 148 0 141Z"
          fill="#F7B8CE"
          opacity={0.45}
        />
        <Path
          d="M-20 167C49 185 111 140 128 96C151 40 198 67 239-12"
          fill="none"
          stroke="#EBA5BD"
          strokeWidth={1.5}
          opacity={0.55}
        />
        <Circle cx={364} cy={118} r={74} fill="#FFF0C5" opacity={0.7} />
        <Path
          d="M277 148C277 139 284 132 294 132C297 117 307 110 320 113C329 95 358 99 362 120C378 117 391 129 391 145C391 157 382 164 369 164H294C283 164 277 158 277 148Z"
          fill="#FFFFFF"
          opacity={0.8}
        />

        <G fill="none" stroke="#E5B651" strokeWidth={1.5} opacity={0.55}>
          <G transform="translate(43 232) rotate(-18)">
            <Ellipse rx={15} ry={19} fill="#FFF1C8" />
            <Ellipse rx={10} ry={14} />
            <Path d="M0-6V6M-3-3H2C6-3 6 2 2 2H-3" />
          </G>
          <G transform="translate(354 362) rotate(22)">
            <Ellipse rx={12} ry={16} fill="#FFF1C8" />
            <Ellipse rx={8} ry={11} />
          </G>
        </G>
        <G fill="none" stroke="#DE9DB5" strokeWidth={1.8} strokeLinecap="round">
          <Path d="M326 225V239M319 232H333" />
          <Path d="M34 418V428M29 423H39" opacity={0.7} />
        </G>
        <Circle cx={68} cy={184} r={3} fill="#E5B651" opacity={0.55} />
        <Circle cx={347} cy={292} r={3} fill="#DE9DB5" opacity={0.5} />

        <Path
          d="M-20 735C62 657 137 711 220 694C296 678 341 620 410 638V864H-20Z"
          fill="#E1F1E9"
          opacity={0.8}
        />
        <Path
          d="M-20 718C48 687 89 722 147 755C224 799 292 698 410 725V864H-20Z"
          fill="url(#welcomeHill)"
        />
        <Path
          d="M-23 770C79 737 113 837 202 813C281 792 303 758 413 785"
          fill="none"
          stroke="#FFF8EE"
          strokeWidth={42}
          strokeLinecap="round"
          opacity={0.75}
        />
        <Path
          d="M-23 770C79 737 113 837 202 813C281 792 303 758 413 785"
          fill="none"
          stroke="#DDB777"
          strokeWidth={2}
          strokeDasharray="3 10"
          strokeLinecap="round"
          opacity={0.7}
        />
      </Svg>
    </View>
  );
}
