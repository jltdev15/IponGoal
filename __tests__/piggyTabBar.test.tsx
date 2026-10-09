import React from 'react';
import { Keyboard, Text, View, useWindowDimensions } from 'react-native';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import {
  BottomTabBarProps,
  BottomTabBarHeightCallbackContext,
} from '@react-navigation/bottom-tabs';
import { PiggyTabBar } from '../src/navigation/PiggyTabBar';

jest.mock('@react-navigation/bottom-tabs', () => ({
  BottomTabBarHeightCallbackContext: require('react').createContext(undefined),
}));

jest.mock('lucide-react-native', () => ({
  House: () => null,
  Clock3: () => null,
  ChartSpline: () => null,
  CircleUserRound: () => null,
  Plus: () => null,
}));

test.each([1, 1.8])(
  'tabs keep labels, selection and destinations at font scale %s',
  async fontScale => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const dimensions = jest
      .spyOn(require('react-native'), 'useWindowDimensions')
      .mockReturnValue({
        width: 320,
        height: 640,
        scale: 2,
        fontScale,
      } as ReturnType<typeof useWindowDimensions>);
    const parentNavigate = jest.fn();
    const navigate = jest.fn();
    const emit = jest.fn(() => ({ defaultPrevented: false }));
    const routes = ['Home', 'History', 'Statistics', 'Profile'].map(name => ({
      name,
      key: name,
      params: undefined,
    }));
    const props = {
      state: { index: 0, routes },
      descriptors: Object.fromEntries(
        routes.map(route => [route.key, { options: {} }]),
      ),
      navigation: {
        navigate,
        emit,
        getParent: () => ({ navigate: parentNavigate }),
      },
      insets: { top: 24, left: 0, right: 0, bottom: 24 },
    } as unknown as BottomTabBarProps;
    let renderer!: ReactTestRenderer;
    const reportHeight = jest.fn();
    await act(async () => {
      renderer = create(
        <BottomTabBarHeightCallbackContext.Provider value={reportHeight}>
          <PiggyTabBar {...props} />
        </BottomTabBarHeightCallbackContext.Provider>,
      );
    });
    try {
      const bar = renderer.root
        .findAllByType(View)
        .find(node => node.props.onLayout)!;
      const measuredHeight = fontScale === 1 ? 120 : 200;
      await act(async () =>
        bar.props.onLayout({
          nativeEvent: { layout: { height: measuredHeight } },
        }),
      );
      expect(reportHeight).toHaveBeenLastCalledWith(measuredHeight);
      expect(
        renderer.root.findAllByType(Text).map(node => node.props.children),
      ).toEqual(['Home', 'History', 'Statistics', 'Profile']);
      const tabs = renderer.root.findAll(
        node =>
          node.props.accessibilityRole === 'tab' &&
          typeof node.props.onPress === 'function',
      );
      // Composite and native Pressables both carry props; use one per label.
      for (const route of routes) {
        const tab = tabs.find(
          node => node.props.accessibilityLabel === route.name,
        )!;
        expect(tab.props.accessibilityState.selected).toBe(
          route.name === 'Home',
        );
        await act(async () => tab.props.onPress());
      }
      expect(navigate.mock.calls).toEqual([
        ['History', undefined],
        ['Statistics', undefined],
        ['Profile', undefined],
      ]);
      const history = tabs.find(
        node => node.props.accessibilityLabel === 'History',
      )!;
      emit.mockReturnValueOnce({ defaultPrevented: true });
      await act(async () => history.props.onPress());
      expect(navigate).toHaveBeenCalledTimes(3);
      await act(async () => history.props.onLongPress());
      expect(emit).toHaveBeenLastCalledWith({
        type: 'tabLongPress',
        target: 'History',
      });
      const add = renderer.root.findAll(
        node =>
          node.props.accessibilityLabel === 'Create new goal' &&
          typeof node.props.onPress === 'function',
      )[0];
      await act(async () => add.props.onPress());
      expect(parentNavigate).toHaveBeenCalledWith('CreateGoal');
    } finally {
      await act(async () => renderer.unmount());
      dimensions.mockRestore();
    }
  },
);

test('navigation hides while the keyboard is visible and removes its listeners', async () => {
  const listeners: Record<string, () => void> = {};
  const remove = jest.fn();
  const spy = jest
    .spyOn(Keyboard, 'addListener')
    .mockImplementation((event, callback) => {
      listeners[event] = () => callback({} as Parameters<typeof callback>[0]);
      return { remove } as unknown as ReturnType<typeof Keyboard.addListener>;
    });
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = create(
      <PiggyTabBar
        {...({
          state: { index: 0, routes: [] },
          descriptors: {},
          navigation: {},
          insets: { bottom: 0, left: 0, right: 0, top: 0 },
        } as unknown as BottomTabBarProps)}
      />,
    );
  });
  await act(async () => listeners.keyboardDidShow());
  expect(renderer.toJSON()).toBeNull();
  await act(async () => listeners.keyboardDidHide());
  expect(renderer.toJSON()).not.toBeNull();
  await act(async () => renderer.unmount());
  expect(remove).toHaveBeenCalledTimes(2);
  spy.mockRestore();
});
