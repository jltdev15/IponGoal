import React from 'react';
import {
  AccessibilityInfo,
  Animated,
  AppState,
  AppStateStatus,
  BackHandler,
  Dimensions,
  Image,
  NativeModules,
  StyleSheet,
  Text,
} from 'react-native';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WelcomeScreen } from '../src/screens/WelcomeScreen';
import { AppButton } from '../src/components/AppButton';
import { AuthStackParams } from '../src/navigation/types';

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('../src/components/Icon', () => ({ Icon: () => null }));
jest.mock('lucide-react-native', () => ({ ArrowRight: () => null }));
jest.mock('react-native/Libraries/AppState/AppState', () => ({
  __esModule: true,
  default: {
    currentState: 'active',
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));
let mockFocused = true;
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => (() => void) | undefined) => {
    require('react').useEffect(() => {
      if (mockFocused) {
        return callback();
      }
    }, [callback, mockFocused]);
  },
}));

let renderer: ReactTestRenderer;
const navigate = jest.fn();
const sound = { prepare: jest.fn(), play: jest.fn() };
const tapProgress = () =>
  renderer.root.findByProps({ testID: 'welcome-tap-progress' });
const surface = () =>
  renderer.root.findByProps({ testID: 'welcome-touch-surface' });
const props = { navigation: { navigate } } as unknown as NativeStackScreenProps<
  AuthStackParams,
  'Welcome'
>;
const originalDimensions = {
  window: Dimensions.get('window'),
  screen: Dimensions.get('screen'),
};
const titles = () =>
  Array.from(
    new Set(
      renderer.root
        .findAll(
          node =>
            node.props.accessibilityRole === 'button' &&
            typeof node.props.onPress === 'function',
        )
        .map(node => node.props.accessibilityLabel),
    ),
  );
const progress = () =>
  renderer.root.findByProps({ accessibilityRole: 'progressbar' });
async function press(title: string) {
  await act(async () => {
    renderer.root
      .findAll(
        node =>
          node.props.accessibilityLabel === title &&
          typeof node.props.onPress === 'function',
      )[0]
      .props.onPress();
  });
}
async function mount(intro = false) {
  await act(async () => {
    renderer = create(<WelcomeScreen {...props} />);
  });
  if (!intro) {
    for (let tap = 0; tap < 3; tap++) {
      await press('PiggyPath logo');
    }
  }
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  mockFocused = true;
  navigate.mockClear();
  sound.prepare.mockReset();
  sound.play.mockReset();
  NativeModules.WelcomeSound = sound;
  jest.useFakeTimers();
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(true);
  jest
    .spyOn(AccessibilityInfo, 'isScreenReaderEnabled')
    .mockResolvedValue(false);
});
afterEach(async () => {
  await act(async () => renderer.unmount());
  Dimensions.set(originalDimensions);
  jest.restoreAllMocks();
  jest.useRealTimers();
});

async function advance(milliseconds: number) {
  await act(async () => {
    jest.advanceTimersByTime(milliseconds);
  });
}

function timedAnimations() {
  // Drive animation completion deterministically while testing the real phase/timer logic.
  return jest.spyOn(Animated, 'timing').mockImplementation((value, config) => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let completion: ((result: { finished: boolean }) => void) | undefined;
    return {
      start(callback?: (result: { finished: boolean }) => void) {
        completion = callback;
        timeout = setTimeout(() => {
          (value as Animated.Value).setValue(config.toValue as number);
          const done = completion;
          completion = undefined;
          done?.({ finished: true });
        }, (config.duration ?? 500) + (config.delay ?? 0));
      },
      stop() {
        if (timeout !== undefined) {
          clearTimeout(timeout);
        }
        const done = completion;
        completion = undefined;
        done?.({ finished: false });
      },
      reset() {},
    } as Animated.CompositeAnimation;
  });
}

test('welcome requires logo taps and never advances automatically', async () => {
  jest.mocked(AccessibilityInfo.isReduceMotionEnabled).mockResolvedValue(false);
  const animations = timedAnimations();
  await mount(true);
  expect(titles()).toEqual(['PiggyPath logo']);
  expect(renderer.root.findAllByType(AppButton)).toHaveLength(0);
  expect(
    renderer.root.findAllByType(Text).map(node => node.props.children),
  ).toEqual(
    expect.arrayContaining([
      'Welcome to PiggyPath',
      'Tap the piggy 3 times to begin',
      '0/3',
    ]),
  );
  expect(animations.mock.calls.map(call => call[1])).toEqual([
    { toValue: 1, duration: 500, useNativeDriver: true },
    { toValue: 1, duration: 350, delay: 150, useNativeDriver: true },
  ]);
  await advance(60000);
  expect(tapProgress().props.accessibilityValue.now).toBe(0);
  expect(titles()).toEqual(['PiggyPath logo']);
  expect(sound.prepare).toHaveBeenCalledTimes(1);
  expect(sound.play).not.toHaveBeenCalled();
});

