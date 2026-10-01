import {
  FlightLevelId,
  FlightMode,
} from '../games/savingsFlight/SavingsFlightConfig';
import { NavigatorScreenParams } from '@react-navigation/native';
export type AuthStackParams = {
  Welcome: undefined;
  Register: undefined;
  Login: undefined;
};
export type TabParams = {
  Home: undefined;
  History: { goalId?: string } | undefined;
  Statistics: undefined;
  Profile: undefined;
};
export type MainStackParams = {
  BottomTabs: NavigatorScreenParams<TabParams> | undefined;
  CreateGoal: undefined;
  EditGoal: { goalId: string };
  GoalDetails: { goalId: string };
  AddSavings: { goalId: string };
  EditSavings: { savingId: string };
  SavingsDetails: { savingId: string };
  CompletedGoals: undefined;
  ArchivedGoals: undefined;
  EditProfile: undefined;
  About: undefined;
  Games: undefined;
  NeedsOrWants: undefined;
  BudgetChallenge: undefined;
  SaveOrSpend: undefined;
  GoalBuilder: undefined;
  SavingsFlight: { levelId: FlightLevelId; mode: FlightMode };
};
