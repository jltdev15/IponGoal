import React from 'react';
import { Text } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { BrandLogo } from '../components/BrandLogo';
import { theme } from '../theme/theme';
import { appConfig } from '../config/appConfig';
export function AboutScreen() {
  return (
    <ScreenContainer>
      <BrandLogo size={96} />
      <Text style={theme.title}>{appConfig.APP_NAME}</Text>
      <Text style={theme.heading}>{appConfig.SUBTITLE}</Text>
      <Text style={theme.muted}>
        Version {appConfig.APP_VERSION} · Fully offline
      </Text>
      <Text style={theme.body}>
        {appConfig.APP_NAME} is an offline mobile application designed to help
        students set savings goals, record their savings, and understand their
        saving habits.
      </Text>
      <Text style={theme.heading}>Research Purpose</Text>
      <Text style={theme.body}>
        This application was developed as part of a research project focused on
        promoting financial literacy among students.
      </Text>
      <Text style={theme.heading}>Your data stays here</Text>
      <Text style={theme.body}>
        No cloud accounts, advertisements, analytics, or online services. Local
        accounts separate records on this device. Keep your device secure and
        remember that uninstalling the app removes its records.
      </Text>
      <Text style={theme.muted}>
        This application is an educational savings tracker and does not provide
        banking, investment, or professional financial advice.
      </Text>
    </ScreenContainer>
  );
}
