import React from 'react';
import {
  AccessibilityInfo,
  Animated,
  AppState,
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
} from 'react-native';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { Player } from '../src/games/savingsFlight/components/Player';
import {
  CoinBurst,
  CollisionNotice,
  FlightHero,
  MotionEntrance,
} from '../src/games/savingsFlight/components/FlightPresentation';
import { FlightSky } from '../src/games/savingsFlight/components/FlightSky';
import { SavingsFlightResult } from '../src/games/savingsFlight/SavingsFlightResult';
import { SavingsFlightEngine } from '../src/games/savingsFlight/SavingsFlightEngine';
import { useFlightMotion } from '../src/games/savingsFlight/useFlightMotion';

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
let renderer: ReactTestRenderer | undefined;
let animations: Animated.CompositeAnimation[];
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  animations = [];
  jest.spyOn(Animated, 'timing').mockImplementation(() => {
    const animation = { start: jest.fn(), stop: jest.fn(), reset: jest.fn() };
    animations.push(animation);
    return animation;
  });
});

test('collision feedback stays visible without motion and cleans up its single fade', async () => {
  await mount(<CollisionNotice enabled={false} />);
  expect(Animated.timing).not.toHaveBeenCalled();
  expect(renderer!.root.findByType(Text).props.children).toBe('1 heart lost');
  await update(<CollisionNotice enabled />);
  expect(Animated.timing).toHaveBeenCalledTimes(1);
  await update(<CollisionNotice enabled={false} />);
  expect(animations[0].stop).toHaveBeenCalled();
});
afterEach(async () => {
  if (renderer) await act(async () => renderer!.unmount());
  renderer = undefined;
  jest.restoreAllMocks();
});
async function mount(element: React.ReactElement) {
  await act(async () => {
    renderer = create(element);
  });
}
async function update(element: React.ReactElement) {
  await act(async () => renderer!.update(element));
}

test('player and hero share the side-view pig within their existing footprints', async () => {
  await mount(<Player tilt={new Animated.Value(8)} />);
  const image = renderer!.root.findByType(Image);
  const spriteSource = image.props.source;
  expect(image.props.source).toEqual(
    require('../assets/branding/games/savings-flight-pig-side.png'),
  );
  expect(StyleSheet.flatten(image.props.style)).toMatchObject({
    width: 36,
    height: 36,
  });
  expect(image.props.accessible).toBe(false);
  expect(image.props.resizeMode).toBe('contain');
  jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({
    width: 390,
    height: 844,
    fontScale: 1,
    scale: 3,
  } as ReturnType<typeof useWindowDimensions>);
  await update(<FlightHero enabled={false} />);
  const hero = renderer!.root.findByType(Image);
  expect(hero.props.source).toEqual(spriteSource);
  expect(StyleSheet.flatten(hero.props.style)).toMatchObject({
    width: 96,
    height: 96,
  });
  expect(hero.props.accessible).toBe(false);
  expect(hero.props.resizeMode).toBe('contain');
  jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({
    width: 320,
    height: 640,
    fontScale: 1.5,
    scale: 2,
  } as ReturnType<typeof useWindowDimensions>);
  await update(<FlightHero enabled={false} />);
  expect(
    StyleSheet.flatten(renderer!.root.findByType(Image).props.style),
  ).toMatchObject({ width: 64, height: 64 });
});

test('entrance uses native opacity and transforms, stops on disable, and never replays', async () => {
  await mount(
    <MotionEntrance enabled>
      <Text>Question</Text>
    </MotionEntrance>,
  );
  expect(Animated.timing).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ duration: 180, useNativeDriver: true }),
  );
  expect(animations[0].start).toHaveBeenCalledTimes(1);
  await update(
    <MotionEntrance enabled={false}>
      <Text>Question</Text>
    </MotionEntrance>,
  );
  expect(animations[0].stop).toHaveBeenCalledTimes(1);
  await update(
    <MotionEntrance enabled>
      <Text>Question</Text>
    </MotionEntrance>,
  );
  expect(Animated.timing).toHaveBeenCalledTimes(1);
});

