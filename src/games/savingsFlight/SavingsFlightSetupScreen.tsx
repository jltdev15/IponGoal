import React from 'react';
import { Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParams } from '../../navigation/types';
import { ScreenContainer } from '../../components/ScreenContainer';
import { GameGridCard } from '../../components/GameGridCard';
import { appConfig } from '../../config/appConfig';
import { flightIcons } from '../../data/gameCards';
import { theme } from '../../theme/theme';
import { SoundControl } from './components/SoundControl';
import { useFlightSoundPreference } from '../../services/flightSound';
import { LEVELS } from './SavingsFlightConfig';

export function SavingsFlightSetupScreen({
  navigation,
}: NativeStackScreenProps<MainStackParams, 'SavingsFlightSetup'>) {
  const sound = useFlightSoundPreference();
  if (!appConfig.ENABLE_SAVINGS_FLIGHT) {
    return (
      <ScreenContainer responsive>
        <Text style={theme.body}>Savings Flight is not available yet.</Text>
      </ScreenContainer>
    );
  }
  return (
    <ScreenContainer responsive>
      <Text accessibilityRole="header" style={[theme.title, { fontSize: 26 }]}>
        Savings Flight
      </Text>
      <Text style={theme.body}>
        Choose a topic. Tap to fly and answer five untimed money questions.
      </Text>
      <SoundControl enabled={sound.enabled} onPress={sound.toggle} />
      <Text accessibilityRole="header" style={theme.heading}>
        Choose a topic
      </Text>
      {LEVELS.map(level => (
        <GameGridCard
          key={level.id}
          title={level.title}
          image={flightIcons[level.id]}
          label={'Practice ' + level.title}
          description={level.description}
          detail="5 questions · Practice money"
          onPress={() =>
            navigation.navigate('SavingsFlight', {
              levelId: level.id,
              mode: 'manual',
            })
          }
        />
      ))}
    </ScreenContainer>
  );
}
