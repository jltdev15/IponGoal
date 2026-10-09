// Isolated game-menu layout preview; never opens account or savings stores.
import React from 'react';
import { AppRegistry, StatusBar, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GamesScreen } from '../src/screens/GamesScreen';
import { colors } from '../src/theme/colors';
const Stack = createNativeStackNavigator();
const Destination = ({ route }) => <Text>{route.name} · QA destination</Text>;
function GameGridQA() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen
            name="Games"
            component={GamesScreen}
            options={{ title: 'Learning Games · QA' }}
          />
          {[
            'NeedsOrWants',
            'BudgetChallenge',
            'SaveOrSpend',
            'GoalBuilder',
            'SavingsFlight',
            'SavingsFlightSetup',
            'BottomTabs',
          ].map(name => (
            <Stack.Screen key={name} name={name} component={Destination} />
          ))}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
AppRegistry.registerComponent('PiggyPath', () => GameGridQA);
