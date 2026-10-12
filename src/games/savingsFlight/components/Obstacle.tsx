import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import { FLIGHT } from '../SavingsFlightConfig';

function Building({ height, upper }: { height: number; upper: boolean }) {
  const roofY = upper ? height - 10 : 0;
  const gradientId = upper ? 'flightGlassTower' : 'flightPeachTower';
  return (
    <Svg width={FLIGHT.obstacleWidth} height={height}>
      <Defs>
        <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0" stopColor={upper ? '#6598B7' : '#D99087'} />
          <Stop offset="0.65" stopColor={upper ? '#87B3CF' : '#EFB4A0'} />
          <Stop offset="1" stopColor={upper ? '#497A9B' : '#BD776E'} />
        </LinearGradient>
      </Defs>
      <Rect
        x={1}
        y={upper ? -4 : 3}
        width={44}
        height={height + 1}
        rx={3}
        fill={`url(#${gradientId})`}
        stroke={upper ? '#406E8C' : '#A86260'}
        strokeWidth={2}
      />
      <Rect x={34} width={9} height={height} fill="#253D61" opacity={0.1} />
      <Path
        d={`M4 0V${height}`}
        stroke="#FFFFFF"
        strokeOpacity={0.28}
        strokeWidth={2}
      />
      {Array.from({ length: Math.ceil(height / 24) }, (_, row) => {
        const y = upper ? height - 29 - row * 24 : 17 + row * 24;
        if (y < 3 || y + 12 > height - 3) return null;
        return (
          <G key={row}>
            {[9, 24].map((x, column) => (
              <G key={x}>
                <Rect
                  x={x}
                  y={y}
                  width={10}
                  height={12}
                  rx={1.5}
                  fill={upper ? '#416F90' : '#AC6E69'}
                />
                <Rect
                  x={x + 1}
                  y={y + 1}
                  width={8}
                  height={9}
                  rx={1}
                  fill={(row + column) % 3 === 0 ? '#FFF0BE' : '#D8ECF2'}
                />
                <Path
                  d={`M${x + 5} ${y + 1}V${y + 10}`}
                  stroke={upper ? '#6B96AC' : '#C19487'}
                  strokeWidth={1}
                />
                <Path
                  d={`M${x - 1} ${y + 13}H${x + 11}`}
                  stroke={upper ? '#406E8C' : '#A86260'}
                  strokeWidth={1.5}
                />
              </G>
            ))}
          </G>
        );
      })}
      <Rect
        x={0.75}
        y={roofY + 0.75}
        width={44.5}
        height={8.5}
        rx={2}
        fill={upper ? '#3E6886' : '#98595C'}
        stroke={upper ? '#315774' : '#844B51'}
        strokeWidth={1.5}
      />
      <Path
        d={`M3 ${roofY + (upper ? 7 : 2)}H43`}
        stroke={upper ? '#B5D8E5' : '#FFE0BC'}
        strokeWidth={2}
      />
    </Svg>
  );
}
export function Obstacle({
  gapTop,
  gapBottom,
}: {
  gapTop: number;
  gapBottom: number;
}) {
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants">
      <View style={[styles.building, { height: gapTop }]}>
        <Building height={gapTop} upper />
      </View>
      <View
        style={[
          styles.building,
          { top: gapBottom, height: FLIGHT.height - gapBottom },
        ]}
      >
        <Building height={FLIGHT.height - gapBottom} upper={false} />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  building: {
    position: 'absolute',
    width: FLIGHT.obstacleWidth,
    // Keep all artwork inside the engine's rectangular collision bounds.
    overflow: 'hidden',
  },
});
