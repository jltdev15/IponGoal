import React, { ReactNode, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors } from '../../../theme/colors';
import { formatCurrency } from '../../../utils/currency';

export function MotionEntrance({
  children,
  enabled,
  duration = 180,
  rise = 12,
  style,
}: {
  children: ReactNode;
  enabled: boolean;
  duration?: number;
  rise?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const value = useRef(new Animated.Value(1)).current;
  const played = useRef(false);
  useEffect(() => {
    if (!enabled || played.current) {
      value.setValue(1);
      return;
    }
    played.current = true;
    value.setValue(0);
    const animation = Animated.timing(value, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    });
    animation.start();
    return () => {
      animation.stop();
      value.setValue(1);
    };
  }, [enabled, duration, value]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: value,
          transform: [
            {
              translateY: value.interpolate({
                inputRange: [0, 1],
                outputRange: [rise, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

export function FlightHero({
  enabled,
  celebration = false,
}: {
  enabled: boolean;
  celebration?: boolean;
}) {
  const { width, height, fontScale } = useWindowDimensions();
  const compact = width < 360 || height < 680 || fontScale > 1.2;
  const burst = useRef(new Animated.Value(0)).current;
  const celebrated = useRef(false);
  useEffect(() => {
    if (!enabled || !celebration || celebrated.current) {
      burst.setValue(0);
      return;
    }
    celebrated.current = true;
    const animation = Animated.timing(burst, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    });
    animation.start();
    return () => {
      animation.stop();
      burst.setValue(0);
    };
  }, [enabled, celebration, burst]);
  return (
    <View
      style={styles.hero}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <MotionEntrance enabled={enabled} duration={350}>
        <Image
          source={require('../../../../assets/branding/games/savings-flight-pig-side.png')}
          resizeMode="contain"
          style={{ width: compact ? 64 : 96, height: compact ? 64 : 96 }}
          accessible={false}
        />
      </MotionEntrance>
      {celebration &&
        enabled &&
        [-1, 1].map(direction => (
          <Animated.View
            key={direction}
            testID="flight-celebration"
            style={[
              styles.confetti,
              {
                backgroundColor: direction < 0 ? colors.gold : colors.primary,
                opacity: burst.interpolate({
                  inputRange: [0, 0.15, 1],
                  outputRange: [0, 1, 0],
                }),
                transform: [
                  {
                    translateX: burst.interpolate({
                      inputRange: [0, 1],
                      outputRange: [direction * 20, direction * 72],
                    }),
                  },
                  {
                    translateY: burst.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -36],
                    }),
                  },
                  { rotate: direction < 0 ? '-25deg' : '25deg' },
                ],
              },
            ]}
          />
        ))}
    </View>
  );
}

export function FlightClouds({ moving }: { moving: boolean }) {
  const drift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!moving) return;
    const loop = Animated.loop(
      Animated.timing(drift, {
        toValue: 1,
        duration: 14000,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [moving, drift]);
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        StyleSheet.absoluteFillObject,
        {
          transform: [
            {
              translateX: drift.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -500],
              }),
            },
          ],
        },
      ]}
    >
      {[0, 500].map(offset => (
        <React.Fragment key={offset}>
          <View
            style={[styles.cloud, { left: 40 + offset, top: 50, width: 110 }]}
          />
          <View
            style={[styles.cloud, { left: 280 + offset, top: 270, width: 130 }]}
          />
        </React.Fragment>
      ))}
    </Animated.View>
  );
}

export function CollisionNotice({ enabled }: { enabled: boolean }) {
  const highlight = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!enabled) {
      highlight.setValue(0);
      return;
    }
    highlight.setValue(0.6);
    const animation = Animated.timing(highlight, {
      toValue: 0,
      duration: 700,
      useNativeDriver: true,
    });
    animation.start();
    return () => {
      animation.stop();
      highlight.setValue(0);
    };
  }, [enabled, highlight]);
  return (
    <View style={styles.collision}>
      <Text style={styles.collisionText}>1 heart lost</Text>
      <Animated.View
        testID="flight-hit-highlight"
        pointerEvents="none"
        accessible={false}
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius: 12,
            borderWidth: 3,
            borderColor: colors.primary,
            opacity: highlight,
          },
        ]}
      />
    </View>
  );
}

export function CoinBurst({
  event,
  amount,
  y,
  enabled,
}: {
  event: number;
  amount: number;
  y: number;
  enabled: boolean;
}) {
  const value = useRef(new Animated.Value(0)).current;
  const seen = useRef(event);
  useEffect(() => {
    const fresh = event !== seen.current;
    seen.current = event;
    if (!enabled || !fresh) {
      value.setValue(0);
      return;
    }
    value.setValue(1);
    const animation = Animated.timing(value, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    });
    animation.start();
    return () => {
      animation.stop();
      value.setValue(0);
    };
  }, [event, enabled, value]);
  return (
    <Animated.View
      testID="flight-coin-burst"
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.collection,
        {
          top: Math.max(8, Math.min(350, y - 28)),
          opacity: value,
          transform: [
            {
              translateY: value.interpolate({
                inputRange: [0, 1],
                outputRange: [-18, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Text allowFontScaling={false} style={styles.collectionText}>
        +{formatCurrency(amount)}
      </Text>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  collision: {
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    padding: 12,
    alignSelf: 'flex-start',
  },
  collisionText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  hero: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  confetti: { position: 'absolute', width: 8, height: 12, borderRadius: 3 },
  cloud: {
    position: 'absolute',
    height: 48,
    borderRadius: 28,
    backgroundColor: colors.white,
    opacity: 0.55,
  },
  collection: {
    position: 'absolute',
    left: 102,
    backgroundColor: colors.goldSoft,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  collectionText: { fontSize: 15, fontWeight: '700', color: colors.text },
});
