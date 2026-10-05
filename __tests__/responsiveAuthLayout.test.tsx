import React from 'react';
import * as RN from 'react-native';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import {
  ScreenContainer,
  ScreenInputFocusContext,
} from '../src/components/ScreenContainer';
import { AppInput } from '../src/components/AppInput';
import { SafeAreaView } from 'react-native-safe-area-context';

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

let renderer: ReactTestRenderer;
const originalDimensions = {
  window: RN.Dimensions.get('window'),
  screen: RN.Dimensions.get('screen'),
};

test('input focus requests visibility without replacing the caller focus handler', () => {
  const reveal = jest.fn(),
    onFocus = jest.fn();
  act(() => {
    renderer = create(
      <ScreenInputFocusContext.Provider value={reveal}>
        <AppInput label="Username" onFocus={onFocus} />
      </ScreenInputFocusContext.Provider>,
    );
  });
  const event = { nativeEvent: {} };
  act(() => renderer.root.findByType(RN.TextInput).props.onFocus(event));
  expect(onFocus).toHaveBeenCalledWith(event);
  expect(reveal).toHaveBeenCalledTimes(1);
});
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});
afterEach(() => {
  act(() => renderer.unmount());
  RN.Dimensions.set(originalDimensions);
  jest.restoreAllMocks();
});

test('legacy screens retain their spacing and have no footer', () => {
  act(() => {
    renderer = create(
      <ScreenContainer>
        <RN.Text>Content</RN.Text>
      </ScreenContainer>,
    );
  });
  expect(
    RN.StyleSheet.flatten(
      renderer.root.findByType(RN.ScrollView).props.contentContainerStyle,
    ),
  ).toEqual({ padding: 24, paddingBottom: 32, gap: 24, flexGrow: 1 });
  expect(
    renderer.root.findAllByProps({ testID: 'screen-footer' }),
  ).toHaveLength(0);
});

test('measured space below safe areas and headers determines compact mode', () => {
  RN.Dimensions.set({
    window: { width: 800, height: 1280, scale: 1, fontScale: 1 },
    screen: { width: 800, height: 1280, scale: 1, fontScale: 1 },
  });
  act(() => {
    renderer = create(
      <ScreenContainer responsive>
        {({ compact }) => <RN.Text>{compact ? 'compact' : 'regular'}</RN.Text>}
      </ScreenContainer>,
    );
  });
  const layout = renderer.root.findByType(RN.KeyboardAvoidingView);
  act(() =>
    layout.props.onLayout({ nativeEvent: { layout: { height: 620 } } }),
  );
  expect(renderer.root.findByType(RN.Text).props.children).toBe('compact');
  act(() =>
    layout.props.onLayout({ nativeEvent: { layout: { height: 900 } } }),
  );
  expect(renderer.root.findByType(RN.Text).props.children).toBe('regular');
  expect(
    RN.StyleSheet.flatten(
      renderer.root.findByType(RN.ScrollView).props.contentContainerStyle,
    ).maxWidth,
  ).toBe(480);
  expect(renderer.root.findByType(SafeAreaView).props.edges).toContain(
    'bottom',
  );
});

test.each([
  { width: 320, fontScale: 1 },
  { width: 800, fontScale: 1.5 },
])(
  'narrow width or large text uses compact spacing: %o',
  ({ width, fontScale }) => {
    RN.Dimensions.set({
      window: { width, height: 1280, scale: 1, fontScale },
      screen: { width, height: 1280, scale: 1, fontScale },
    });
    act(() => {
      renderer = create(
        <ScreenContainer responsive>
          <RN.Text>Content</RN.Text>
        </ScreenContainer>,
      );
    });
    expect(
      RN.StyleSheet.flatten(
        renderer.root.findByType(RN.ScrollView).props.contentContainerStyle,
      ).padding,
    ).toBe(16);
  },
);

