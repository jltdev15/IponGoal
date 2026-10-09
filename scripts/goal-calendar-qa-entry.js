// Isolated native calendar preview; no database, authentication, or goal stores.
import React, { useState } from 'react';
import { AppRegistry, StatusBar, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CalendarDateField } from '../src/components/CalendarDateField';
import { ScreenContainer } from '../src/components/ScreenContainer';
import { AppButton } from '../src/components/AppButton';
import { theme } from '../src/theme/theme';
function GoalCalendarQA() {
  const [date, setDate] = useState('');
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <ScreenContainer responsive>
        <Text accessibilityRole="header" style={theme.title}>
          Goal calendar · QA
        </Text>
        <CalendarDateField
          label="Target Date (optional)"
          value={date}
          onChange={setDate}
        />
        <Text style={theme.body}>
          Stored calendar value: {date || 'No deadline'}
        </Text>
        <AppButton
          title="Preview saved date"
          onPress={() => setDate('2026-12-31')}
        />
      </ScreenContainer>
    </SafeAreaProvider>
  );
}
AppRegistry.registerComponent('PiggyPath', () => GoalCalendarQA);
