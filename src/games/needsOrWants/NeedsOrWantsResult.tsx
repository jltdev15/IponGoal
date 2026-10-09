import React from 'react';
import { Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { theme } from '../../theme/theme';
import { ClassificationAnswer } from './NeedsOrWantsSession';
import { GameReview } from '../GameReview';
export function NeedsOrWantsResult({
  answers,
  onAgain,
  onExit,
}: {
  answers: readonly ClassificationAnswer[];
  onAgain: () => void;
  onExit: () => void;
}) {
  return (
    <>
      <Text accessibilityRole="header" style={theme.title}>
        Needs or Wants Complete
      </Text>
      <View style={theme.card}>
        <Text style={theme.heading}>
          Needs and wants identified: {answers.filter(a => a.correct).length} /{' '}
          {answers.length}
        </Text>
      </View>
      <Text style={theme.body}>
        Look at the situation before deciding. Cover important needs first.
        Wants can fit a budget when needs and planned savings are covered.
      </Text>
      <AppButton title="Play Again" onPress={onAgain} />
      <AppButton title="Back to Games" variant="secondary" onPress={onExit} />
      <GameReview>
        {answers.map(answer => (
          <View style={theme.card} key={answer.scenario.id}>
            <Text style={theme.heading}>{answer.scenario.item}</Text>
            <Text style={theme.body}>{answer.scenario.context}</Text>
            <Text style={theme.muted}>
              You chose: {answer.selected === 'need' ? 'Need' : 'Want'} · In
              this situation:{' '}
              {answer.scenario.classification === 'need' ? 'Need' : 'Want'}
            </Text>
            <Text style={theme.body}>{answer.scenario.explanation}</Text>
          </View>
        ))}
      </GameReview>
      <Text style={theme.muted}>
        Practice only. Your real savings records have not changed.
      </Text>
    </>
  );
}
