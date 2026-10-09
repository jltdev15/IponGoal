// Dedicated game-only preview. No database or account access.
import React from 'react';
import { AppRegistry, StatusBar, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GamesScreen } from '../src/screens/GamesScreen';
import { SavingsFlightSetupScreen } from '../src/games/savingsFlight/SavingsFlightSetupScreen';
import { NeedsOrWantsScreen } from '../src/games/needsOrWants/NeedsOrWantsScreen';
import { BudgetChallengeScreen } from '../src/games/budgetChallenge/BudgetChallengeScreen';
import { SavingsFlightScreen } from '../src/games/savingsFlight/SavingsFlightScreen';
import { colors } from '../src/theme/colors';
const Stack = createNativeStackNavigator();
const Other = () => <Text>Flight QA: choose a Savings Flight level.</Text>;
function FlightPolishQA() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShadowVisible: false,
            headerTintColor: colors.text,
            headerStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen
            name="Games"
            component={GamesScreen}
            options={{ title: 'PiggyPath Flight QA' }}
          />
          <Stack.Screen
            name="SavingsFlight"
            component={SavingsFlightScreen}
            options={{ title: 'Savings Flight · QA' }}
          />
          <Stack.Screen
            name="SavingsFlightSetup"
            component={SavingsFlightSetupScreen}
            options={{ title: 'Choose your flight' }}
          />
          <Stack.Screen
            name="NeedsOrWants"
            component={NeedsOrWantsScreen}
            options={{ title: 'Needs or Wants' }}
          />
          <Stack.Screen
            name="BudgetChallenge"
            component={BudgetChallengeScreen}
            options={{ title: 'Budget Challenge' }}
          />
          {['SaveOrSpend', 'GoalBuilder'].map(name => (
            <Stack.Screen key={name} name={name} component={Other} />
          ))}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
AppRegistry.registerComponent('PiggyPath', () => FlightPolishQA);
