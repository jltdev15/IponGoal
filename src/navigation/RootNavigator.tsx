import { GoalBuilderScreen } from '../games/goalBuilder/GoalBuilderScreen';
import { SaveOrSpendScreen } from '../games/saveOrSpend/SaveOrSpendScreen';
import { BudgetChallengeScreen } from '../games/budgetChallenge/BudgetChallengeScreen';
import { NeedsOrWantsScreen } from '../games/needsOrWants/NeedsOrWantsScreen';
import { GamesScreen } from '../screens/GamesScreen';
import { SavingsFlightScreen } from '../games/savingsFlight/SavingsFlightScreen';
import React, { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthStackParams, MainStackParams, TabParams } from './types';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { useAuthStore } from '../stores/authStore';
import { refreshData } from '../services/refresh';
import { colors } from '../theme/colors';
import { theme } from '../theme/theme';
import { Icon } from '../components/Icon';
import { AppButton } from '../components/AppButton';
import { HistoryScreen } from '../screens/HistoryScreen';
import { StatisticsScreen } from '../screens/StatisticsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { AboutScreen } from '../screens/AboutScreen';
import { GoalFormScreen } from '../screens/GoalFormScreen';
import { GoalDetailsScreen } from '../screens/GoalDetailsScreen';
import { GoalCollectionScreen } from '../screens/GoalCollectionScreen';
import { SavingsFormScreen } from '../screens/SavingsFormScreen';
import { SavingsDetailsScreen } from '../screens/SavingsDetailsScreen';
const Auth = createNativeStackNavigator<AuthStackParams>();
const Main = createNativeStackNavigator<MainStackParams>();
const Tab = createBottomTabNavigator<TabParams>();
function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface },
        tabBarIcon: ({ color, size }) => (
          <Icon name={route.name.toLowerCase()} color={color} size={size} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: 'Savings History', tabBarLabel: 'History' }}
      />
      <Tab.Screen name="Statistics" component={StatisticsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
export function RootNavigator() {
  const { ready, error, user, hasAccounts, boot } = useAuthStore();
  useEffect(() => {
    boot();
  }, [boot]);
  useEffect(() => {
    if (user) {
      refreshData(user.id);
    }
  }, [user]);
  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 20 }}>
        <Text style={theme.heading}>We couldn't open your saved data.</Text>
        <Text style={theme.body}>
          Your data has been preserved. Try reopening the app or use a
          compatible app version.
        </Text>
        <AppButton title="Try Again" onPress={boot} />
      </View>
    );
  }
  return (
    <NavigationContainer
      theme={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
        },
      }}
    >
      {user ? (
        <Main.Navigator
          key="main"
          screenOptions={{
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        >
          <Main.Screen
            name="BottomTabs"
            component={BottomTabs}
            options={{ headerShown: false }}
          />
          <Main.Screen
            name="CreateGoal"
            component={GoalFormScreen}
            options={{ title: 'Create Goal' }}
          />
          <Main.Screen
            name="EditGoal"
            component={GoalFormScreen}
            options={{ title: 'Edit Goal' }}
          />
          <Main.Screen
            name="GoalDetails"
            component={GoalDetailsScreen}
            options={{ title: 'Your Goal' }}
          />
          <Main.Screen
            name="AddSavings"
            component={SavingsFormScreen}
            options={{ title: 'Add Savings' }}
          />
          <Main.Screen
            name="EditSavings"
            component={SavingsFormScreen}
            options={{ title: 'Edit Savings' }}
          />
          <Main.Screen
            name="SavingsDetails"
            component={SavingsDetailsScreen}
            options={{ title: 'Savings Entry' }}
          />
          <Main.Screen
            name="CompletedGoals"
            component={GoalCollectionScreen}
            options={{ title: 'Completed Goals' }}
          />
          <Main.Screen
            name="ArchivedGoals"
            component={GoalCollectionScreen}
            options={{ title: 'Archived Goals' }}
          />
          <Main.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ title: 'Edit Profile' }}
          />
          <Main.Screen
            name="GoalBuilder"
            component={GoalBuilderScreen}
            options={{ title: 'Goal Builder' }}
          />
          <Main.Screen
            name="SaveOrSpend"
            component={SaveOrSpendScreen}
            options={{ title: 'Save or Spend' }}
          />
          <Main.Screen
            name="BudgetChallenge"
            component={BudgetChallengeScreen}
            options={{ title: 'Budget Challenge' }}
          />
          <Main.Screen
            name="NeedsOrWants"
            component={NeedsOrWantsScreen}
            options={{ title: 'Needs or Wants' }}
          />
          <Main.Screen
            name="Games"
            component={GamesScreen}
            options={{ title: 'Learning Games' }}
          />
          <Main.Screen
            name="SavingsFlight"
            component={SavingsFlightScreen}
            options={{ title: 'Savings Flight' }}
          />
          <Main.Screen
            name="About"
            component={AboutScreen}
            options={{ title: 'About the App' }}
          />
        </Main.Navigator>
      ) : (
        <Auth.Navigator
          key={hasAccounts ? 'accounts' : 'welcome'}
          initialRouteName={hasAccounts ? 'Login' : 'Welcome'}
          screenOptions={{
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        >
          <Auth.Screen
            name="Welcome"
            component={WelcomeScreen}
            options={{ title: '' }}
          />
          <Auth.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: 'Create Account' }}
          />
          <Auth.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: 'Login' }}
          />
        </Auth.Navigator>
      )}
    </NavigationContainer>
  );
}
