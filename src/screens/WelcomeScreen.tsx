import React, { useCallback, useState } from 'react';
import {
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
import { AuthStackParams } from '../navigation/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppButton } from '../components/AppButton';
import { colors } from '../theme/colors';
import { theme } from '../theme/theme';

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
  const currentStep = steps[step];
  const finalStep = step === steps.length - 1;
  const { fontScale, width, height } = useWindowDimensions();
  const stackActions = fontScale > 1.2;
  const smallArtwork = height < 600 || width < 360 || stackActions;

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          if (step === 0) {
            return false;
          }
          setStep(current => Math.max(0, current - 1));
          return true;
        },
      );
      return () => subscription.remove();
    }, [step]),
  );

  return (
    <ScreenContainer
      responsive
      actionColumns={false}
      footer={
        <View
          testID="onboarding-controls"
          style={[
            styles.controls,
            finalStep && stackActions && styles.stackedControls,
          ]}
        >
          {finalStep ? (
            <>
              <AppButton
                title="Login"
                variant="secondary"
                style={[
                  !stackActions && styles.sharedAction,
                  styles.outlinedAction,
                ]}
                onPress={() => navigation.navigate('Login')}
              />
              <AppButton
                title="Get Started"
                style={!stackActions ? styles.sharedAction : undefined}
                onPress={() => navigation.navigate('Register')}
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
                  setStep(current => Math.min(steps.length - 1, current + 1))
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
      }
    >
      {({ compact }) => (
        <View style={styles.content}>
          <View style={[styles.hero, compact && styles.compactHero]}>
            <Image
              source={currentStep.image}
              resizeMode="contain"
              accessible={false}
              importantForAccessibility="no-hide-descendants"
              style={[
                styles.illustration,
                compact && styles.compactIllustration,
                smallArtwork && styles.smallIllustration,
              ]}
            />
            <View style={styles.message}>
              <Text
                accessibilityRole="header"
                style={[theme.title, styles.centered]}
              >
                {currentStep.title}
              </Text>
              <Text style={[theme.body, styles.description]}>
                {currentStep.description}
              </Text>
            </View>
          </View>
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={`Step ${step + 1} of ${steps.length}`}
            accessibilityValue={{ min: 1, max: steps.length, now: step + 1 }}
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
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  stackedControls: { flexDirection: 'column', alignItems: 'stretch' },
  sharedAction: { flex: 1 },
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
