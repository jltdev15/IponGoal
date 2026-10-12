import React, { memo, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import { FLIGHT } from '../SavingsFlightConfig';

const CLOUD_SPAN = 480;
const cloudShape =
  'M8 45C-3 45-3 27 9 26C7 10 26 4 37 14C42-5 70-5 77 15C94 9 108 20 106 34C121 33 126 49 112 52H12C6 52 3 49 8 45Z';

function CloudLayer({
  moving,
  distant,
}: {
  moving: boolean;
  distant: boolean;
}) {
  const drift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!moving) return;
    const animation = Animated.loop(
      Animated.timing(drift, {
        toValue: -CLOUD_SPAN,
        duration: distant ? 56000 : 32000,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [drift, distant, moving]);
  const clouds = distant
    ? [
        { x: 20, y: 42, scale: 0.72 },
        { x: 244, y: 125, scale: 0.5 },
        { x: 380, y: 62, scale: 0.8 },
      ]
    : [
        { x: 100, y: 85, scale: 0.95 },
        { x: 340, y: 246, scale: 0.8 },
      ];
  return (
    <Animated.View
      style={[styles.cloudLayer, { transform: [{ translateX: drift }] }]}
    >
      <Svg width={CLOUD_SPAN * 2} height={FLIGHT.height}>
        {[0, CLOUD_SPAN].map(offset => (
          <G key={offset} opacity={distant ? 0.45 : 0.88}>
            {clouds.map(({ x, y, scale }) => (
              <G
                key={x}
                transform={`translate(${x + offset} ${y}) scale(${scale})`}
              >
                <Path
                  d={cloudShape}
                  fill="#E2F1FA"
                  transform="translate(0 4)"
                />
                <Path d={cloudShape} fill="#FFFFFF" />
                <Path
                  d="M19 39C37 43 66 45 94 39"
                  fill="none"
                  stroke="#EDF7FC"
                  strokeWidth={5}
                  strokeLinecap="round"
                />
              </G>
            ))}
          </G>
        ))}
      </Svg>
    </Animated.View>
  );
}

export const FlightSky = memo(function FlightSkyBackdrop({
  moving,
}: {
  moving: boolean;
}) {
  return (
    <View
      testID="flight-sky"
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
    >
      <Svg width={FLIGHT.width} height={FLIGHT.height} viewBox="0 0 360 400">
        <Defs>
          <LinearGradient id="flightSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0" stopColor="#8DCEED" />
            <Stop offset="0.55" stopColor="#CDECF7" />
            <Stop offset="1" stopColor="#FFF1DE" />
          </LinearGradient>
          <LinearGradient id="flightHaze" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.65} />
          </LinearGradient>
        </Defs>
        <Rect width={360} height={400} fill="url(#flightSky)" />
        <Circle cx={292} cy={63} r={61} fill="#FFFFFF" opacity={0.12} />
        <Circle cx={292} cy={63} r={43} fill="#FFF5D8" opacity={0.35} />
        <Circle cx={292} cy={63} r={27} fill="#FFE9A5" />
        <Circle cx={286} cy={56} r={20} fill="#FFF4C6" />
        <G
          stroke="#FFF7DB"
          strokeWidth={2.5}
          strokeLinecap="round"
          opacity={0.8}
        >
          <Path d="M292 24V17M331 63H338M292 102V109M253 63H246M320 35L325 30M264 91L259 96M320 91L325 96M264 35L259 30" />
        </G>
        <G
          fill="none"
          stroke="#6FA6BE"
          strokeWidth={1.5}
          strokeLinecap="round"
          opacity={0.65}
        >
          <Path d="M157 49Q162 44 167 49Q172 44 177 49M193 69Q197 65 201 69Q205 65 209 69" />
        </G>
        <G transform="translate(29 156)" opacity={0.6}>
          <Path
            d="M0 13C0-5 26-5 26 13C26 22 19 28 17 31H9C7 28 0 22 0 13Z"
            fill="#E9A5B7"
          />
          <Path d="M13 0C5 8 6 20 11 31H15C20 20 21 8 13 0Z" fill="#FFF2DC" />
          <Path d="M9 31L10 37M17 31L16 37" stroke="#AD8991" strokeWidth={1} />
          <Rect x={9} y={37} width={8} height={6} rx={1.5} fill="#B9967F" />
        </G>
        <Path
          d="M0 344Q62 302 134 343Q205 299 284 335Q327 308 360 319V400H0Z"
          fill="#C7DDD9"
          opacity={0.45}
        />
        <G fill="#A5C6D3" opacity={0.4}>
          <Path d="M0 400V352H23V335H41V357H58V317H85V347H105V334H129V366H147V343H168V320H180V309H191V320H204V353H224V337H243V363H259V326H287V350H304V313H331V344H360V400Z" />
          <Rect x={66} y={309} width={11} height={8} />
          <Rect x={313} y={305} width={9} height={8} />
        </G>
        <G fill="#8FB4C1" opacity={0.32}>
          <Path d="M0 400V378H17V361H39V400H57V372H83V400H104V355H135V400H158V378H185V400H213V365H238V400H260V378H290V400H317V361H346V380H360V400Z" />
        </G>
        <Rect y={302} width={360} height={98} fill="url(#flightHaze)" />
        <Path
          d="M0 389Q77 373 149 390T292 388T360 387V400H0Z"
          fill="#FFFFFF"
          opacity={0.38}
        />
      </Svg>
      <CloudLayer moving={moving} distant />
      <CloudLayer moving={moving} distant={false} />
    </View>
  );
});

const styles = StyleSheet.create({
  cloudLayer: { position: 'absolute', top: 0, left: 0 },
});
