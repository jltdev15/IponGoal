import React, { ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export function GameReview({
  children,
  title = 'Review my choices',
}: {
  children: ReactNode;
  title?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.review}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded(value => !value)}
        style={styles.action}
      >
        <Text style={styles.label}>
          {expanded ? '−' : '+'} {title}
        </Text>
      </Pressable>
      {expanded && children}
    </View>
  );
}
export function GameTextAction({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={styles.action}
    >
      <Text style={styles.label}>{title}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  review: { gap: 16 },
  action: {
    minHeight: 48,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    color: colors.primary,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
    textAlign: 'center',
  },
});
