import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Volume2, VolumeX } from 'lucide-react-native';
import { colors } from '../../../theme/colors';

export function SoundControl({
  enabled,
  onPress,
  compact = false,
}: {
  enabled: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  const Icon = enabled ? Volume2 : VolumeX;
  const label = enabled ? 'Sound on' : 'Sound off';
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: enabled }}
      accessibilityHint="Toggle game music and sound effects"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Icon size={22} color={colors.text} accessible={false} />
      {!compact && <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    minWidth: 48,
    padding: 12,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compact: { justifyContent: 'center' },
  label: { color: colors.text, fontSize: 16, fontWeight: '600', flexShrink: 1 },
});
