import { GoalBuilderScreen } from '../src/games/goalBuilder/GoalBuilderScreen';
import { SaveOrSpendScreen } from '../src/games/saveOrSpend/SaveOrSpendScreen';
import { BudgetChallengeScreen } from '../src/games/budgetChallenge/BudgetChallengeScreen';
import { NeedsOrWantsScreen } from '../src/games/needsOrWants/NeedsOrWantsScreen';
/* Isolated emulator QA entry. Never imported by index.js or shipped as the app entry.
 * Use the documented Gradle init script and a separate applicationId for this harness.
 * No auth, database, or real goal stores are opened here.
 */
import React from 'react';
import { AppRegistry, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GamesScreen } from '../src/screens/GamesScreen';
import { SavingsFlightScreen } from '../src/games/savingsFlight/SavingsFlightScreen';

const Stack = createNativeStackNavigator();
function LearningGamesQA() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Games">
          <Stack.Screen
            name="BottomTabs"
            component={GamesScreen}
            options={{ title: 'Learning Games · QA home' }}
          />
          <Stack.Screen
            name="Games"
            component={GamesScreen}
            options={{ title: 'Learning Games · QA only' }}
          />
          <Stack.Screen
            name="GoalBuilder"
            component={GoalBuilderScreen}
            options={{ title: 'Goal Builder · QA only' }}
          />
          <Stack.Screen
            name="SaveOrSpend"
            component={SaveOrSpendScreen}
            options={{ title: 'Save or Spend · QA only' }}
          />
          <Stack.Screen
            name="BudgetChallenge"
            component={BudgetChallengeScreen}
            options={{ title: 'Budget Challenge · QA only' }}
          />
          <Stack.Screen
            name="NeedsOrWants"
            component={NeedsOrWantsScreen}
            options={{ title: 'Needs or Wants · QA only' }}
          />
          <Stack.Screen
            name="SavingsFlight"
            component={SavingsFlightScreen}
            options={{ title: 'Learning Games · QA only' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
AppRegistry.registerComponent('PiggyPath', () => LearningGamesQA);
