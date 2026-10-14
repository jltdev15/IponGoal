import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from './AppButton';
import { ScreenContainer } from './ScreenContainer';
import { privacyPolicy } from '../data/privacyPolicy';
import { colors } from '../theme/colors';
import { theme } from '../theme/theme';

export function PrivacyPolicyModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  if (!visible) {
    return null;
  }
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView
        edges={['top']}
        style={styles.screen}
        accessibilityViewIsModal
        onAccessibilityEscape={onClose}
      >
        <ScreenContainer
          responsive
          footer={<AppButton title="Close Privacy Policy" onPress={onClose} />}
        >
          <Text accessibilityRole="header" style={theme.title}>
            Privacy Policy
          </Text>
          <Text style={theme.muted}>Updated {privacyPolicy.updated}</Text>
          <Text style={theme.body}>{privacyPolicy.introduction}</Text>
          {privacyPolicy.sections.map(section => (
            <View key={section.title} style={styles.section}>
              <Text accessibilityRole="header" style={theme.heading}>
                {section.title}
              </Text>
              <Text style={theme.body}>{section.body}</Text>
            </View>
          ))}
        </ScreenContainer>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  section: { gap: 8 },
});
