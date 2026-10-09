import React from 'react';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { colors } from '../theme/colors';

export function GameGridCard({
  title,
  image,
  label,
  description,
  detail,
  onPress,
}: {
  title: string;
  image: ImageSourcePropType;
  label: string;
  description: string;
  detail: string;
  onPress: () => void;
}) {
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 360 || fontScale > 1.2;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={description + ' ' + detail}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        stacked && styles.stacked,
        pressed && styles.pressed,
      ]}
    >
      <Image
        source={image}
        resizeMode="contain"
        accessible={false}
        style={styles.image}
      />
      <View style={styles.copy}>
        <Text style={styles.detail}>{detail}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: 48,
    padding: 16,
    gap: 16,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stacked: { flexDirection: 'column', alignItems: 'flex-start' },
  pressed: { backgroundColor: colors.primarySoft },
  image: { width: 64, height: 64 },
  copy: { flexShrink: 1, gap: 6 },
  detail: {
    color: colors.primary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  title: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  description: { color: colors.muted, fontSize: 15, lineHeight: 22 },
});
