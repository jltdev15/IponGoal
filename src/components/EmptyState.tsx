import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from './Icon';
import { AppButton } from './AppButton';
import { theme } from '../theme/theme';
import { colors } from '../theme/colors';
export function EmptyState({
  title,
  body,
  action,
  onPress,
  icon = 'piggy',
  compact = false,
}: {
  title: string;
  body: string;
  action: string;
  onPress: () => void;
  icon?: string;
  compact?: boolean;
}) {
  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <View style={[styles.icon, compact && styles.compactIcon]}>
        <Icon name={icon} size={compact ? 32 : 40} />
      </View>
      <Text style={[theme.heading, styles.center]}>{title}</Text>
      <Text style={[theme.muted, styles.center]}>{body}</Text>
      <AppButton title={action} onPress={onPress} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { paddingVertical: 24, gap: 18 },
  icon: {
    alignSelf: 'center',
    padding: 24,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
  },
  center: { textAlign: 'center' },
  compactContainer: { paddingVertical: 12, gap: 12 },
  compactIcon: { padding: 12 },
});