test('three taps at any pace play three oinks and enter the first onboarding step', async () => {
  await mount(true);
  for (const count of [1, 2]) {
    await press('PiggyPath logo');
    expect(tapProgress().props.accessibilityValue.now).toBe(count);
    expect(sound.play).toHaveBeenCalledTimes(count);
    await advance(60000);
    expect(tapProgress().props.accessibilityValue.now).toBe(count);
  }
  await press('PiggyPath logo');
  expect(sound.play).toHaveBeenCalledTimes(3);
  expect(progress().props.accessibilityValue.now).toBe(1);
  expect(titles()).toEqual(['Skip', 'Next']);
  expect(navigate).not.toHaveBeenCalled();
});

test('rapid activations use a synchronous guard and cannot skip onboarding', async () => {
  await mount(true);
  const activate = renderer.root.findByProps({ testID: 'welcome-logo' }).props
    .onPress;
  await act(async () => {
    for (let i = 0; i < 8; i++) activate();
  });
  expect(sound.play).toHaveBeenCalledTimes(3);
  expect(progress().props.accessibilityValue.now).toBe(1);
  await advance(12000);
  await act(async () => activate());
  expect(sound.play).toHaveBeenCalledTimes(3);
  expect(progress().props.accessibilityValue.now).toBe(1);
});

test('third tap during entrance shows 3/3 and locks taps throughout the transition', async () => {
  jest.mocked(AccessibilityInfo.isReduceMotionEnabled).mockResolvedValue(false);
  timedAnimations();
  await mount(true);
  for (let tap = 0; tap < 3; tap++) await press('PiggyPath logo');
  expect(tapProgress().props.accessibilityValue.now).toBe(3);
  expect(
    renderer.root.findByProps({ testID: 'welcome-logo' }).props.disabled,
  ).toBe(true);
  await act(async () => surface().props.onTouchStart());
  await press('PiggyPath logo');
  expect(tapProgress().props.accessibilityValue.now).toBe(3);
  expect(sound.play).toHaveBeenCalledTimes(3);
  await advance(200);
  expect(progress().props.accessibilityValue.now).toBe(1);
  await advance(250);
  expect(progress().props.accessibilityValue.now).toBe(1);
});

test('accessibility changes during the third-tap fade cannot leave welcome locked', async () => {
  jest.mocked(AccessibilityInfo.isReduceMotionEnabled).mockResolvedValue(false);
  timedAnimations();
  let reducedChanged: ((enabled: boolean) => void) | undefined;
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(((
    event: string,
    handler: unknown,
  ) => {
    if (event === 'reduceMotionChanged') {
      reducedChanged = handler as (enabled: boolean) => void;
    }
    return { remove: jest.fn() };
  }) as unknown as typeof AccessibilityInfo.addEventListener);
  await mount(true);
  for (let tap = 0; tap < 3; tap++) {
    await press('PiggyPath logo');
  }
  await act(async () => reducedChanged!(true));
  expect(progress().props.accessibilityValue.now).toBe(1);
  expect(sound.play).toHaveBeenCalledTimes(3);
});

test('tapping elsewhere resets progress while logo touches stop propagation', async () => {
  await mount(true);
  const stopPropagation = jest.fn();
  await act(async () => {
    renderer.root
      .findByProps({ testID: 'welcome-logo' })
      .props.onTouchStart({ stopPropagation });
  });
  expect(stopPropagation).toHaveBeenCalledTimes(1);
  await press('PiggyPath logo');
  await press('PiggyPath logo');
  await act(async () => surface().props.onTouchStart());
  expect(tapProgress().props.accessibilityValue.now).toBe(0);
  expect(sound.play).toHaveBeenCalledTimes(2);
  await press('PiggyPath logo');
  expect(tapProgress().props.accessibilityValue.now).toBe(1);
});

test('screen-reader and keyboard clicks activate the focusable logo three times', async () => {
  jest.mocked(AccessibilityInfo.isScreenReaderEnabled).mockResolvedValue(true);
  const animations = timedAnimations();
  await mount(true);
  const logo = renderer.root.findByProps({ testID: 'welcome-logo' });
  expect(logo.props.focusable).toBe(true);
  expect(logo.props.accessibilityRole).toBe('button');
  expect(logo.props.accessibilityHint).toContain('three times');
  await advance(60000);
  expect(tapProgress().props.accessibilityValue.now).toBe(0);
  for (let tap = 0; tap < 3; tap++) {
    const clickable = renderer.root.findAll(
      node =>
        node.props.testID === 'welcome-logo' &&
        typeof node.props.onClick === 'function',
    )[0];
    await act(async () =>
      clickable.props.onClick({ currentTarget: 1, target: 1, nativeEvent: {} }),
    );
  }
  expect(animations).not.toHaveBeenCalled();
  expect(sound.play).toHaveBeenCalledTimes(3);
  expect(progress().props.accessibilityValue.now).toBe(1);
});