test('coin feedback responds only to new collections, stops on pause, and does not replay', async () => {
  await mount(<CoinBurst event={0} amount={1000} y={180} enabled />);
  expect(Animated.timing).not.toHaveBeenCalled();
  await update(<CoinBurst event={1} amount={1000} y={180} enabled />);
  expect(Animated.timing).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ duration: 400, useNativeDriver: true }),
  );
  expect(
    renderer!.root.findByProps({ testID: 'flight-coin-burst' }).props
      .pointerEvents,
  ).toBe('none');
  await update(<CoinBurst event={1} amount={1000} y={180} enabled={false} />);
  expect(animations[0].stop).toHaveBeenCalledTimes(1);
  await update(<CoinBurst event={1} amount={1000} y={180} enabled />);
  expect(Animated.timing).toHaveBeenCalledTimes(1);
  await update(<CoinBurst event={2} amount={2000} y={180} enabled={false} />);
  expect(Animated.timing).toHaveBeenCalledTimes(1);
});

test('both cloud layers stop when frozen and on unmount', async () => {
  const loop = { start: jest.fn(), stop: jest.fn(), reset: jest.fn() };
  jest.spyOn(Animated, 'loop').mockReturnValue(loop);
  await mount(<FlightSky moving={false} />);
  expect(loop.start).not.toHaveBeenCalled();
  await update(<FlightSky moving />);
  expect(loop.start).toHaveBeenCalledTimes(2);
  await update(<FlightSky moving={false} />);
  expect(loop.stop).toHaveBeenCalledTimes(2);
  await update(<FlightSky moving />);
  await act(async () => renderer!.unmount());
  renderer = undefined;
  expect(loop.stop).toHaveBeenCalledTimes(4);
});

test.each(['completed', 'gameOver'] as const)(
  'results celebrate only completion (%s)',
  async gameStatus => {
    const result = {
      ...new SavingsFlightEngine('needs', 'assisted').getResult(),
      gameStatus,
    };
    await mount(
      <SavingsFlightResult
        result={result}
        onAgain={jest.fn()}
        onExit={jest.fn()}
        motion
      />,
    );
    expect(Animated.timing).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ duration: 250, useNativeDriver: true }),
    );
    expect(
      renderer!.root.findAllByProps({ testID: 'flight-celebration' }).length >
        0,
    ).toBe(gameStatus === 'completed');
    const celebrations = jest
      .mocked(Animated.timing)
      .mock.calls.filter(([, options]) => options.duration === 700);
    expect(celebrations).toHaveLength(gameStatus === 'completed' ? 1 : 0);
    await update(
      <SavingsFlightResult
        result={result}
        onAgain={jest.fn()}
        onExit={jest.fn()}
        motion={false}
      />,
    );
    expect(
      renderer!.root.findAllByProps({ testID: 'flight-celebration' }),
    ).toHaveLength(0);
  },
);

test('motion preference changes, app inactivity, blur, and unmount disable or clean up effects', async () => {
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(false);
  jest
    .spyOn(AccessibilityInfo, 'isScreenReaderEnabled')
    .mockResolvedValue(false);
  const accessibility = jest.spyOn(AccessibilityInfo, 'addEventListener');
  const app = jest.spyOn(AppState, 'addEventListener');
  const listeners: Record<string, () => void> = {};
  const remove = jest.fn();
  const navigation = {
    isFocused: () => true,
    addListener: (name: string, callback: () => void) => {
      listeners[name] = callback;
      return remove;
    },
  };
  let allowed = false;
  function Harness() {
    allowed = useFlightMotion(
      navigation as unknown as Parameters<typeof useFlightMotion>[0],
    );
    return null;
  }
  await mount(<Harness />);
  await act(async () => app.mock.calls[0][1]('active'));
  expect(allowed).toBe(true);
  const preferenceCalls = accessibility.mock.calls as unknown as [
    string,
    (value: boolean) => void,
  ][];
  const reduce = preferenceCalls.find(
    ([event]) => event === 'reduceMotionChanged',
  )![1];
  const reader = preferenceCalls.find(
    ([event]) => event === 'screenReaderChanged',
  )![1];
  await act(async () => reduce(true));
  expect(allowed).toBe(false);
  await act(async () => reduce(false));
  expect(allowed).toBe(true);
  await act(async () => reader(true));
  expect(allowed).toBe(false);
  await act(async () => reader(false));
  expect(allowed).toBe(true);
  await act(async () => listeners.blur());
  expect(allowed).toBe(false);
  await act(async () => listeners.focus());
  expect(allowed).toBe(true);
  await act(async () => app.mock.calls[0][1]('background'));
  expect(allowed).toBe(false);
  await act(async () => app.mock.calls[0][1]('active'));
  expect(allowed).toBe(true);
  await act(async () => renderer!.unmount());
  renderer = undefined;
  expect(remove).toHaveBeenCalledTimes(2);
});
