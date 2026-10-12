import React, { useCallback, useState } from 'react';
import {
  Animated,
  BackHandler,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthStackParams } from '../navigation/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppButton } from '../components/AppButton';
import { colors } from '../theme/colors';
import { theme } from '../theme/theme';
import { useWelcomeIntro } from './useWelcomeIntro';
import { useWelcomeTaps } from './useWelcomeTaps';
import { WelcomeBackground } from './WelcomeBackground';

const steps = [
  {
    image: require('../../assets/branding/onboarding/goal.png'),
    title: 'Set your goal',
    description: 'Pick something you’d love to save for.',
  },
  {
    image: require('../../assets/branding/onboarding/saving.png'),
    title: 'Save little by little',
    description: 'Add your savings whenever you can.',
  },
  {
    image: require('../../assets/branding/onboarding/progress.png'),
    title: 'Watch your progress',
    description: 'See how each contribution brings you closer.',
  },
];

export function WelcomeScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'Welcome'>) {
  const [step, setStep] = useState(0);
  const { welcome, continueToOnboarding, art, message, page } =
    useWelcomeIntro();
  const { tapCount, tapLogo, resetLogoTaps } = useWelcomeTaps(
    welcome,
    continueToOnboarding,
  );
  const currentStep = steps[step];
  const finalStep = step === steps.length - 1;
  const { fontScale, width, height } = useWindowDimensions();
  const smallArtwork = height < 600 || width < 360 || fontScale > 1.2;

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          if (welcome || step === 0) {
            return false;
          }
          setStep(current => Math.max(0, current - 1));
          return true;
        },
      );
      return () => subscription.remove();
    }, [step, welcome]),
  );

  const artwork = (compact: boolean) => (
    <Image
      source={
        welcome
          ? require('../../assets/branding/piggypath-icon.png')
          : currentStep.image
      }
      resizeMode="contain"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.illustration,
        compact && styles.compactIllustration,
        smallArtwork && styles.smallIllustration,
      ]}
    />
  );

  return (
    <View
      testID="welcome-touch-surface"
      style={styles.screen}
      onTouchStart={welcome ? resetLogoTaps : undefined}
    >
      <WelcomeBackground />
      <SafeAreaView edges={['top']} style={styles.safeContent}>
        <ScreenContainer
          responsive
          backgroundColor="transparent"
          actionColumns={false}
          footer={
            welcome ? undefined : (
              <View
                testID="onboarding-controls"
                style={[
                  styles.controls,
                  finalStep && styles.stackedControls,
                ]}
              >
                {finalStep ? (
                  <>
                    <AppButton
                      title="Get Started"
                      onPress={() => navigation.navigate('Register')}
                    />
                    <AppButton
                      title="Login"
                      variant="secondary"
                      style={styles.outlinedAction}
                      onPress={() => navigation.navigate('Login')}
                    />
                  </>
                ) : (
                  <>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Skip"
                      onPress={() => setStep(steps.length - 1)}
                      style={({ pressed }) => [
                        styles.skipButton,
                        { opacity: pressed ? 0.6 : 1 },
                      ]}
                    >
                      <Text style={styles.skipText}>Skip</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Next"
                      onPress={() =>
                        setStep(current =>
                          Math.min(steps.length - 1, current + 1),
                        )
                      }
                      style={({ pressed }) => [
                        styles.nextButton,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <Text style={styles.nextText}>Next</Text>
                      <View importantForAccessibility="no-hide-descendants">
                        <ArrowRight size={22} color={colors.white} />
                      </View>
                    </Pressable>
                  </>
                )}
              </View>
            )
          }
        >
          {({ compact }) => (
            <Animated.View style={[styles.content, { opacity: page }]}>
              <View style={[styles.hero, compact && styles.compactHero]}>
                <Animated.View
                  style={
                    welcome
                      ? {
                          opacity: art,
                          transform: [
                            {
                              translateY: art.interpolate({
                                inputRange: [0, 1],
                                outputRange: [16, 0],
                              }),
                            },
                          ],
                        }
                      : undefined
                  }
                >
                  {welcome ? (
                    <Pressable
                      testID="welcome-logo"
                      accessibilityRole="button"
                      accessibilityLabel="PiggyPath logo"
                      accessibilityHint="Activate three times to begin onboarding. Tapping elsewhere resets your progress."
                      accessibilityState={{ disabled: tapCount === 3 }}
                      focusable
                      disabled={tapCount === 3}
                      onPress={tapLogo}
                      onTouchStart={event => event.stopPropagation()}
                      style={({ pressed }) => [
                        styles.logoButton,
                        { opacity: pressed ? 0.75 : 1 },
                      ]}
                    >
                      {artwork(compact)}
                    </Pressable>
                  ) : (
                    artwork(compact)
                  )}
                </Animated.View>
                <Animated.View
                  style={[styles.message, welcome && { opacity: message }]}
                >
                  <Text
                    accessibilityRole="header"
                    style={[theme.title, styles.centered]}
                  >
                    {welcome ? 'Welcome to PiggyPath' : currentStep.title}
                  </Text>
                  <Text style={[theme.body, styles.description]}>
                    {welcome
                      ? 'Big goals begin with small savings. Give each peso a purpose, and take one small step toward something that matters to you.'
                      : currentStep.description}
                  </Text>
                  {welcome && (
                    <View style={styles.tapInstruction}>
                      <Text style={[theme.body, styles.centered]}>
                        Tap the piggy 3 times to begin
                      </Text>
                      <View
                        testID="welcome-tap-progress"
                        accessible
                        accessibilityRole="progressbar"
                        accessibilityLabel="Logo taps"
                        accessibilityValue={{
                          min: 0,
                          max: 3,
                          now: tapCount,
                          text: `${tapCount} of 3 taps`,
                        }}
                        accessibilityLiveRegion="polite"
                      >
                        <Text style={styles.tapCount}>{`${tapCount}/3`}</Text>
                      </View>
                    </View>
                  )}
                </Animated.View>
              </View>
              {!welcome && (
                <View
                  accessible
                  accessibilityRole="progressbar"
                  accessibilityLabel={`Step ${step + 1} of ${steps.length}`}
                  accessibilityValue={{
                    min: 1,
                    max: steps.length,
                    now: step + 1,
                  }}
                  accessibilityLiveRegion="polite"
                  style={styles.progress}
                >
                  {steps.map((item, index) => (
                    <View
                      key={item.title}
                      accessible={false}
                      testID={`onboarding-dot-${index}`}
                      style={[styles.dot, index === step && styles.activeDot]}
                    />
                  ))}
                </View>
              )}
            </Animated.View>
          )}
        </ScreenContainer>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF8F4' },
  safeContent: { flex: 1 },
  logoButton: { borderRadius: 28, overflow: 'hidden' },
  tapInstruction: { gap: 8, alignItems: 'center', marginTop: 8 },
  tapCount: { color: colors.primary, fontSize: 18, fontWeight: '700' },
  content: { flexGrow: 1 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  stackedControls: { flexDirection: 'column', alignItems: 'stretch' },
  outlinedAction: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  skipButton: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    paddingRight: 16,
  },
  skipText: { color: colors.muted, fontSize: 16, fontWeight: '500' },
  nextButton: {
    minWidth: 104,
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  nextText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  hero: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    gap: 32,
  },
  compactHero: { paddingVertical: 16, gap: 24 },
  illustration: {
    width: 256,
    height: 256,
  },
  compactIllustration: { width: 224, height: 224 },
  smallIllustration: { width: 160, height: 160 },
  message: { width: '100%', maxWidth: 320, gap: 12 },
  centered: { textAlign: 'center' },
  description: { textAlign: 'center', color: colors.muted },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  dot: {
    width: 22,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  activeDot: { width: 28, backgroundColor: colors.primary },
});
