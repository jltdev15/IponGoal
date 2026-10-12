// Isolated animation preview. Never opens the production database or stores.
import React from 'react';
import { AppRegistry, StatusBar, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WelcomeScreen } from '../src/screens/WelcomeScreen';
import { colors } from '../src/theme/colors';

const Stack = createNativeStackNavigator();
const Destination = () => <Text>Authentication destination · QA only</Text>;
function WelcomeQA() {
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
            name="Welcome"
            component={WelcomeScreen}
            options={{ title: '', headerShown: false }}
          />
          <Stack.Screen name="Login" component={Destination} />
          <Stack.Screen name="Register" component={Destination} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
AppRegistry.registerComponent('PiggyPath', () => WelcomeQA);
