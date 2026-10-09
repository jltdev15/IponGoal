import React from 'react';
import { Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParams } from '../navigation/types';
import { appConfig } from '../config/appConfig';
import { ScreenContainer } from '../components/ScreenContainer';
import { GameGridCard } from '../components/GameGridCard';
import { introductoryGames } from '../data/gameCards';
import { theme } from '../theme/theme';

export function GamesScreen({
  navigation,
}: NativeStackScreenProps<MainStackParams, 'Games'>) {
  return (
    <ScreenContainer responsive>
      <Text style={theme.body}>
        Practice money choices. Your real savings stay unchanged.
      </Text>
      {introductoryGames.map(game => (
        <GameGridCard
          key={game.route}
          {...game}
          label={'Play ' + game.title}
          onPress={() => navigation.navigate(game.route)}
        />
      ))}
      {appConfig.ENABLE_SAVINGS_FLIGHT && (
        <GameGridCard
          title="Savings Flight"
          label="Play Savings Flight"
          image={require('../../assets/branding/games/savings-flight-pig-side.png')}
          description="Fly through gaps and pause to make money choices."
          detail="4 topics · 5 questions per flight"
          onPress={() => navigation.navigate('SavingsFlightSetup')}
        />
      )}
    </ScreenContainer>
  );
}
