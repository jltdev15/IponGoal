// Synthetic data only in com.ipongoal.goaldetailsqa. Never distribute this entry.
import 'react-native-get-random-values';
import React from 'react';
import { AppRegistry, Image, StatusBar, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initializeDatabase, execute } from '../src/database/database';
import { getUserById } from '../src/database/repositories/userRepository';
import { useAuthStore } from '../src/stores/authStore';
import { refreshData } from '../src/services/refresh';
import { GoalDetailsScreen } from '../src/screens/GoalDetailsScreen';
import { ScreenContainer } from '../src/components/ScreenContainer';
import { AppButton } from '../src/components/AppButton';
import { colors } from '../src/theme/colors';
import { theme } from '../src/theme/theme';

const Stack = createNativeStackNavigator();
const scenarios = ['Populated', 'Empty', 'Reached', 'Completed', 'Archived', 'Long content', 'Photo'];
function seed(scenario) {
  initializeDatabase();
  const userId = 'goal-details-synthetic-user';
  const now = '2026-10-12T04:30:00.000Z';
  execute('INSERT OR IGNORE INTO users(id,fullName,username,passwordHash,gradeLevel,createdAt,updatedAt) VALUES(?,?,?,?,?,?,?)', [userId, 'Alexandra Marie', 'goal-details-qa', 'synthetic-not-for-authentication', 'Grade 10', now, now]);
  execute('DELETE FROM goals WHERE userId=?', [userId]);
  const long = scenario === 'Long content';
  const status = scenario === 'Archived' ? 'archived' : scenario === 'Completed' ? 'completed' : 'active';
  execute('INSERT INTO goals(id,userId,name,targetAmount,targetDate,category,icon,note,coverPhoto,status,createdAt,updatedAt,completedAt) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)', [
    'goal-details-synthetic-goal', userId,
    long ? 'A new computer and school supplies for the coming school year' : 'My school laptop',
    long ? 100000000000 : 1000000, scenario === 'Empty' ? null : '2026-12-01', 'Education', 'phone',
    long ? 'Saving from my allowance and weekend chores. '.repeat(8) : 'A little from my allowance each week.',
    scenario === 'Photo' ? Image.resolveAssetSource(require('../assets/branding/onboarding/goal.png')).uri : null,
    status, now, now, status === 'completed' ? now : null,
  ]);
  const amounts = scenario === 'Empty' ? [] : long ? [50000000000] : scenario === 'Reached' ? [1100000] : scenario === 'Completed' ? [1000000] : [250000, 150000, 100000];
  amounts.forEach((amount, index) => execute('INSERT INTO savings(id,userId,goalId,amount,note,transactionDate,createdAt,updatedAt) VALUES(?,?,?,?,?,?,?,?)', [
    'goal-details-saving-' + index, userId, 'goal-details-synthetic-goal', amount,
    long ? 'Saved from allowance and weekend chores. '.repeat(6) : ['Allowance savings', 'Weekend chores', 'A small step closer'][index] || '',
    ['2026-10-10', '2026-10-07', '2026-10-01'][index] || '2026-10-10', now, now,
  ]));
  useAuthStore.setState({ user: getUserById(userId), ready: true, hasAccounts: true });
  refreshData(userId);
}
function Scenarios({ navigation }) {
  return <ScreenContainer><Text style={theme.heading}>Goal details · synthetic data</Text>{scenarios.map(scenario => <AppButton key={scenario} title={scenario} onPress={() => { seed(scenario); navigation.navigate('GoalDetails', { goalId: 'goal-details-synthetic-goal' }); }} />)}</ScreenContainer>;
}
function Destination({ route }) { return <ScreenContainer><Text style={theme.heading}>{route.name}</Text></ScreenContainer>; }
function GoalDetailsQA() {
  return <SafeAreaProvider><StatusBar barStyle="dark-content" /><NavigationContainer><Stack.Navigator screenOptions={{ headerTitleAlign: 'center', headerShadowVisible: false, headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }}>
    <Stack.Screen name="Scenarios" component={Scenarios} options={{ title: 'Goal preview' }} />
    <Stack.Screen name="GoalDetails" component={GoalDetailsScreen} options={{ title: 'Your Goal' }} />
    {['EditGoal', 'AddSavings', 'SavingsDetails', 'BottomTabs'].map(name => <Stack.Screen key={name} name={name} component={Destination} />)}
  </Stack.Navigator></NavigationContainer></SafeAreaProvider>;
}
AppRegistry.registerComponent('PiggyPath', () => GoalDetailsQA);
