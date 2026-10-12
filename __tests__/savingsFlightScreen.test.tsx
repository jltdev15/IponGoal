import { Obstacle } from '../src/games/savingsFlight/components/Obstacle';
import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import {
  AccessibilityInfo,
  Animated,
  AppState,
  DeviceEventEmitter,
  NativeModules,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParams } from '../src/navigation/types';
import { appConfig } from '../src/config/appConfig';
import { SavingsFlightScreen } from '../src/games/savingsFlight/SavingsFlightScreen';
import { SavingsFlightSetupScreen } from '../src/games/savingsFlight/SavingsFlightSetupScreen';
import { GamesScreen } from '../src/screens/GamesScreen';
import { GameGridCard } from '../src/components/GameGridCard';
import { AppButton } from '../src/components/AppButton';
import { HUD } from '../src/games/savingsFlight/components/HUD';
import { SavingsFlightResult } from '../src/games/savingsFlight/SavingsFlightResult';
import { SavingsFlightEngine } from '../src/games/savingsFlight/SavingsFlightEngine';
import { flightSound } from '../src/services/flightSound';
import { FLIGHT } from '../src/games/savingsFlight/SavingsFlightConfig';

jest.mock('lucide-react-native', () => ({
  Pause: 'PauseIcon',
  Volume2: 'VolumeIcon',
  VolumeX: 'MutedIcon',
}));

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
      .findAll(
        node =>
          (node.props.accessibilityRole === 'button' ||
            node.props.accessibilityRole === 'radio') &&
          typeof node.props.onPress === 'function',
      )
      .find(button => button.props.accessibilityLabel === title)!
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
  expect(
    renderer!.root.findAllByType(AppButton).map(button => button.props.title),
  ).not.toContain('Back to Games');
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
  expect([
    ...renderer!.root.findAllByType(GameGridCard).map(card => card.props.label),
    ...renderer!.root
      .findAllByType(AppButton)
      .map(button => button.props.title),
  ]).toEqual(['Play Needs or Wants', 'Play Budget Challenge']);
});

test('native interruption pauses flight until Resume and restart stops audio', async () => {
  Object.assign(appConfig, { ENABLE_SAVINGS_FLIGHT: true });
  const native = {
    prepare: jest.fn(),
    activate: jest.fn(),
    setMusic: jest.fn(),
    stop: jest.fn(),
    dispose: jest.fn(),
  };
  NativeModules.FlightSound = native;
  try {
    await mount();
    await press('Start Flight');
    expect(native.activate).toHaveBeenCalledTimes(1);
    await act(async () => DeviceEventEmitter.emit('FlightSoundInterrupted'));
    expect(renderer!.root.findByType(HUD).props.state.gameStatus).toBe(
      'paused',
    );
    expect(
      renderer!.root.findByProps({ testID: 'flight-underlay' }).props.style
        .display,
    ).toBe('none');
    await tick(120);
    expect(renderer!.root.findByType(HUD).props.state.gameStatus).toBe(
      'paused',
    );
    await press('Resume');
    expect(native.activate).toHaveBeenCalledTimes(2);
    await press('Pause flight');
    await press('Restart');
    expect(native.stop).toHaveBeenCalled();
    expect(native.dispose).toHaveBeenCalled();
  } finally {
    delete NativeModules.FlightSound;
  }
});

