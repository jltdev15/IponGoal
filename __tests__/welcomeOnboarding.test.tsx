import React from 'react';
import { BackHandler, Dimensions, StyleSheet, Text } from 'react-native';
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
async function mount() {
  await act(async () => {
    renderer = create(<WelcomeScreen {...props} />);
  });
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  mockFocused = true;
  navigate.mockClear();
});
afterEach(async () => {
  await act(async () => renderer.unmount());
  Dimensions.set(originalDimensions);
  jest.restoreAllMocks();
});

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
