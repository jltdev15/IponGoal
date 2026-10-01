import { usePreventRemove } from '@react-navigation/native';
import React, { useState } from 'react';
import { AccessibilityInfo, Text } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppInput } from '../components/AppInput';
import { AppButton } from '../components/AppButton';
import { theme } from '../theme/theme';
import { useAuthStore } from '../stores/authStore';
import { useFormAction } from '../services/useFormAction';
export function RegisterScreen() {
  const [name, setName] = useState(''),
    [username, setUsername] = useState(''),
    [password, setPassword] = useState(''),
    [confirm, setConfirm] = useState('');
  const { busy, error, run } = useFormAction(),
    register = useAuthStore(s => s.register);
  usePreventRemove(busy, () => {
    AccessibilityInfo.announceForAccessibility(
      'Please wait for your account action to finish.',
    );
  });
  return (
    <ScreenContainer>
      <Text style={theme.title}>Start your saving journey</Text>
      <Text style={theme.muted}>
        Your account stays on this device. Choose a password you can remember.
      </Text>
      <AppInput
        label="Full Name"
        placeholder="Enter your full name"
        editable={!busy}
        value={name}
        onChangeText={setName}
        autoComplete="name"
        maxLength={80}
      />
      <AppInput
        label="Username"
        placeholder="Choose a username"
        editable={!busy}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        helper="At least 4 letters, numbers, or underscores."
        maxLength={32}
      />
      <AppInput
        label="Password"
        placeholder="Create a password"
        editable={!busy}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        helper="At least 6 characters."
      />
      <AppInput
        label="Confirm Password"
        placeholder="Re-enter your password"
        editable={!busy}
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        autoComplete="new-password"
      />
      {!!error && (
        <Text accessibilityRole="alert" style={theme.error}>
          {error}
        </Text>
      )}
      {busy && (
        <Text accessibilityRole="alert" style={theme.muted}>
          Creating your account securely. This may take a few seconds.
        </Text>
      )}
      <AppButton
        title="Create Account"
        loading={busy}
        disabled={busy}
        onPress={() => {
          void run(async () => {
            await register(name, username, password, confirm, '');
            setPassword('');
            setConfirm('');
          }, 'Unable to create your account. Please try again.');
        }}
      />
    </ScreenContainer>
  );
}
