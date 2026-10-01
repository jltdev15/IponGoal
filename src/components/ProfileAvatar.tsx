import React, { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { theme } from '../theme/theme';

export function ProfileAvatar({
  fullName,
  photo,
  size = 80,
}: {
  fullName: string;
  photo: string | null;
  size?: number;
}) {
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);
  const initials = fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(n => n[0] || '')
    .join('')
    .toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.35,
        overflow: 'hidden',
        backgroundColor: colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {photo && photo !== failedPhoto ? (
        <Image
          source={{ uri: photo }}
          style={{ width: size, height: size }}
          resizeMode="cover"
          accessible
          accessibilityLabel={`${fullName}'s profile photo`}
          onError={() => setFailedPhoto(photo)}
        />
      ) : (
        <Text
          accessibilityLabel={`${fullName}'s initials`}
          style={[theme.title, { color: colors.primary }]}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}
