/* Isolated profile QA package only. Never imported by the regular app entry.
 * Fixtures and destructive tests use this package's private database, not com.ipongoal.
 */
import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { AppRegistry, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initializeDatabase, rows } from '../src/database/database';
import {
  createUser,
  getUserByUsername,
} from '../src/database/repositories/userRepository';
import {
  createGoal,
  archiveGoal,
} from '../src/database/repositories/goalRepository';
import { useAuthStore } from '../src/stores/authStore';
import { useGoalStore } from '../src/stores/goalStore';
import { useSavingsStore } from '../src/stores/savingsStore';
import { RootNavigator } from '../src/navigation/RootNavigator';
import { saveSession } from '../src/database/repositories/settingsRepository';
import { ScreenContainer } from '../src/components/ScreenContainer';
async function seed() {
  initializeDatabase();
  let user = getUserByUsername('profileqa');
  if (!user) {
    user = await createUser(
      'Alexandra Marie Santiago Reyes Long Profile Name',
      'profileqa',
      'ProfileQA123',
      'ProfileQA123',
      'Grade 11',
    );
    const input = {
      name: 'Active QA goal',
      targetAmount: 30000,
      targetDate: null,
      category: 'School',
      icon: 'book',
      note: '',
    };
    createGoal(user.id, input, 10000);
    createGoal(
      user.id,
      { ...input, name: 'Completed QA goal', targetAmount: 20000 },
      20000,
    );
    const archived = createGoal(
      user.id,
      { ...input, name: 'Archived QA goal' },
      5000,
    );
    archiveGoal(user.id, archived);
    const other = await createUser(
      'Other QA Account',
      'otherprofileqa',
      'ProfileQA123',
      'ProfileQA123',
      '',
    );
    createGoal(other.id, { ...input, name: 'Other account QA goal' }, 7500);
  }
  saveSession(user.id, true);
  useAuthStore.setState({
    user,
    ready: true,
    hasAccounts: true,
    rememberMe: false,
  });
  useGoalStore.getState().refresh(user.id);
  useSavingsStore.getState().refresh(user.id);
}
function ProfileQA() {
  const user = useAuthStore(s => s.user);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    seed()
      .then(() => setReady(true))
      .catch(() => setError(true));
  }, []);
  return (
    <SafeAreaProvider>
      {error ? (
        <Text>QA fixture setup failed</Text>
      ) : !ready ? (
        <Text>Preparing isolated QA fixtures…</Text>
      ) : !user ? (
        <ScreenContainer>
          <Text>QA session ended</Text>
          <Text>
            Local accounts remaining:{' '}
            {rows('SELECT COUNT(*) AS count FROM users')[0].count}
          </Text>
          <Text>
            Local goals remaining:{' '}
            {rows('SELECT COUNT(*) AS count FROM goals')[0].count}
          </Text>
          <Text>
            Local savings records remaining:{' '}
            {rows('SELECT COUNT(*) AS count FROM savings')[0].count}
          </Text>
        </ScreenContainer>
      ) : (
        <RootNavigator />
      )}
    </SafeAreaProvider>
  );
}
AppRegistry.registerComponent('PiggyPath', () => ProfileQA);
