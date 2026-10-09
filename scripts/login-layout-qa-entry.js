// Isolated login layout preview. No authentication/database operations are run.
import React from 'react';
import { AppRegistry, StatusBar, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LoginScreen } from '../src/screens/LoginScreen';
import { useAuthStore } from '../src/stores/authStore';
import { colors } from '../src/theme/colors';

useAuthStore.setState({
  login: async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    throw new Error('Incorrect username or password.');
  },
});
const Stack = createNativeStackNavigator();
const RegisterDestination = () => <Text>Register · QA destination</Text>;
function LoginLayoutQA() {
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
            name="Login"
            component={LoginScreen}
            options={{
              title: '',
              headerTransparent: true,
              headerStyle: { backgroundColor: 'transparent' },
            }}
          />
          <Stack.Screen name="Register" component={RegisterDestination} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
AppRegistry.registerComponent('PiggyPath', () => LoginLayoutQA);
