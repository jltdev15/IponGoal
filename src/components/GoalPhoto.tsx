import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Icon } from './Icon';
import { colors } from '../theme/colors';

export function GoalPhoto({
  photo,
  icon,
  name,
  large = false,
}: {
  photo: string | null;
  icon: string;
  name: string;
  large?: boolean;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  return (
    <View style={[styles.frame, large && styles.large]}>
      {photo && photo !== failed ? (
        <Image
          source={{ uri: photo }}
          resizeMode="cover"
          style={styles.image}
          accessibilityLabel={`Photo for ${name}`}
          accessible={large}
          onError={() => setFailed(photo)}
        />
      ) : (
        <Icon name={icon} size={large ? 48 : 22} />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  frame: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  large: { width: '100%', height: 180, borderRadius: 20 },
  image: { width: '100%', height: '100%' },
});
