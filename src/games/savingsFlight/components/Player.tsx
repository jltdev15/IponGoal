import React from 'react';
import Svg, { Ellipse, Path, Circle, Rect } from 'react-native-svg';
import { colors } from '../../../theme/colors';
export function Player() {
  return (
    <Svg width={36} height={36} viewBox="0 0 48 48" accessible={false}>
      <Path
        d="M18 20 Q1 0 3 21 Q8 30 18 27 M29 20 Q41 1 45 18 Q44 27 32 27"
        fill={colors.white}
        stroke={colors.primary}
        strokeWidth={2}
      />
      <Ellipse
        cx={24}
        cy={27}
        rx={17}
        ry={13}
        fill={colors.primarySoft}
        stroke={colors.primary}
        strokeWidth={2}
      />
      <Path
        d="M31 17 L32 8 L39 17"
        fill={colors.primarySoft}
        stroke={colors.primary}
        strokeWidth={2}
      />
      <Rect
        x={15}
        y={19}
        width={10}
        height={3}
        rx={1.5}
        fill={colors.primary}
      />
      <Ellipse cx={38} cy={29} rx={7} ry={6} fill={colors.primary} />
      <Circle cx={36} cy={29} r={1} fill={colors.white} />
      <Circle cx={40} cy={29} r={1} fill={colors.white} />
      <Circle cx={30} cy={23} r={2} fill={colors.text} />
      <Path
        d="M15 36 L15 42 M27 38 L27 43 M7 27 Q0 20 3 17"
        stroke={colors.primary}
        strokeWidth={3}
        fill="none"
      />
    </Svg>
  );
}
