import React from 'react';
import { Text, View } from 'react-native';
import { theme } from '../../theme/theme';
import { ClassificationAnswer } from './NeedsOrWantsSession';
import { GameReview } from '../GameReview';
export function NeedsOrWantsResult({
  answers,
}: {
  answers: readonly ClassificationAnswer[];
}) {
  return (
    <>
      <Text accessibilityRole="header" style={theme.title}>
        Nice work! You finished.
      </Text>
      <View style={theme.card}>
        <Text style={theme.heading}>
          You identified {answers.filter(a => a.correct).length} of{' '}
          {answers.length} correctly.
        </Text>
      </View>
      <Text style={theme.body}>
        Look at the situation before deciding. Cover important needs first.
        Wants can fit a budget when needs and planned savings are covered.
      </Text>
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
