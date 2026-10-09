import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { theme } from '../../../theme/theme';
import { FlightMode } from '../SavingsFlightConfig';

export function FlightGuide({
  mode,
  hasCoins,
}: {
  mode: FlightMode;
  hasCoins: boolean;
}) {
  const automatic = mode === 'assisted';
  return (
    <View style={styles.guide}>
      <Text accessibilityRole="header" style={theme.heading}>
        How to play
      </Text>
      <View style={styles.row}>
        <View
          style={styles.art}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Text allowFontScaling={false} style={styles.arrow}>
            ↑
          </Text>
          <Image
            source={require('../../../../assets/branding/games/savings-flight-pig-side.png')}
            style={styles.pig}
            resizeMode="contain"
            accessible={false}
          />
        </View>
        <Text style={styles.copy}>
          {automatic
            ? 'The pig flies for you. No tapping or steering needed.'
            : 'Tap the sky to rise. The pig glides down between taps.'}
        </Text>
      </View>
      <View style={styles.row}>
        <View
          style={styles.art}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <View style={styles.wall} />
          <Text allowFontScaling={false} style={styles.arrow}>
            →
          </Text>
          <View style={styles.wall} />
        </View>
        <Text style={styles.copy}>
          {automatic
            ? 'Pass through gaps automatically.'
            : 'Fly through the gaps. Avoid the pink obstacles. You have 3 hearts.'}
        </Text>
      </View>
      <View style={styles.row}>
        <View
          style={styles.art}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <View style={styles.coin}>
            <Text
              accessible={false}
              allowFontScaling={false}
              style={styles.coinLabel}
            >
              ₱
            </Text>
          </View>
        </View>
        <Text style={styles.copy}>
          {hasCoins
            ? 'Collect gold coins for practice savings.'
            : 'Your money choices change your practice savings. There are no coins in this flight.'}
        </Text>
      </View>
      <View style={styles.row}>
        <View
          style={styles.art}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Text allowFontScaling={false} style={styles.arrow}>
            ?
          </Text>
        </View>
        <Text style={styles.copy}>
          Flight pauses for each question. Tap an answer, read why, then
          continue.
        </Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  guide: { gap: 16 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  art: {
    width: 64,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
  },
  pig: { width: 36, height: 36 },
  coin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinLabel: { color: colors.text, fontSize: 18, fontWeight: '700' },
  copy: { ...theme.body, flex: 1 },
  wall: {
    width: 18,
    height: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 3,
  },
  arrow: { color: colors.primary, fontSize: 24, lineHeight: 28 },
});
