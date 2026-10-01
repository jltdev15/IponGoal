import { Obstacle } from '../src/games/savingsFlight/components/Obstacle';
import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { AppState } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParams } from '../src/navigation/types';
import { appConfig } from '../src/config/appConfig';
import { SavingsFlightScreen } from '../src/games/savingsFlight/SavingsFlightScreen';
import { GamesScreen } from '../src/screens/GamesScreen';
import { AppButton } from '../src/components/AppButton';
import { HUD } from '../src/games/savingsFlight/components/HUD';
import { SavingsFlightResult } from '../src/games/savingsFlight/SavingsFlightResult';
import { SavingsFlightEngine } from '../src/games/savingsFlight/SavingsFlightEngine';

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
const defaultFlightEnabled = appConfig.ENABLE_SAVINGS_FLIGHT;
let renderer: ReactTestRenderer | undefined;
let callbacks: Map<number, (time: number) => void>;
let nextId: number;
let time: number;
const navigation = {
  navigate: jest.fn(),
  popTo: jest.fn(),
  addListener: jest.fn(),
};
const props = {
  route: { params: { levelId: 'needs', mode: 'assisted' } },
  navigation,
} as unknown as NativeStackScreenProps<MainStackParams, 'SavingsFlight'>;
async function mount(component = <SavingsFlightScreen {...props} />) {
  await act(async () => {
    renderer = create(component);
  });
}
async function press(title: string) {
  await act(async () => {
    renderer!.root
      .findAllByType(AppButton)
      .find(button => button.props.title === title)!
      .props.onPress();
  });
}
async function tick(frames: number) {
  await act(async () => {
    for (let i = 0; i < frames; i++) {
      time += 1000 / 60;
      const work = [...callbacks.values()];
      callbacks.clear();
      work.forEach(callback => callback(time));
    }
  });
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  callbacks = new Map();
  nextId = 0;
  time = 0;
  jest
    .spyOn(globalThis, 'requestAnimationFrame')
    .mockImplementation(callback => {
      const id = ++nextId;
      callbacks.set(id, callback);
      return id;
    });
  jest.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(id => {
    callbacks.delete(id);
  });
  navigation.navigate.mockReset();
  navigation.popTo.mockReset();
  navigation.addListener.mockReset().mockReturnValue(jest.fn());
});
afterEach(async () => {
  if (renderer) {
    await act(async () => {
      renderer!.unmount();
    });
    renderer = undefined;
  }
  Object.assign(appConfig, { ENABLE_SAVINGS_FLIGHT: defaultFlightEnabled });
  jest.restoreAllMocks();
});

test('disabled flag still guards flight routes and hides Games controls', async () => {
  Object.assign(appConfig, { ENABLE_SAVINGS_FLIGHT: false });
  await mount();
  expect(renderer!.root.findAllByType(HUD)).toHaveLength(0);
  expect(callbacks.size).toBe(0);
  await press('Back to Games');
  expect(navigation.popTo).toHaveBeenCalledWith('Games');
  await act(async () => {
    renderer!.update(
      <GamesScreen
        {...(props as unknown as NativeStackScreenProps<
          MainStackParams,
          'Games'
        >)}
      />,
    );
  });
  expect(
    renderer!.root.findAllByType(AppButton).map(b => b.props.title),
  ).toEqual([
    'Play Needs or Wants',
    'Play Budget Challenge',
    'Play Save or Spend',
    'Play Goal Builder',
    'Back to Home',
  ]);
});

test('backgrounding and navigation blur pause, restart clears state, exit returns to Games, and unmount cancels callbacks', async () => {
  Object.assign(appConfig, { ENABLE_SAVINGS_FLIGHT: true });
  const pause = jest.spyOn(SavingsFlightEngine.prototype, 'pause');
  const listener = jest.spyOn(AppState, 'addEventListener');
  await mount();
  await press('Start Flight');
  await tick(30);
  const background = listener.mock.calls[listener.mock.calls.length - 1][1];
  await act(async () => {
    background('background');
  });
  expect(pause).toHaveBeenCalled();
  const frozen = renderer!.root.findByType(HUD).props.state;
  await tick(180);
  expect(renderer!.root.findByType(HUD).props.state).toEqual(frozen);
  await press('Resume');
  const blur =
    navigation.addListener.mock.calls[
      navigation.addListener.mock.calls.length - 1
    ][1];
  await act(async () => {
    blur();
  });
  await press('Restart');
  expect(renderer!.root.findByType(HUD).props.state).toMatchObject({
    gameStatus: 'idle',
    decisionCount: 0,
    practiceSavings: 80000,
    lives: 3,
  });
  await press('Start Flight');
  await tick(1);
  expect(callbacks.size).toBe(1);
  await act(async () => {
    renderer!.unmount();
  });
  renderer = undefined;
  expect(callbacks.size).toBe(0);
  await mount();
  await press('Back to Games');
  expect(navigation.popTo).toHaveBeenCalledWith('Games');
});

