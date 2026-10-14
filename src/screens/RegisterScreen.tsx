import { usePreventRemove } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParams } from '../navigation/types';
import React, { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Image,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppInput } from '../components/AppInput';
import { AppButton } from '../components/AppButton';
import { PrivacyPolicyModal } from '../components/PrivacyPolicyModal';
import { Check } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { colors } from '../theme/colors';
import { useAuthStore } from '../stores/authStore';
import { useFormAction } from '../services/useFormAction';
import { validateRegistration } from '../utils/validation';

const steps = [
  {
    title: 'What should we call you?',
    message: 'Every saving journey starts with you. Let’s get acquainted!',
    image: require('../../assets/branding/registration/wave.png'),
  },
  {
    title: 'Pick your username',
    message: 'Choose a little name that’s uniquely yours.',
    image: require('../../assets/branding/registration/identity.png'),
  },
  {
    title: 'Keep your account safe',
    message: 'Let’s give your savings journey a trusty little shield.',
    image: require('../../assets/branding/registration/shield.png'),
  },
  {
    title: 'Ready to start saving?',
    message: 'One last peek, and you’re on your way to big goals!',
    image: require('../../assets/branding/registration/celebrate.png'),
  },
];

export function RegisterScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'Register'>) {
  const { width, height, fontScale } = useWindowDimensions();
  const smallArtwork = width < 360 || height < 600 || fontScale > 1.2;
  const [step, setStep] = useState(0);
  const [editingReview, setEditingReview] = useState(false);
  const [editDraft, setEditDraft] = useState<{
    name: string;
    username: string;
    password: string;
    confirm: string;
  } | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const [showSubmitError, setShowSubmitError] = useState(false);
  const { busy, error, run } = useFormAction();
  const register = useAuthStore(s => s.register);
  const user = useAuthStore(s => s.user);
  const current = steps[step];
  const visibleError = fieldError || (showSubmitError ? error : '');

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(
      `Step ${step + 1} of 4. ${steps[step].title}`,
    );
  }, [step]);
  useEffect(() => {
    if (visibleError) {
      AccessibilityInfo.announceForAccessibility(visibleError);
    }
  }, [visibleError]);

  function moveTo(next: number) {
    Keyboard.dismiss();
    setFieldError('');
    setShowSubmitError(false);
    setStep(next);
  }
  function back() {
    if (busy) {
      return;
    }
    if (editingReview) {
      if (editDraft) {
        setName(editDraft.name);
        setUsername(editDraft.username);
        setPassword(editDraft.password);
        setConfirm(editDraft.confirm);
      }
      setEditDraft(null);
      setEditingReview(false);
      moveTo(3);
    } else if (step === 0) {
      Keyboard.dismiss();
      navigation.goBack();
    } else {
      moveTo(Math.max(0, step - 1));
    }
  }
  usePreventRemove(!user && (busy || step > 0 || editingReview), () => {
    if (busy) {
      AccessibilityInfo.announceForAccessibility(
        'Please wait for your account action to finish.',
      );
    } else {
      back();
    }
  });
  function clearFieldError() {
    setFieldError('');
    setShowSubmitError(false);
  }
  function continueStep() {
    if (busy) {
      return;
    }
    let message = '';
    if (step === 0 && !name.trim()) {
      message = 'Please enter your full name.';
    } else if (step === 1 && !/^[a-zA-Z0-9_]{4,32}$/.test(username.trim())) {
      message = 'Username must be 4–32 letters, numbers, or underscores.';
    } else if (step === 2) {
      try {
        validateRegistration(name, username, password, confirm);
      } catch (e) {
        message = (e as Error).message;
      }
    }
    if (message) {
      setFieldError(message);
      return;
    }
    moveTo(editingReview ? 3 : step + 1);
    setEditingReview(false);
    setEditDraft(null);
  }
  function edit(target: number) {
    if (!busy) {
      setEditDraft({ name, username, password, confirm });
      setEditingReview(true);
      moveTo(target);
    }
  }
  function submit() {
    if (busy || privacyVisible) {
      return;
    }
    if (!privacyAccepted) {
      setFieldError('Please read and agree to the Privacy Policy to continue.');
      return;
    }
    setFieldError('');
    setShowSubmitError(true);
    void run(async () => {
      validateRegistration(name, username, password, confirm);
      try {
        await register(
          name.trim(),
          username.trim().toLowerCase(),
          password,
          confirm,
          '',
        );
      } catch (e) {
        if (e instanceof Error && e.message.startsWith('This username')) {
          setEditDraft({ name, username, password, confirm });
          moveTo(1);
          setEditingReview(true);
          setFieldError(e.message);
        }
        throw e;
      }
      setPassword('');
      setConfirm('');
    }, 'Unable to create your account. Please try again.');
  }

  return (
    <>
      <ScreenContainer
        key={step}
        responsive
        keepActionsInFooter
        footer={({ columns }) => (
          <AppButton
            style={columns ? { flex: 1 } : undefined}
            title={step === 3 ? 'Create Account' : 'Continue'}
            loading={busy}
            disabled={busy || (step === 3 && !privacyAccepted)}
            onPress={step === 3 ? submit : continueStep}
          />
        )}
        secondaryFooter={({ columns }) => (
          <AppButton
            style={columns ? { flex: 1 } : undefined}
            title="Back"
            variant="secondary"
            disabled={busy}
            onPress={back}
          />
        )}
      >
        {({ compact }) => (
          <>
            <View
              accessibilityRole="progressbar"
              accessibilityLabel="Account creation progress"
              accessibilityValue={{
                min: 1,
                max: 4,
                now: step + 1,
                text: `Step ${step + 1} of 4`,
              }}
              style={styles.progress}
            >
              <Text style={styles.stepLabel}>Step {step + 1} of 4</Text>
              <View style={styles.track} accessible={false}>
                {steps.map((_, index) => (
                  <View
                    key={index}
                    style={[styles.segment, index <= step && styles.complete]}
                  />
                ))}
              </View>
            </View>
            <View style={styles.hero}>
              <Image
                source={current.image}
                style={[
                  styles.mascot,
                  compact && styles.compactMascot,
                  smallArtwork && styles.smallMascot,
                ]}
                resizeMode="contain"
                accessible={false}
                importantForAccessibility="no"
              />
              <Text
                accessibilityRole="header"
                style={[theme.title, styles.centered, styles.title]}
              >
                {current.title}
              </Text>
              <Text style={[theme.muted, styles.centered]}>
                {current.message}
              </Text>
            </View>
            <View style={[styles.fields, compact && styles.compactFields]}>
              {step === 0 && (
                <AppInput
                  label="Full Name"
                  placeholder="Enter your full name"
                  editable={!busy}
                  value={name}
                  onChangeText={value => {
                    setName(value);
                    clearFieldError();
                  }}
                  autoComplete="name"
                  maxLength={80}
                  returnKeyType="done"
                  onSubmitEditing={continueStep}
                />
              )}
              {step === 1 && (
                <AppInput
                  label="Username"
                  placeholder="Choose a username"
                  editable={!busy}
                  value={username}
                  onChangeText={value => {
                    setUsername(value);
                    clearFieldError();
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  helper="4–32 letters, numbers, or underscores."
                  maxLength={32}
                  returnKeyType="done"
                  onSubmitEditing={continueStep}
                />
              )}
              {step === 2 && (
                <>
                  <AppInput
                    label="Password"
                    placeholder="Create a password"
                    editable={!busy}
                    value={password}
                    onChangeText={value => {
                      setPassword(value);
                      clearFieldError();
                    }}
                    secureTextEntry
                    autoComplete="new-password"
                    helper="6–128 characters."
                  />
                  <AppInput
                    label="Confirm Password"
                    placeholder="Re-enter your password"
                    editable={!busy}
                    value={confirm}
                    onChangeText={value => {
                      setConfirm(value);
                      clearFieldError();
                    }}
                    secureTextEntry
                    autoComplete="new-password"
                    returnKeyType="done"
                    onSubmitEditing={continueStep}
                  />
                </>
              )}
              {step === 3 && (
                <>
                  <View style={[theme.card, styles.reviewCard]}>
                    {[
                      { label: 'Full Name', value: name.trim(), target: 0 },
                      {
                        label: 'Username',
                        value: username.trim().toLowerCase(),
                        target: 1,
                      },
                      { label: 'Password', value: 'Password set', target: 2 },
                    ].map(item => (
                      <View key={item.label} style={styles.reviewRow}>
                        <View style={styles.reviewValue}>
                          <Text style={theme.muted}>{item.label}</Text>
                          <Text style={theme.body}>{item.value}</Text>
                        </View>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Edit ${item.label}`}
                          accessibilityState={{ disabled: busy }}
                          disabled={busy}
                          onPress={() => edit(item.target)}
                          style={styles.editButton}
                        >
                          <Text style={styles.editText}>Edit</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                  <View style={styles.explanation}>
                    <Text style={theme.heading}>Before we begin</Text>
                    <Text style={theme.body}>
                      Your account and savings are saved on this device. Use
                      your username and password to sign in. After creating your
                      account, you can set your first savings goal.
                    </Text>
                  </View>
                  <View style={[theme.card, styles.privacyCard]}>
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityLabel="I have read and agree to the Privacy Policy"
                      accessibilityHint="Required to create your account. Read the policy using the link below."
                      accessibilityState={{
                        checked: privacyAccepted,
                        disabled: busy,
                      }}
                      disabled={busy}
                      onPress={() => {
                        if (!busy) {
                          setPrivacyAccepted(accepted => !accepted);
                          clearFieldError();
                        }
                      }}
                      style={({ pressed }) => [
                        styles.privacyCheckboxRow,
                        (pressed || busy) && styles.dimmed,
                      ]}
                    >
                      <View
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                        style={[
                          styles.checkbox,
                          privacyAccepted && styles.checked,
                        ]}
                      >
                        {privacyAccepted && (
                          <Check
                            size={20}
                            strokeWidth={3}
                            color={colors.white}
                          />
                        )}
                      </View>
                      <Text style={[theme.body, styles.privacyLabel]}>
                        I have read and agree to the Privacy Policy.
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="link"
                      accessibilityLabel="Read Privacy Policy"
                      accessibilityState={{ disabled: busy }}
                      disabled={busy}
                      onPress={() => {
                        if (!busy) {
                          Keyboard.dismiss();
                          setPrivacyVisible(true);
                        }
                      }}
                      style={styles.policyLink}
                    >
                      <Text style={styles.policyLinkText}>
                        Read Privacy Policy
                      </Text>
                    </Pressable>
                    <Text style={theme.muted}>
                      Required before creating your account.
                    </Text>
                  </View>
                </>
              )}
            </View>
            {!!visibleError && (
              <Text accessibilityRole="alert" style={theme.error}>
                {visibleError}
              </Text>
            )}
            {busy && (
              <Text accessibilityRole="alert" style={theme.muted}>
                Creating your account securely. This may take a few seconds.
              </Text>
            )}
          </>
        )}
      </ScreenContainer>
      <PrivacyPolicyModal
        visible={privacyVisible}
        onClose={() => setPrivacyVisible(false)}
      />
    </>
  );
}
const styles = StyleSheet.create({
  progress: { paddingTop: 8, gap: 14 },
  title: { fontSize: 30 },
  stepLabel: {
    ...theme.muted,
    color: colors.primary,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  track: { flexDirection: 'row', gap: 8 },
  segment: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  complete: { backgroundColor: colors.primary },
  hero: { alignItems: 'center', paddingTop: 12, gap: 16 },
  compactFields: { gap: 12 },
  compactMascot: { width: 224, height: 224 },
  smallMascot: { width: 160, height: 160 },
  mascot: { width: 256, height: 256 },
  centered: { textAlign: 'center' },
  fields: { paddingTop: 12, gap: 20 },
  reviewCard: { gap: 16 },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reviewValue: { flex: 1, gap: 4 },
  editButton: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editText: { color: colors.primary, fontWeight: '600', fontSize: 16 },
  privacyCard: { gap: 4 },
  privacyCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    paddingVertical: 8,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checked: { backgroundColor: colors.primary, borderColor: colors.primary },
  privacyLabel: { flex: 1 },
  policyLink: {
    minHeight: 48,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  policyLinkText: {
    ...theme.body,
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  dimmed: { opacity: 0.6 },
  explanation: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    gap: 16,
  },
});
