/* Isolated profile QA package only. Never imported by the regular app entry.
 * Fixtures and destructive tests use this package's private database, not com.ipongoal.
 */
import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { AppRegistry, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initializeDatabase, rows, execute } from '../src/database/database';
import {
  getUserById,
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
import { newId } from '../src/utils/id';
import { saveSession } from '../src/database/repositories/settingsRepository';
import { ScreenContainer } from '../src/components/ScreenContainer';
// Precomputed hash of the synthetic QA password ProfileQA123 only. Avoid
// device hashing here: this harness tests profiles, not account registration.
function createQAUser(fullName, username, gradeLevel) {
  const id = newId('user');
  const now = new Date().toISOString();
  execute(
    'INSERT INTO users (id,fullName,username,passwordHash,gradeLevel,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?)',
    [id, fullName, username,
      'pbkdf2-sha256$210000$00000000000000000000000000000000$f2b806fb08944bc71d5d79cd468d7ddcb5a1aa9d5a3480f52ff87215da725ac0',
      gradeLevel, now, now],
  );
  return getUserById(id);
}
async function seed() {
  initializeDatabase();
  let user = getUserByUsername('profileqa');
  if (!user) {
    user = createQAUser(
      'Alexandra Marie Santiago Reyes Long Profile Name',
      'profileqa',
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
    const other = createQAUser(
      'Other QA Account',
      'otherprofileqa',
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
