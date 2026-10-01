import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { theme } from '../theme/theme';

export function ProfileRow({
  title,
  icon,
  count,
  onPress,
  disabled,
}: {
  title: string;
  icon: ReactNode;
  count?: number;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}${
        count === undefined
          ? ''
          : `, ${count} ${count === 1 ? 'goal' : 'goals'}`
      }`}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? colors.primarySoft : colors.surface,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.icon}
      >
        {icon}
      </View>
      <Text style={[theme.body, styles.title]}>{title}</Text>
      {count !== undefined && (
        <Text style={[theme.muted, styles.count]}>{count}</Text>
      )}
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <ChevronRight size={20} color={colors.muted} />
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  row: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  icon: { width: 28, alignItems: 'center' },
  title: { flex: 1, flexShrink: 1 },
  count: { fontWeight: '600', flexShrink: 1 },
});