test('viewport changes pause, but resizing the scene for answer buttons does not', async () => {
  Object.assign(appConfig, { ENABLE_SAVINGS_FLIGHT: true });
  await mount();
  await press('Start Flight');
  const views = [
    renderer!.root.findByProps({ testID: 'flight-viewport' }),
    renderer!.root.findByProps({ testID: 'flight-scene' }),
  ];
  const event = (width: number, height: number) => ({
    nativeEvent: { layout: { width, height, x: 0, y: 0 } },
  });
  await act(async () => {
    views[0].props.onLayout(event(360, 600));
    views[1].props.onLayout(event(360, 400));
  });
  await act(async () => {
    views[1].props.onLayout(event(360, 220));
  });
  expect(renderer!.root.findByType(HUD).props.state.gameStatus).toBe('playing');
  await act(async () => {
    views[0].props.onLayout(event(600, 360));
  });
  expect(renderer!.root.findByType(HUD).props.state.gameStatus).toBe('paused');
});

test('assisted screen completes with untimed buttons, shows separate result, and Play Again resets', async () => {
  Object.assign(appConfig, { ENABLE_SAVINGS_FLIGHT: true });
  await mount();
  await press('Start Flight');
  for (let i = 0; i < 5; i++) {
    await tick(1300);
    const state = renderer!.root.findByType(HUD).props.state;
    expect(state.gameStatus).toBe('decision');
    expect(renderer!.root.findAllByType(Obstacle)).toHaveLength(0);
    const button = state.currentScenario.options.find(
      (o: { recommended: boolean }) => o.recommended,
    ).label;
    await press(button);
    await press('Continue');
  }
  const result = renderer!.root.findByType(SavingsFlightResult).props.result;
  expect(result).toMatchObject({
    gameStatus: 'completed',
    mode: 'assisted',
    score: 0,
    correctDecisionCount: 5,
  });
  await press('Play Again');
  expect(renderer!.root.findByType(HUD).props.state).toMatchObject({
    gameStatus: 'idle',
    decisionCount: 0,
  });
});

test('reading and feedback stop frame callbacks until Continue', async () => {
  Object.assign(appConfig, { ENABLE_SAVINGS_FLIGHT: true });
  await mount();
  await press('Start Flight');
  await tick(1300);
  await tick(1); // Draw the newly committed reading overlay once.
  expect(callbacks.size).toBe(0);
  const reading = renderer!.root.findByType(HUD).props.state;
  await tick(10000);
  expect(renderer!.root.findByType(HUD).props.state).toEqual(reading);
  await press(reading.currentScenario.options[0].label);
  expect(callbacks.size).toBe(1); // One drawing frame, with no advancing loop.
  await tick(1);
  expect(callbacks.size).toBe(0);
  const feedback = renderer!.root.findByType(HUD).props.state;
  await tick(10000);
  expect(renderer!.root.findByType(HUD).props.state).toEqual(feedback);
  await press('Continue');
  expect(callbacks.size).toBe(1);
  await tick(2);
  expect(renderer!.root.findByType(HUD).props.state.gameStatus).toBe('playing');
});

test('exiting a paused flight removes its route and cannot resume stale progress', async () => {
  Object.assign(appConfig, { ENABLE_SAVINGS_FLIGHT: true });
  await mount();
  await press('Start Flight');
  const blur =
    navigation.addListener.mock.calls[
      navigation.addListener.mock.calls.length - 1
    ][1];
  await act(async () => blur());
  await press('Exit Game');
  expect(navigation.popTo).toHaveBeenCalledWith('Games');
  expect(navigation.navigate).not.toHaveBeenCalled();
});

test('release configuration exposes every level with typed manual and assisted routes', async () => {
  expect(defaultFlightEnabled).toBe(true);
  await mount(
    <GamesScreen
      {...(props as unknown as NativeStackScreenProps<
        MainStackParams,
        'Games'
      >)}
    />,
  );
  const levels = [
    ['Needs vs Wants', 'needs'],
    ['Save or Spend', 'save'],
    ['Budget Flight', 'budget'],
    ['Goal Rush', 'goal'],
  ] as const;
  for (const [title, levelId] of levels) {
    await press(`Practice ${title}`);
    expect(navigation.navigate).toHaveBeenLastCalledWith('SavingsFlight', {
      levelId,
      mode: 'manual',
    });
  }
  await press('Assisted flight');
  for (const [title, levelId] of levels) {
    await press(`Practice ${title}`);
    expect(navigation.navigate).toHaveBeenLastCalledWith('SavingsFlight', {
      levelId,
      mode: 'assisted',
    });
  }
  await act(async () => renderer!.update(<SavingsFlightScreen {...props} />));
  expect(renderer!.root.findByType(HUD).props.state.gameStatus).toBe('idle');
  await press('Start Flight');
  expect(renderer!.root.findByType(HUD).props.state.gameStatus).toBe('playing');
});
