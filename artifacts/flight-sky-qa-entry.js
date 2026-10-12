// Isolated visual preview; no authentication, database, or saved goals.
import React from 'react';
import { AppRegistry, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SavingsFlightScreen } from '../src/games/savingsFlight/SavingsFlightScreen';
import { SavingsFlightEngine } from '../src/games/savingsFlight/SavingsFlightEngine';
import { colors } from '../src/theme/colors';
// Freeze a representative frame in this preview only. Some tablets disallow
// ADB touch injection, so the visual check does not depend on device gestures.
const snapshot = SavingsFlightEngine.prototype.getSnapshot;
const advance = SavingsFlightEngine.prototype.advance;
SavingsFlightEngine.prototype.getSnapshot = function () {
  if (snapshot.call(this).gameStatus === 'idle') {
    this.start();
    for (let i = 0; i < 15; i++) advance.call(this, 0.1);
  }
  return snapshot.call(this);
};
SavingsFlightEngine.prototype.advance = function () {};
const Stack = createNativeStackNavigator();
function FlightSkyPreview() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShadowVisible: false, headerTintColor: colors.text, headerStyle: { backgroundColor: colors.background } }}>
          <Stack.Screen name="SavingsFlight" component={SavingsFlightScreen} initialParams={{ levelId: 'needs', mode: 'assisted' }} options={{ title: 'Savings Flight · Sky Preview' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
AppRegistry.registerComponent('PiggyPath', () => FlightSkyPreview);
