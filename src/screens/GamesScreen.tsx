import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParams } from '../navigation/types';
import { appConfig } from '../config/appConfig';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppButton } from '../components/AppButton';
import { theme } from '../theme/theme';
import { FlightMode, LEVELS } from '../games/savingsFlight/SavingsFlightConfig';
export function GamesScreen({
  navigation,
}: NativeStackScreenProps<MainStackParams, 'Games'>) {
  const [mode, setMode] = useState<FlightMode>('manual');

  return (
    <ScreenContainer>
      <Text accessibilityRole="header" style={theme.title}>
        Learning Games
      </Text>
      <Text style={theme.body}>
        Short activities to practice money choices at your own pace. Your real
        savings stay unchanged.
      </Text>
      <View style={theme.card}>
        <Text style={theme.heading}>Needs or Wants</Text>
        <Text style={theme.body}>
          Explore how everyday situations change what is essential and what is
          optional.
        </Text>
        <AppButton
          title="Play Needs or Wants"
          onPress={() => navigation.navigate('NeedsOrWants')}
        />
      </View>
      <View style={theme.card}>
        <Text style={theme.heading}>Budget Challenge</Text>
        <Text style={theme.body}>
          Plan a fictional ₱300 school day. Cover essentials, weigh optional
          treats, and make room for savings.
        </Text>
        <AppButton
          title="Play Budget Challenge"
          onPress={() => navigation.navigate('BudgetChallenge')}
        />
      </View>
      <View style={theme.card}>
        <Text style={theme.heading}>Save or Spend</Text>
        <Text style={theme.body}>
          Explore when saving, essential spending, and an affordable treat fit
          your priorities.
        </Text>
        <AppButton
          title="Play Save or Spend"
          onPress={() => navigation.navigate('SaveOrSpend')}
        />
      </View>
      <View style={theme.card}>
        <Text style={theme.heading}>Goal Builder</Text>
        <Text style={theme.body}>
          Choose a fictional goal, plan affordable weekly savings, and explore
          how expenses change the timeline.
        </Text>
        <AppButton
          title="Play Goal Builder"
          onPress={() => navigation.navigate('GoalBuilder')}
        />
      </View>
      {appConfig.ENABLE_SAVINGS_FLIGHT ? (
        <>
          <Text accessibilityRole="header" style={theme.heading}>
            Savings Flight
          </Text>
          <Text style={theme.body}>
            Fly toward a fictional goal and practice thoughtful money choices.
            All money is practice money.
          </Text>
          <Text style={theme.heading}>Choose your controls</Text>
          <AppButton
            title={`Manual flight${mode === 'manual' ? ' · Selected' : ''}`}
            variant={mode === 'manual' ? 'primary' : 'secondary'}
            onPress={() => setMode('manual')}
          />
          <AppButton
            title={`Assisted flight${mode === 'assisted' ? ' · Selected' : ''}`}
            variant={mode === 'assisted' ? 'primary' : 'secondary'}
            onPress={() => setMode('assisted')}
          />
          <Text style={theme.muted}>
            {mode === 'manual'
              ? 'Tap to rise, glide through expense cards, and collect small fictional windfalls.'
              : 'Automatic navigation, no motor challenge. Answer untimed questions with buttons. Arcade score is not applicable.'}
          </Text>
          {LEVELS.map(level => (
            <View style={theme.card} key={level.id}>
              <Text style={theme.heading}>{level.title}</Text>
              <Text style={theme.body}>{level.description}</Text>
              <AppButton
                title={`Practice ${level.title}`}
                onPress={() =>
                  navigation.navigate('SavingsFlight', {
                    levelId: level.id,
                    mode,
                  })
                }
              />
            </View>
          ))}
        </>
      ) : (
        <View style={theme.card}>
          <Text style={theme.heading}>More practice is on the way</Text>
          <Text style={theme.muted}>
            Savings Flight will open after the introductory games and its final
            checks are ready.
          </Text>
        </View>
      )}
      <AppButton
        title="Back to Home"
        variant="secondary"
        onPress={() => navigation.navigate('BottomTabs', { screen: 'Home' })}
      />
    </ScreenContainer>
  );
}