test('block collisions play one bump per life, including game over, without replaying on Continue', async () => {
  Object.assign(appConfig, { ENABLE_SAVINGS_FLIGHT: true });
  const sound = jest.spyOn(flightSound, 'effect').mockImplementation(() => {});
  const advance = SavingsFlightEngine.prototype.advance;
  const collisions: ReturnType<SavingsFlightEngine['getFrame']>[] = [];
  jest
    .spyOn(SavingsFlightEngine.prototype, 'advance')
    .mockImplementation(function (this: SavingsFlightEngine, seconds: number) {
      // Fly above the opening to hit the upper block without touching the ceiling.
      if (this.getFrame().playerY > 85) this.tap();
      const before = this.getFrame();
      advance.call(this, seconds);
      if (['hit', 'gameOver'].includes(this.getSnapshot().gameStatus))
        collisions.push(before);
    });
  await mount(
    <SavingsFlightScreen
      {...props}
      route={{ ...props.route, params: { levelId: 'needs', mode: 'manual' } }}
    />,
  );
  await press('Start Flight');
  for (let hit = 1; hit <= FLIGHT.lives; hit++) {
    await tick(240);
    expect(collisions).toHaveLength(hit);
    const impact = collisions[hit - 1];
    expect(impact.playerY).toBeGreaterThan(0);
    expect(impact.playerY + FLIGHT.hitInset).toBeLessThan(impact.gapTop);
    expect(impact.obstacleX).toBeLessThan(FLIGHT.playerX + FLIGHT.playerSize);
    expect(impact.obstacleX + FLIGHT.obstacleWidth).toBeGreaterThan(
      FLIGHT.playerX,
    );
    expect(
      sound.mock.calls.filter(([effect]) => effect === 'bump'),
    ).toHaveLength(hit);
    await tick(120);
    expect(
      sound.mock.calls.filter(([effect]) => effect === 'bump'),
    ).toHaveLength(hit);
    if (hit < FLIGHT.lives) {
      expect(renderer!.root.findByType(HUD).props.state.gameStatus).toBe('hit');
      await press('Continue Flight');
      expect(
        sound.mock.calls.filter(([effect]) => effect === 'bump'),
      ).toHaveLength(hit);
    }
  }
  expect(
    renderer!.root.findByType(SavingsFlightResult).props.result.gameStatus,
  ).toBe('gameOver');
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
  expect(
    renderer!.root.findAllByType(AppButton).map(button => button.props.title),
  ).not.toContain('Back to Games');
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
    expect(renderer!.root.findAllByType(Obstacle)).toHaveLength(1);
    expect(
      renderer!.root.findByProps({ testID: 'flight-stage' }).props
        .pointerEvents,
    ).toBe('none');
    expect(
      renderer!.root.findByProps({ testID: 'flight-stage' }).props
        .importantForAccessibility,
    ).toBe('no-hide-descendants');
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
  expect(JSON.stringify(renderer!.toJSON())).not.toContain('Arcade score');
  expect(JSON.stringify(renderer!.toJSON())).not.toContain(
    result.decisions[0].prompt,
  );
  await press('Review my choices');
  expect(JSON.stringify(renderer!.toJSON())).toContain(
    result.decisions[0].prompt,
  );
  await press('Back to Games');
  expect(navigation.popTo).toHaveBeenCalledWith('Games');
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

test('flight setup starts every topic with manual controls without a selection', async () => {
  expect(defaultFlightEnabled).toBe(true);
  await mount(
    <SavingsFlightSetupScreen
      {...(props as unknown as NativeStackScreenProps<
        MainStackParams,
        'SavingsFlightSetup'
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
  expect(
    renderer!.root.findAllByProps({ accessibilityRole: 'radio' }),
  ).toHaveLength(0);
  await act(async () => renderer!.update(<SavingsFlightScreen {...props} />));
  expect(renderer!.root.findByType(HUD).props.state.gameStatus).toBe('idle');
  await press('Start Flight');
  expect(renderer!.root.findByType(HUD).props.state.gameStatus).toBe('playing');
});

test('changing decorative motion preferences never restarts the flight clock', async () => {
  Object.assign(appConfig, { ENABLE_SAVINGS_FLIGHT: true });
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(false);
  jest
    .spyOn(AccessibilityInfo, 'isScreenReaderEnabled')
    .mockResolvedValue(false);
  const preferences = jest.spyOn(AccessibilityInfo, 'addEventListener');
  const app = jest.spyOn(AppState, 'addEventListener');
  const animation = { start: jest.fn(), stop: jest.fn(), reset: jest.fn() };
  jest.spyOn(Animated, 'timing').mockReturnValue(animation);
  jest.spyOn(Animated, 'loop').mockReturnValue(animation);
  const advance = jest.spyOn(SavingsFlightEngine.prototype, 'advance');
  await mount();
  await act(async () => app.mock.calls[0][1]('active'));
  await press('Start Flight');
  await tick(2);
  const calls = advance.mock.calls.length;
  expect(calls).toBeGreaterThan(0);
  const preferenceCalls = preferences.mock.calls as unknown as [
    string,
    (value: boolean) => void,
  ][];
  const reduce = preferenceCalls.find(
    ([event]) => event === 'reduceMotionChanged',
  )![1];
  await act(async () => reduce(true));
  await tick(1);
  expect(advance).toHaveBeenCalledTimes(calls + 1);
  expect(advance.mock.calls[calls][0]).toBeCloseTo(1 / 60);
});

test('manual gates are optional, HUD omits score, and disclosure leaves the question paused', async () => {
  Object.assign(appConfig, { ENABLE_SAVINGS_FLIGHT: true });
  const advance = SavingsFlightEngine.prototype.advance;
  jest
    .spyOn(SavingsFlightEngine.prototype, 'advance')
    .mockImplementation(function (this: SavingsFlightEngine, seconds: number) {
      if (this.getFrame().playerY > 185) this.tap();
      advance.call(this, seconds);
    });
  await mount(
    <SavingsFlightScreen
      {...props}
      route={{ ...props.route, params: { levelId: 'needs', mode: 'manual' } }}
    />,
  );
  await press('Start Flight');
  await tick(1300);
  expect(renderer!.root.findByType(HUD).props.state.gameStatus).toBe(
    'decision',
  );
  expect(JSON.stringify(renderer!.root.findByType(HUD).props)).not.toContain(
    'Arcade',
  );
  expect(
    renderer!.root
      .findAllByType(AppButton)
      .some(b => b.props.title === 'Fly to choose'),
  ).toBe(false);
  await press('More controls');
  expect(renderer!.root.findByType(HUD).props.state.decisionPhase).toBe(
    'reading',
  );
  await press('Fly to choose');
  expect(renderer!.root.findByType(HUD).props.state.decisionPhase).toBe(
    'choosing',
  );
  const state = renderer!.root.findByType(HUD).props.state;
  await press(state.currentScenario.options[0].label);
  expect(renderer!.root.findByType(HUD).props.state.decisionCount).toBe(1);
});
