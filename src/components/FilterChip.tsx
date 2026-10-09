import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';
export function FilterChip({
  label,
  selected,
  onPress,
  disabled = false,
  style,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: selected ? colors.primary : colors.surface },
        style,
      ]}
    >
      <Text
        style={[styles.text, { color: selected ? colors.white : colors.muted }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  chip: {
    minHeight: 46,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  text: { fontSize: 14, fontWeight: '600' },
});
