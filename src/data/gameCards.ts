import { FlightLevelId } from '../games/savingsFlight/SavingsFlightConfig';
import { ImageSourcePropType } from 'react-native';

export const introductoryGames = [
  {
    route: 'NeedsOrWants',
    title: 'Needs or Wants',
    detail: 'Start here · 5 situations',
    image: require('../../assets/branding/games/needs-or-wants.png'),
    description:
      'Decide what is essential and what is an extra in everyday situations.',
  },
  {
    route: 'BudgetChallenge',
    title: 'Budget Challenge',
    detail: '5 choices · One school day',
    image: require('../../assets/branding/games/budget-challenge.png'),
    description:
      'Plan a ₱300 school day with room for needs, treats, and savings.',
  },
] as const;
export const flightIcons: Record<FlightLevelId, ImageSourcePropType> = {
  needs: require('../../assets/branding/games/flight-needs.png'),
  save: require('../../assets/branding/games/flight-save.png'),
  budget: require('../../assets/branding/games/budget-flight.png'),
  goal: require('../../assets/branding/games/goal-rush.png'),
};