test('keyboard moves the secondary action into the scroll body while primary stays outside', () => {
  RN.Dimensions.set({
    window: { width: 360, height: 640, scale: 1, fontScale: 1 },
    screen: { width: 360, height: 640, scale: 1, fontScale: 1 },
  });
  const listeners: Record<string, () => void> = {};
  const addListener = RN.Keyboard.addListener.bind(RN.Keyboard);
  jest
    .spyOn(RN.Keyboard, 'addListener')
    .mockImplementation((event, callback) => {
      listeners[event] = callback as () => void;
      return addListener(event, callback);
    });
  act(() => {
    renderer = create(
      <ScreenContainer
        responsive
        footer={<RN.Text>Primary</RN.Text>}
        secondaryFooter={<RN.Text>Secondary</RN.Text>}
      >
        <RN.Text>Content</RN.Text>
      </ScreenContainer>,
    );
  });
  const footer = () => renderer.root.findByProps({ testID: 'screen-footer' });
  const labels = (node: typeof renderer.root) =>
    node.findAllByType(RN.Text).map(text => text.props.children);
  expect(labels(footer())).toEqual(['Secondary', 'Primary']);
  act(() => listeners.keyboardDidShow());
  expect(labels(footer())).toEqual(['Primary']);
  expect(labels(renderer.root.findByType(RN.ScrollView))).toEqual([
    'Content',
    'Secondary',
  ]);
  act(() => listeners.keyboardDidHide());
  expect(labels(footer())).toEqual(['Secondary', 'Primary']);
});

test.each([1, 1.5])(
  'registration keeps Back left and Continue right in the footer while typing at font scale %s',
  fontScale => {
    RN.Dimensions.set({
      window: { width: 320, height: 568, scale: 1, fontScale },
      screen: { width: 320, height: 568, scale: 1, fontScale },
    });
    const listeners: Record<string, () => void> = {};
    const addListener = RN.Keyboard.addListener.bind(RN.Keyboard);
    jest
      .spyOn(RN.Keyboard, 'addListener')
      .mockImplementation((event, callback) => {
        listeners[event] = callback as () => void;
        return addListener(event, callback);
      });
    act(() => {
      renderer = create(
        <ScreenContainer
          responsive
          keepActionsInFooter
          footer={<RN.Text>Continue</RN.Text>}
          secondaryFooter={<RN.Text>Back</RN.Text>}
        >
          <RN.Text>Input</RN.Text>
        </ScreenContainer>,
      );
    });
    act(() => listeners.keyboardDidShow());
    const footer = renderer.root.findByProps({ testID: 'screen-footer' });
    expect(
      footer.findAllByType(RN.Text).map(text => text.props.children),
    ).toEqual(['Back', 'Continue']);
    expect(RN.StyleSheet.flatten(footer.props.style).flexDirection).toBe('row');
    expect(
      renderer.root
        .findByType(RN.ScrollView)
        .findAllByType(RN.Text)
        .map(text => text.props.children),
    ).toEqual(['Input']);
    act(() => listeners.keyboardDidHide());
    expect(
      footer.findAllByType(RN.Text).map(text => text.props.children),
    ).toEqual(fontScale === 1 ? ['Back', 'Continue'] : ['Continue', 'Back']);
  },
);

test.each([1, 1.5])(
  'paired actions use columns at normal text and stack at larger text: %s',
  fontScale => {
    RN.Dimensions.set({
      window: { width: 320, height: 568, scale: 1, fontScale },
      screen: { width: 320, height: 568, scale: 1, fontScale },
    });
    act(() => {
      renderer = create(
        <ScreenContainer
          responsive
          footer={({ columns }) => (
            <RN.Text>{columns ? 'columns' : 'stacked'}</RN.Text>
          )}
          secondaryFooter={<RN.Text>Back</RN.Text>}
        >
          <RN.Text>Content</RN.Text>
        </ScreenContainer>,
      );
    });
    const footer = renderer.root.findByProps({ testID: 'screen-footer' });
    expect(
      footer
        .findAllByType(RN.Text)
        .find(text => text.props.children !== 'Back')!.props.children,
    ).toBe(fontScale === 1 ? 'columns' : 'stacked');
    expect(RN.StyleSheet.flatten(footer.props.style).flexDirection).toBe(
      fontScale === 1 ? 'row' : undefined,
    );
  },
);
