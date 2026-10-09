import React from 'react';
import { Image, StyleSheet, Text, useWindowDimensions } from 'react-native';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GameGridCard } from '../src/components/GameGridCard';
import { GamesScreen } from '../src/screens/GamesScreen';
import { SavingsFlightSetupScreen } from '../src/games/savingsFlight/SavingsFlightSetupScreen';
import { MainStackParams } from '../src/navigation/types';
import { appConfig } from '../src/config/appConfig';
import { LEVELS } from '../src/games/savingsFlight/SavingsFlightConfig';
jest.mock('lucide-react-native', () => ({
  Volume2: 'VolumeIcon',
  VolumeX: 'MutedIcon',
}));
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
let renderer: ReactTestRenderer;
const navigate = jest.fn();
const props = { navigation: { navigate } } as unknown as NativeStackScreenProps<
  MainStackParams,
  'Games'
>;
const enabled = appConfig.ENABLE_SAVINGS_FLIGHT;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  navigate.mockClear();
  Object.assign(appConfig, { ENABLE_SAVINGS_FLIGHT: true });
  jest
    .spyOn(require('react-native'), 'useWindowDimensions')
    .mockReturnValue({ width: 390, height: 844, scale: 3, fontScale: 1 });
});
afterEach(async () => {
  if (renderer) await act(async () => renderer.unmount());
  Object.assign(appConfig, { ENABLE_SAVINGS_FLIGHT: enabled });
  jest.restoreAllMocks();
});
async function mount(element = <GamesScreen {...props} />) {
  await act(async () => {
    renderer = create(element);
  });
}
function control(label: string) {
  return renderer.root.findAll(
    node =>
      typeof node.props.onPress === 'function' &&
      node.props.accessibilityLabel === label,
  )[0];
}
async function press(label: string) {
  await act(async () => control(label).props.onPress());
}
test('three game cards have visible descriptions, round lengths, and correct destinations', async () => {
  await mount();
  const cards = renderer.root.findAllByType(GameGridCard);
  expect(cards.map(c => c.props.title)).toEqual([
    'Needs or Wants',
    'Budget Challenge',
    'Savings Flight',
  ]);
  for (const card of cards) {
    const visible = card.findAllByType(Text).map(t => t.props.children);
    expect(visible).toContain(card.props.description);
    expect(visible).toContain(card.props.detail);
    expect(card.findByType(Image).props.accessible).toBe(false);
  }
  expect(cards[0].props.detail).toContain('Start here');
  for (const [title, route] of [
    ['Needs or Wants', 'NeedsOrWants'],
    ['Budget Challenge', 'BudgetChallenge'],
    ['Savings Flight', 'SavingsFlightSetup'],
  ]) {
    await press('Play ' + title);
    expect(navigate).toHaveBeenLastCalledWith(route);
  }
});
test.each([
  [320, 1],
  [360, 1.5],
  [390, 1.8],
])('cards wrap at width %s and font scale %s', async (width, fontScale) => {
  jest
    .mocked(useWindowDimensions)
    .mockReturnValue({ width, height: 720, scale: 2, fontScale });
  await mount();
  for (const card of renderer.root.findAllByType(GameGridCard)) {
    const style = StyleSheet.flatten(
      control(card.props.label).props.style({ pressed: false }),
    );
    expect(style).toMatchObject({
      width: '100%',
      minHeight: 48,
      flexDirection: 'column',
    });
    expect(style.height).toBeUndefined();
    expect(
      card
        .findAllByType(Text)
        .every(text => text.props.numberOfLines === undefined),
    ).toBe(true);
  }
});
test('Flight setup routes all topics directly to manual controls', async () => {
  await mount(
    <SavingsFlightSetupScreen
      {...(props as unknown as NativeStackScreenProps<
        MainStackParams,
        'SavingsFlightSetup'
      >)}
    />,
  );
  expect(
    renderer.root.findAllByProps({ accessibilityRole: 'radio' }),
  ).toHaveLength(0);
  for (const level of LEVELS) {
    await press('Practice ' + level.title);
    expect(navigate).toHaveBeenLastCalledWith('SavingsFlight', {
      levelId: level.id,
      mode: 'manual',
    });
  }
});

test('feature flag hides Flight and guards setup while retaining the two introductory games', async () => {
  Object.assign(appConfig, { ENABLE_SAVINGS_FLIGHT: false });
  await mount();
  expect(renderer.root.findAllByType(GameGridCard)).toHaveLength(2);
  await act(async () =>
    renderer.update(
      <SavingsFlightSetupScreen
        {...(props as unknown as NativeStackScreenProps<
          MainStackParams,
          'SavingsFlightSetup'
        >)}
      />,
    ),
  );
  expect(renderer.root.findAllByType(GameGridCard)).toHaveLength(0);
});