test.each(['unavailable', 'failed', 'muted'])(
  'audio %s never blocks onboarding',
  async mode => {
    if (mode === 'unavailable') delete NativeModules.WelcomeSound;
    if (mode === 'failed') {
      sound.prepare.mockImplementation(() => {
        throw new Error('Audio unavailable');
      });
      sound.play.mockImplementation(() => {
        throw new Error('Audio unavailable');
      });
    }
    // A muted native player is a no-op; JavaScript never waits for audio completion.
    await mount();
    expect(progress().props.accessibilityValue.now).toBe(1);
  },
);

test('blur and reopening the welcome reset a partial tap sequence', async () => {
  await mount(true);
  await press('PiggyPath logo');
  const activate = renderer.root.findByProps({ testID: 'welcome-logo' }).props
    .onPress;
  mockFocused = false;
  await act(async () => renderer.update(<WelcomeScreen {...props} />));
  await act(async () => activate());
  expect(sound.play).toHaveBeenCalledTimes(1);
  mockFocused = true;
  await act(async () => renderer.update(<WelcomeScreen {...props} />));
  expect(tapProgress().props.accessibilityValue.now).toBe(0);
  await press('PiggyPath logo');
  expect(tapProgress().props.accessibilityValue.now).toBe(1);
  await act(async () => renderer.unmount());
  await mount(true);
  expect(tapProgress().props.accessibilityValue.now).toBe(0);
});

test('backgrounding resets taps and ignores activation until the app is active', async () => {
  const listeners = new Set<(state: AppStateStatus) => void>();
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_event, handler) => {
      listeners.add(handler);
      return { remove: () => listeners.delete(handler) };
    });
  const changeState = async (state: AppStateStatus) => {
    await act(async () => {
      for (const handler of [...listeners]) handler(state);
    });
  };
  await mount(true);
  await press('PiggyPath logo');
  await changeState('background');
  await advance(12000);
  await press('PiggyPath logo');
  expect(tapProgress().props.accessibilityValue.now).toBe(0);
  expect(sound.play).toHaveBeenCalledTimes(1);
  await changeState('active');
  await press('PiggyPath logo');
  expect(tapProgress().props.accessibilityValue.now).toBe(1);
});

test('accessibility preference changes preserve partial progress without auto advancing', async () => {
  let readerChanged: ((enabled: boolean) => void) | undefined;
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(((
    event: string,
    handler: unknown,
  ) => {
    if (event === 'screenReaderChanged')
      readerChanged = handler as (enabled: boolean) => void;
    return { remove: jest.fn() };
  }) as unknown as typeof AccessibilityInfo.addEventListener);
  await mount(true);
  await press('PiggyPath logo');
  await act(async () => readerChanged!(true));
  await advance(12000);
  expect(tapProgress().props.accessibilityValue.now).toBe(1);
  await press('PiggyPath logo');
  await press('PiggyPath logo');
  expect(progress().props.accessibilityValue.now).toBe(1);
});

test('unmount stops entrance animations and removes accessibility and app subscriptions', async () => {
  jest.mocked(AccessibilityInfo.isReduceMotionEnabled).mockResolvedValue(false);
  const animations = timedAnimations();
  const remove = jest.fn();
  jest
    .spyOn(AccessibilityInfo, 'addEventListener')
    .mockReturnValue({ remove } as unknown as ReturnType<
      typeof AccessibilityInfo.addEventListener
    >);
  jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove });
  await mount(true);
  await advance(100);
  const stop = jest.spyOn(animations.mock.results[0].value, 'stop');
  await act(async () => renderer.unmount());
  expect(stop).toHaveBeenCalled();
  expect(remove).toHaveBeenCalledTimes(4);
  await advance(10000);
  expect(navigate).not.toHaveBeenCalled();
});

test.each([
  { width: 320, height: 568, fontScale: 1 },
  { width: 800, height: 1280, fontScale: 1.5 },
])(
  'welcome keeps the logo compact and the hint scalable: %o',
  async dimensions => {
    Dimensions.set({
      window: { ...dimensions, scale: 1 },
      screen: { ...dimensions, scale: 1 },
    });
    await mount(true);
    const image = renderer.root.findByType(Image);
    expect(StyleSheet.flatten(image.props.style)).toMatchObject({
      width: 160,
      height: 160,
    });
    expect(image.props.accessible).toBe(false);
    expect(titles()).toEqual(['PiggyPath logo']);
    expect(tapProgress().props.accessibilityValue).toMatchObject({
      min: 0,
      max: 3,
      now: 0,
      text: '0 of 3 taps',
    });
  },
);

