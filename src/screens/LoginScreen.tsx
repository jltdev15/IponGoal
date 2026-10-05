import { usePreventRemove } from '@react-navigation/native';
import React, { useState } from 'react';
import { AccessibilityInfo, Pressable, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParams } from '../navigation/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppInput } from '../components/AppInput';
import { AppButton } from '../components/AppButton';
import { BrandLogo } from '../components/BrandLogo';
import { Icon } from '../components/Icon';
import { theme } from '../theme/theme';
import { colors } from '../theme/colors';
import { useAuthStore } from '../stores/authStore';
import { useFormAction } from '../services/useFormAction';
export function LoginScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'Login'>) {
  const [username, setUsername] = useState(''),
    [password, setPassword] = useState(''),
    [remember, setRemember] = useState(false);
  const { busy, error, run } = useFormAction(),
    login = useAuthStore(s => s.login);
  usePreventRemove(busy, () => {
    AccessibilityInfo.announceForAccessibility(
      'Please wait for your account action to finish.',
    );
  });
  return (
    <ScreenContainer
      responsive
      actionColumns={false}
      footer={({ columns }) => (
        <AppButton
          style={columns ? { flex: 1 } : undefined}
          title="Login"
          loading={busy}
          disabled={busy}
          onPress={() => {
            void run(async () => {
              await login(username, password, remember);
              setPassword('');
            }, 'Unable to log in. Please try again.');
          }}
        />
      )}
      secondaryFooter={({ columns }) => (
        <AppButton
          style={columns ? { flex: 1 } : undefined}
          title="Create a Local Account"
          disabled={busy}
          variant="secondary"
          onPress={() => navigation.navigate('Register')}
        />
      )}
    >
      {({ compact }) => (
        <>
          <View style={{ gap: compact ? 8 : 12 }}>
            <BrandLogo size={compact ? 64 : 80} />
            <Text style={theme.title}>Welcome back</Text>
            <Text style={theme.muted}>
              Your next goal is one small saving away.
            </Text>
          </View>
          <AppInput
            label="Username"
            placeholder="Enter your username"
            editable={!busy}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={32}
          />
          <AppInput
            label="Password"
            placeholder="Enter your password"
            editable={!busy}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
          />
          <View style={{ gap: 4 }}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: remember, disabled: busy }}
              disabled={busy}
              accessibilityLabel="Remember Me"
              onPress={() => setRemember(!remember)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                minHeight: 48,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: colors.primary,
                  backgroundColor: remember ? colors.primary : colors.surface,
                }}
              >
                {remember && (
                  <Icon name="check" size={22} color={colors.white} />
                )}
              </View>
              <Text style={[theme.body, { flex: 1 }]}>Remember Me</Text>
            </Pressable>
            <Text style={theme.muted}>
              Remember Me opens your profile directly on this device. Use it
              only on a device you trust.
            </Text>
          </View>
          {!!error && (
            <Text accessibilityRole="alert" style={theme.error}>
              {error}
            </Text>
          )}
          {busy && (
            <Text accessibilityRole="alert" style={theme.muted}>
              Signing in securely. Please wait.
            </Text>
          )}
        </>
      )}
    </ScreenContainer>
  );
}
