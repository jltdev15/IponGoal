import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParams } from '../navigation/types';
import { useTabBarClearance } from '../navigation/useTabBarClearance';
import { useAuthStore } from '../stores/authStore';
import { ProfileAvatar } from './ProfileAvatar';
import { colors } from '../theme/colors';
import { theme } from '../theme/theme';

export function usePrimaryScreenLayout() {
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const clearance = useTabBarClearance();
  const narrow = width < 380;
  return {
    stacked: narrow || fontScale > 1.2,
    contentStyle: [
      primaryStyles.content,
      narrow && primaryStyles.narrowContent,
      { paddingTop: insets.top + 16, paddingBottom: clearance + 24 },
    ],
  };
}

export function PrimaryScreenHeader({
  title,
  subtitle,
  profileShortcut = false,
}: {
  title: string;
  subtitle?: string;
  profileShortcut?: boolean;
}) {
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParams>>();
  const user = useAuthStore(s => s.user)!;
  return (
    <View style={primaryStyles.header}>
      <View style={primaryStyles.flex}>
        {!!subtitle && <Text style={theme.muted}>{subtitle}</Text>}
        <Text accessibilityRole="header" style={primaryStyles.title}>
          {title}
        </Text>
      </View>
      {profileShortcut && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open your profile"
          onPress={() =>
            navigation.navigate('BottomTabs', { screen: 'Profile' })
          }
          style={({ pressed }) => [
            primaryStyles.avatarButton,
            pressed && primaryStyles.pressed,
          ]}
        >
          <View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <ProfileAvatar
              fullName={user.fullName}
              photo={user.profilePhoto}
              size={44}
            />
          </View>
        </Pressable>
      )}
    </View>
  );
}

export const primaryStyles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  narrowContent: { paddingHorizontal: 16 },
  list: { flex: 1, overflow: 'hidden' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  header: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flex: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.6,
  },
  avatarButton: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.75 },
  stacked: { flexDirection: 'column', alignItems: 'stretch' },
});