test('three pages advance in order and offer registration only on the final page', async () => {
  await mount();
  const headings = [
    'Set your goal',
    'Save little by little',
    'Watch your progress',
  ];
  for (let step = 0; step < 3; step++) {
    expect(
      renderer.root.findAllByType(Text).map(t => t.props.children),
    ).toContain(headings[step]);
    expect(progress().props.accessibilityLabel).toBe(`Step ${step + 1} of 3`);
    expect(progress().props.accessibilityValue.now).toBe(step + 1);
    expect(titles()).toEqual(
      step === 2 ? ['Login', 'Get Started'] : ['Skip', 'Next'],
    );
    expect(
      renderer.root.findAllByProps({ accessibilityLabel: 'Back' }),
    ).toHaveLength(0);
    for (let dot = 0; dot < 3; dot++) {
      expect(
        StyleSheet.flatten(
          renderer.root.findByProps({ testID: `onboarding-dot-${dot}` }).props
            .style,
        ).width,
      ).toBe(dot === step ? 28 : 22);
    }
    if (step < 2) {
      await press('Next');
      expect(navigate).not.toHaveBeenCalled();
    }
  }
  await press('Get Started');
  expect(navigate).toHaveBeenCalledWith('Register');
  expect(progress().props.accessibilityValue.now).toBe(3);
});

test.each([0, 1])(
  'Skip from step %s opens the final page without navigating',
  async startingStep => {
    await mount();
    if (startingStep === 1) {
      await press('Next');
    }
    await press('Skip');
    expect(progress().props.accessibilityValue.now).toBe(3);
    expect(titles()).toEqual(['Login', 'Get Started']);
    expect(navigate).not.toHaveBeenCalled();
    await press('Login');
    expect(navigate).toHaveBeenLastCalledWith('Login');
  },
);

test('hardware Back steps backward only while Welcome is focused and cleans up on blur', async () => {
  let back: (() => boolean | null | undefined) | undefined;
  const remove = jest.fn();
  jest
    .spyOn(BackHandler, 'addEventListener')
    .mockImplementation((_event, handler) => {
      back = handler;
      return { remove };
    });
  await mount();
  expect(back!()).toBe(false);
  await press('Next');
  await press('Next');
  for (const expected of [2, 1]) {
    act(() => expect(back!()).toBe(true));
    expect(progress().props.accessibilityValue.now).toBe(expected);
    expect(titles()).toEqual(['Skip', 'Next']);
  }
  expect(back!()).toBe(false);
  await press('Next');
  const registrations = (BackHandler.addEventListener as jest.Mock).mock.calls
    .length;
  const removals = remove.mock.calls.length;
  mockFocused = false;
  await act(async () => renderer.update(<WelcomeScreen {...props} />));
  expect(remove).toHaveBeenCalledTimes(removals + 1);
  expect(BackHandler.addEventListener).toHaveBeenCalledTimes(registrations);
  mockFocused = true;
  await act(async () => renderer.update(<WelcomeScreen {...props} />));
  expect(progress().props.accessibilityValue.now).toBe(2);
  expect(BackHandler.addEventListener).toHaveBeenCalledTimes(registrations + 1);
});

test.each([
  { width: 320, height: 568, fontScale: 1 },
  { width: 800, height: 1280, fontScale: 1.5 },
])(
  'final actions use a row at normal text and stack at large text: %o',
  async dimensions => {
    Dimensions.set({
      window: { ...dimensions, scale: 1 },
      screen: { ...dimensions, scale: 1 },
    });
    await mount();
    for (let step = 0; step < 3; step++) {
      const controls = renderer.root.findByProps({
        testID: 'onboarding-controls',
      });
      expect(StyleSheet.flatten(controls.props.style).flexDirection).toBe(
        step === 2 && dimensions.fontScale > 1.2 ? 'column' : 'row',
      );
      expect(controls.findAllByType(AppButton)).toHaveLength(
        step === 2 ? 2 : 0,
      );
      if (step === 2) {
        const actions = controls.findAllByType(AppButton);
        expect(actions.map(action => action.props.title)).toEqual([
          'Login',
          'Get Started',
        ]);
        expect(StyleSheet.flatten(actions[0].props.style)).toMatchObject({
          borderWidth: 1,
          backgroundColor: 'transparent',
        });
        actions.forEach(action => {
          expect(StyleSheet.flatten(action.props.style)?.flex).toBe(
            dimensions.fontScale > 1.2 ? undefined : 1,
          );
        });
      }
      if (step < 2) {
        await press('Next');
      }
    }
  },
);
