import { usePreventRemove } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Image,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ArrowRight,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Heart,
  LockKeyhole,
  UserRound,
} from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParams } from '../navigation/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { LoginField } from './LoginField';
import { LoginDecor, LoginGradient } from './LoginDecor';
import { theme } from '../theme/theme';
import { colors } from '../theme/colors';
import { useAuthStore } from '../stores/authStore';
import { useFormAction } from '../services/useFormAction';

export function LoginScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'Login'>) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loginSize, setLoginSize] = useState({ width: 0, height: 0 });
  const [keyboardVisible, setKeyboardVisible] = useState(() =>
    Keyboard.isVisible(),
  );
  const { busy, error, run } = useFormAction();
  const login = useAuthStore(s => s.login);
  const insets = useSafeAreaInsets();
  usePreventRemove(busy, () =>
    AccessibilityInfo.announceForAccessibility(
      'Please wait for your account action to finish.',
    ),
  );
  useEffect(() => {
    if (error) {
      AccessibilityInfo.announceForAccessibility(error);
    }
  }, [error]);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const submit = () => {
    void run(async () => {
      await login(username, password, remember);
      setPassword('');
      setPasswordVisible(false);
    }, 'Unable to log in. Please try again.');
  };
  return (
    <View style={styles.root}>
      <LoginDecor />
      <ScreenContainer
        responsive
        actionColumns={false}
        backgroundColor="transparent"
        contentContainerStyle={styles.screenContent}
      >
        {({ compact }) => (
          <View
            style={[
              styles.content,
              compact && styles.compactContent,
              { paddingTop: insets.top + 8 },
            ]}
          >
            <View style={styles.header}>
              {!keyboardVisible && (
                <Image
                  testID="login-hero"
                  source={require('../../assets/branding/login/flower-mascot.png')}
                  resizeMode="contain"
                  accessible={false}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={[styles.hero, compact && styles.compactHero]}
                />
              )}
              <Text
                accessibilityRole="header"
                style={[
                  theme.title,
                  styles.title,
                  compact && styles.compactTitle,
                ]}
              >
                Welcome back
              </Text>
              <View style={styles.subtitle}>
                <Text style={styles.subtitleText}>Good to see you again</Text>
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  <Heart size={18} fill="#FA82A5" color="#FA82A5" />
                </View>
              </View>
            </View>
            <View style={styles.form}>
              <LoginField
                label="Username"
                leadingIcon={<UserRound size={22} color="#626D85" />}
                placeholder="Enter your username"
                editable={!busy}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={32}
              />
              <LoginField
                label="Password"
                leadingIcon={<LockKeyhole size={22} color="#626D85" />}
                placeholder="Enter your password"
                editable={!busy}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!passwordVisible}
                maxLength={128}
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect={false}
                trailingControl={
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      passwordVisible ? 'Hide password' : 'Show password'
                    }
                    accessibilityState={{
                      disabled: busy,
                    }}
                    disabled={busy}
                    onPress={() => setPasswordVisible(visible => !visible)}
                    style={({ pressed }) => [
                      styles.visibility,
                      (pressed || busy) && styles.dimmed,
                    ]}
                  >
                    {passwordVisible ? (
                      <Eye size={22} color="#626D85" />
                    ) : (
                      <EyeOff size={22} color="#626D85" />
                    )}
                  </Pressable>
                }
              />
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel="Remember me on this device"
                accessibilityHint="Opens your profile directly on this device. Use only on a device you trust."
                accessibilityState={{ checked: remember, disabled: busy }}
                disabled={busy}
                onPress={() => setRemember(current => !current)}
                style={({ pressed }) => [
                  styles.remember,
                  (pressed || busy) && styles.dimmed,
                ]}
              >
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={[styles.checkbox, remember && styles.checked]}
                >
                  {remember && (
                    <Check size={21} strokeWidth={3} color={colors.white} />
                  )}
                </View>
                <Text style={styles.rememberText}>
                  Remember me on this device
                </Text>
              </Pressable>
            </View>
            <View testID="login-actions" style={styles.actions}>
              {!!error && (
                <Text accessibilityRole="alert" style={theme.error}>
                  {error}
                </Text>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Login"
                accessibilityState={{ disabled: busy, busy }}
                disabled={busy}
                onPress={submit}
                onLayout={({ nativeEvent: { layout } }) => {
                  setLoginSize(current =>
                    current.width === layout.width &&
                    current.height === layout.height
                      ? current
                      : { width: layout.width, height: layout.height },
                  );
                }}
                style={({ pressed }) => [
                  styles.login,
                  busy && { minHeight: Math.max(56, loginSize.height) },
                  (pressed || busy) && styles.dimmed,
                ]}
              >
                <LoginGradient
                  width={loginSize.width}
                  height={loginSize.height}
                />
                {busy ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <View style={styles.loginLabel}>
                    <View style={styles.arrowSpacer} />
                    <Text style={styles.loginText}>Login</Text>
                    <View
                      style={styles.arrow}
                      accessibilityElementsHidden
                      importantForAccessibility="no-hide-descendants"
                    >
                      <ArrowRight size={24} color={colors.white} />
                    </View>
                  </View>
                )}
              </Pressable>
              {busy && (
                <Text
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                  style={theme.muted}
                >
                  Signing in securely. Please wait.
                </Text>
              )}
              <View style={styles.divider}>
                <View accessible={false} style={styles.line} />
                <Text style={styles.or}>or</Text>
                <View accessible={false} style={styles.line} />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Create a local account"
                accessibilityState={{ disabled: busy }}
                disabled={busy}
                onPress={() => navigation.navigate('Register')}
                style={({ pressed }) => [
                  styles.createAccount,
                  (pressed || busy) && styles.dimmed,
                ]}
              >
                <Text style={styles.createAccountText}>
                  Create a local account
                </Text>
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  <ChevronRight size={22} color={colors.primary} />
                </View>
              </Pressable>
            </View>
          </View>
        )}
      </ScreenContainer>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF9FB' },
  screenContent: { paddingTop: 0, paddingBottom: 8 },
  content: { gap: 28 },
  compactContent: { gap: 16 },
  header: { alignItems: 'center', gap: 8 },
  hero: { width: 180, height: 120 },
  compactHero: { width: 140, height: 80 },
  title: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    width: '100%',
  },
  compactTitle: { fontSize: 28 },
  subtitle: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  subtitleText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#78859F',
    textAlign: 'center',
    flexShrink: 1,
  },
  form: { gap: 16 },
  remember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
  },
  rememberText: {
    color: '#626D85',
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
    minWidth: 0,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#F5A7C5',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: { borderColor: colors.primary, backgroundColor: '#ED1B69' },
  visibility: {
    width: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { gap: 12 },
  login: {
    width: '100%',
    minHeight: 56,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.primary,
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    boxShadow: '0px 7px 18px rgba(201, 24, 87, 0.16)',
  },
  loginLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loginText: {
    flex: 1,
    minWidth: 0,
    textAlign: 'center',
    color: colors.white,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  arrow: { width: 24, alignItems: 'center' },
  arrowSpacer: { width: 24 },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  line: { flex: 1, height: 1, backgroundColor: '#FAD6E3' },
  or: { fontSize: 14, lineHeight: 22, color: '#78859F' },
  createAccount: {
    minHeight: 48,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  createAccountText: {
    color: colors.primary,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
  dimmed: { opacity: 0.65 },
});
