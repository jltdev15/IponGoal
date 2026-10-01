import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { theme } from '../theme/theme';
import { colors } from '../theme/colors';
export function SectionHeader({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={theme.row}>
      <Text style={[theme.heading, { flex: 1 }]}>{title}</Text>
      {action && (
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={{ minHeight: 48, justifyContent: 'center' }}
        >
          <Text
            style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}
          >
            {action}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
