// Synthetic account in an isolated package; never opens the regular app database.
import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { AppRegistry, StatusBar, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initializeDatabase, execute } from '../src/database/database';
import {
  getUserById,
  getUserByUsername,
} from '../src/database/repositories/userRepository';
import { saveSession } from '../src/database/repositories/settingsRepository';
import { useAuthStore } from '../src/stores/authStore';
import { RootNavigator } from '../src/navigation/RootNavigator';

function seed() {
  initializeDatabase();
  let user = getUserByUsername('goalwizardqa');
  if (!user) {
    execute(
      'INSERT INTO users(id,fullName,username,passwordHash,gradeLevel,createdAt,updatedAt) VALUES(?,?,?,?,?,?,?)',
      [
        'goal-wizard-qa-user',
        'QA Student',
        'goalwizardqa',
        'synthetic-not-for-authentication',
        '',
        new Date().toISOString(),
        new Date().toISOString(),
      ],
    );
    user = getUserById('goal-wizard-qa-user');
  }
  saveSession(user.id, true);
  useAuthStore.setState({
    user,
    ready: true,
    hasAccounts: true,
    rememberMe: true,
  });
}
function GoalWizardQA() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    seed();
    setReady(true);
  }, []);
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      {ready ? <RootNavigator /> : <Text>Preparing isolated goal QA…</Text>}
    </SafeAreaProvider>
  );
}
AppRegistry.registerComponent('PiggyPath', () => GoalWizardQA);
