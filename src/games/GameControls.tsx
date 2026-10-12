import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../theme/colors';
import { theme } from '../theme/theme';

const palette = [
  '#EFF6FF',
  colors.primarySoft,
  colors.goldSoft,
  colors.positiveSoft,
];
export function GameChoiceCard({
  title,
  detail,
  index,
  selected,
  onPress,
}: {
  title: string;
  detail?: string;
  index: number;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={selected === undefined ? 'button' : 'radio'}
      accessibilityLabel={title}
      accessibilityHint={
        detail ? `${detail}. Selects this option.` : 'Selects your answer.'
      }
      accessibilityState={
        selected === undefined ? undefined : { checked: selected }
      }
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        { backgroundColor: palette[index % palette.length] },
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={styles.badge}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Text style={styles.letter}>
          {selected ? '✓' : String.fromCharCode(65 + index)}
        </Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.choiceTitle}>{title}</Text>
        {detail && <Text style={styles.detail}>{detail}</Text>}
        {selected && <Text style={styles.selectedText}>Selected</Text>}
      </View>
      <Text
        style={styles.arrow}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        ›
      </Text>
    </Pressable>
  );
}
export function GameSoundControl({
  enabled,
  toggle,
}: {
  enabled: boolean;
  toggle: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={enabled ? 'Sound on' : 'Sound off'}
      accessibilityState={{ checked: enabled }}
      accessibilityHint="Toggle sounds for all learning games"
      onPress={toggle}
      style={styles.sound}
    >
      <Text style={styles.soundText}>{enabled ? 'Sound on' : 'Sound off'}</Text>
    </Pressable>
  );
}
export function GameScreen({
  children,
  actions,
  actionCount = 1,
  sound,
}: {
  children: React.ReactNode;
  actions: React.ReactNode;
  actionCount?: number;
  sound: { enabled: boolean; toggle: () => void };
}) {
  const { height, fontScale } = useWindowDimensions();
  const pinned =
    fontScale <= 1.2 &&
    (actionCount <= 2 ? height >= 700 : actionCount === 3 && height >= 800);
  const controls = (
    <View style={styles.actions} testID="game-actions">
      {actions}
    </View>
  );
  return (
    <ScreenContainer responsive footer={pinned ? controls : undefined}>
      <View style={styles.toolbar}>
        <Text style={theme.muted}>Take your time</Text>
        <GameSoundControl {...sound} />
      </View>
      {children}
      {!pinned && controls}
    </ScreenContainer>
  );
}
export function GameProgress({
  index,
  total,
  answered,
  label = 'Choice',
}: {
  index: number;
  total: number;
  answered: number;
  label?: string;
}) {
  return (
    <View style={styles.progress}>
      <Text style={styles.progressTitle}>
        {label} {index + 1} of {total}
      </Text>
      <View
        style={styles.track}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Choices answered"
        accessibilityValue={{ min: 0, max: total, now: answered }}
      >
        {Array.from({ length: total }, (_, step) => (
          <View
            key={step}
            style={[styles.step, step < answered && styles.done]}
          />
        ))}
      </View>
    </View>
  );
}
export const gameStyles = StyleSheet.create({
  section: { gap: 10 },
  scenario: { ...theme.card, gap: 12 },
  feedback: { ...theme.card, backgroundColor: colors.goldSoft },
  positive: { backgroundColor: colors.positiveSoft },
  balance: { ...theme.card, backgroundColor: '#EFF6FF', padding: 16, gap: 8 },
  prompt: { ...theme.muted, textAlign: 'center' },
});
const styles = StyleSheet.create({
  actions: { gap: 10 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  sound: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 14,
  },
  soundText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  choice: {
    minHeight: 84,
    padding: 14,
    borderWidth: 2,
    borderColor: '#CCD7E3',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selected: { borderColor: colors.primary },
  pressed: { opacity: 0.75 },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: { color: colors.text, fontWeight: '700', fontSize: 18 },
  copy: { flex: 1, minWidth: 0, gap: 4 },
  choiceTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 25,
  },
  detail: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  selectedText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  arrow: { fontSize: 26, color: colors.muted },
  progress: { gap: 10 },
  progressTitle: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  track: { flexDirection: 'row', gap: 6 },
  step: { height: 6, flex: 1, borderRadius: 3, backgroundColor: colors.track },
  done: { backgroundColor: colors.primary },
});
