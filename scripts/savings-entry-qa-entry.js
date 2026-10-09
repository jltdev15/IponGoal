// Synthetic records in com.ipongoal.savingsentryqa only. Never distribute.
import 'react-native-get-random-values';
import React from 'react';
import { AppRegistry, StatusBar, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initializeDatabase, execute } from '../src/database/database';
import { getUserById } from '../src/database/repositories/userRepository';
import { useAuthStore } from '../src/stores/authStore';
import { refreshData } from '../src/services/refresh';
import { SavingsDetailsScreen } from '../src/screens/SavingsDetailsScreen';
import { SavingsFormScreen } from '../src/screens/SavingsFormScreen';
import { GoalDetailsScreen } from '../src/screens/GoalDetailsScreen';
import { ScreenContainer } from '../src/components/ScreenContainer';
import { AppButton } from '../src/components/AppButton';
import { colors } from '../src/theme/colors';
import { theme } from '../src/theme/theme';

const Stack = createNativeStackNavigator();
function seed(scenario) {
  initializeDatabase();
  const userId = 'savings-entry-qa-user';
  const now = '2026-10-07T04:30:00.000Z';
  execute(
    'INSERT OR IGNORE INTO users(id,fullName,username,passwordHash,gradeLevel,createdAt,updatedAt) VALUES(?,?,?,?,?,?,?)',
    [
      userId,
      'Alexandra Marie',
      'savings-entry-qa',
      'synthetic-not-for-authentication',
      'Grade 10',
      now,
      now,
    ],
  );
  execute('DELETE FROM goals WHERE userId=?', [userId]);
  const long = scenario === 'Long content';
  execute(
    'INSERT INTO goals(id,userId,name,targetAmount,targetDate,category,icon,note,status,createdAt,updatedAt,completedAt) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
    [
      'savings-entry-qa-goal',
      userId,
      long
        ? 'A new computer and school supplies for the coming school year'
        : 'School supplies',
      long ? 100000000000 : 500000,
      null,
      'Education',
      'book',
      '',
      scenario === 'Completed goal' ? 'completed' : 'active',
      now,
      now,
      scenario === 'Completed goal' ? now : null,
    ],
  );
  if (scenario !== 'Missing entry') {
    execute(
      'INSERT INTO savings(id,userId,goalId,amount,note,transactionDate,createdAt,updatedAt) VALUES(?,?,?,?,?,?,?,?)',
      [
        'savings-entry-qa-record',
        userId,
        'savings-entry-qa-goal',
        long ? 100000000000 : scenario === 'Completed goal' ? 500000 : 125050,
        long
          ? 'Saved from allowance and weekend chores. '.repeat(6)
          : scenario === 'No note'
          ? ''
          : 'Saved from my allowance this week.',
        '2026-10-01',
        now,
        now,
      ],
    );
  }
  useAuthStore.setState({
    user: getUserById(userId),
    ready: true,
    hasAccounts: true,
  });
  refreshData(userId);
}
function Scenarios({ navigation }) {
  return (
    <ScreenContainer>
      <Text style={theme.heading}>Savings Entry · synthetic data</Text>
      {[
        'Populated',
        'No note',
        'Long content',
        'Completed goal',
        'Missing entry',
      ].map(scenario => (
        <AppButton
          key={scenario}
          title={scenario}
          onPress={() => {
            seed(scenario);
            navigation.navigate('SavingsDetails', {
              savingId: 'savings-entry-qa-record',
            });
          }}
        />
      ))}
    </ScreenContainer>
  );
}
function SavingsEntryQA() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerTitleAlign: 'center',
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        >
          <Stack.Screen
            name="Scenarios"
            component={Scenarios}
            options={{ title: 'Savings preview' }}
          />
          <Stack.Screen
            name="SavingsDetails"
            component={SavingsDetailsScreen}
            options={{ title: 'Savings Entry' }}
          />
          <Stack.Screen
            name="EditSavings"
            component={SavingsFormScreen}
            options={{ title: 'Edit Savings' }}
          />
          <Stack.Screen
            name="GoalDetails"
            component={GoalDetailsScreen}
            options={{ title: 'Your Goal' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
AppRegistry.registerComponent('PiggyPath', () => SavingsEntryQA);
