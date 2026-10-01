import React from 'react';
import { Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParams } from '../navigation/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppButton } from '../components/AppButton';
import { BrandLogo } from '../components/BrandLogo';
import { theme } from '../theme/theme';
import { appConfig } from '../config/appConfig';
export function WelcomeScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'Welcome'>) {
  return (
    <ScreenContainer>
      <View style={{ flex: 1, justifyContent: 'center', gap: 28 }}>
        <BrandLogo size={144} />
        <Text style={theme.muted}>YOUR SMALL SAVINGS. YOUR BIG GOALS.</Text>
        <Text style={[theme.title, { fontSize: 40 }]}>
          {appConfig.APP_NAME}
        </Text>
        <Text style={[theme.heading, { fontSize: 26, lineHeight: 34 }]}>
          Turn small savings into meaningful goals.
        </Text>
        <Text style={theme.body}>
          Create a goal, save consistently, and watch your progress grow.
        </Text>
        <Text style={theme.muted}>Fully offline · Private to this device</Text>
      </View>
      <AppButton
        title="Get Started"
        onPress={() => navigation.navigate('Register')}
      />
      <AppButton
        title="I Already Have an Account"
        variant="secondary"
        onPress={() => navigation.navigate('Login')}
      />
    </ScreenContainer>
  );
}
