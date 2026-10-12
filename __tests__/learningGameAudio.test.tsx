import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { AppState, NativeModules } from 'react-native';
import { flightSound } from '../src/services/flightSound';
import { useGameSession } from '../src/games/useGameSession';
import {
  budgetReducer,
  newBudgetSession,
} from '../src/games/budgetChallenge/BudgetChallengeSession';

const native = {
  getEnabled: jest.fn().mockResolvedValue(true),
  setEnabled: jest.fn(),
  prepare: jest.fn(),
  activate: jest.fn(),
  playEffect: jest.fn(),
  stop: jest.fn(),
  dispose: jest.fn(),
};
const listeners = new Map<string, () => void>();
const navigation = {
  isFocused: () => true,
  addListener: (event: string, callback: () => void) => {
    listeners.set(event, callback);
    return () => {
      listeners.delete(event);
    };
  },
};
let game: ReturnType<
  typeof useGameSession<
    ReturnType<typeof newBudgetSession>,
    Parameters<typeof budgetReducer>[1]
  >
>;
let renderer: ReactTestRenderer;
let appChange: (state: 'active' | 'background') => void;
function Harness() {
  game = useGameSession(budgetReducer, newBudgetSession, navigation, action =>
    action.type === 'answer' ? action.optionIndex : undefined,
  );
  return null;
}
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  NativeModules.FlightSound = native;
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_event, callback) => {
      appChange = callback;
      return { remove: jest.fn() };
    });
  await act(async () => {
    renderer = create(<Harness />);
  });
  if (!game.sound.enabled) await act(async () => game.sound.toggle());
  jest.clearAllMocks();
});
afterEach(async () => {
  await act(async () => renderer.unmount());
  jest.restoreAllMocks();
  delete NativeModules.FlightSound;
});
test('each answer has a different tone; invalid, duplicate and stale answers are silent', async () => {
  for (const optionIndex of [0, 1, 2]) {
    await act(async () => {
      game.dispatch({ type: 'restart' });
      game.dispatch({ type: 'start' });
    });
    const answer = game.dispatch;
    await act(async () => {
      answer({ type: 'answer', optionIndex: 99 });
      answer({ type: 'answer', optionIndex });
      answer({ type: 'answer', optionIndex });
    });
    expect(game.session.answers).toHaveLength(1);
    await act(async () => game.dispatch({ type: 'continue' }));
    await act(async () => answer({ type: 'answer', optionIndex }));
    expect(game.session.answers).toHaveLength(1);
  }
  expect(native.playEffect.mock.calls).toEqual([
    ['choice_1'],
    ['choice_2'],
    ['choice_3'],
  ]);
  expect(native.activate).toHaveBeenCalledTimes(3);
});
test('mute persists across games and prevents answer audio; re-enabling resumes it', async () => {
  await act(async () => game.sound.toggle());
  expect(native.setEnabled).toHaveBeenLastCalledWith(false);
  await act(async () => renderer.unmount());
  await act(async () => {
    renderer = create(<Harness />);
  });
  expect(game.sound.enabled).toBe(false);
  await act(async () => game.dispatch({ type: 'start' }));
  await act(async () => game.dispatch({ type: 'answer', optionIndex: 1 }));
  expect(native.playEffect).not.toHaveBeenCalled();
  await act(async () => game.sound.toggle());
  await act(async () => game.dispatch({ type: 'continue' }));
  await act(async () => game.dispatch({ type: 'answer', optionIndex: 0 }));
  expect(native.playEffect).toHaveBeenCalledWith('choice_1');
});
test('background and navigation blur stop sounds; foreground choices explicitly reactivate audio', async () => {
  await act(async () => game.dispatch({ type: 'start' }));
  appChange('background');
  expect(native.stop).toHaveBeenCalledTimes(1);
  await act(async () => game.dispatch({ type: 'answer', optionIndex: 0 }));
  expect(native.playEffect).not.toHaveBeenCalled();
  appChange('active');
  await act(async () => game.dispatch({ type: 'continue' }));
  listeners.get('blur')!();
  expect(native.dispose).toHaveBeenCalledTimes(1);
  await act(async () => game.dispatch({ type: 'answer', optionIndex: 1 }));
  expect(native.playEffect).not.toHaveBeenCalled();
  listeners.get('focus')!();
  await act(async () => game.dispatch({ type: 'continue' }));
  await act(async () => game.dispatch({ type: 'answer', optionIndex: 2 }));
  expect(native.activate).toHaveBeenCalledTimes(1);
  expect(native.playEffect).toHaveBeenCalledWith('choice_3');
});
test('fourth setup choice is distinct and out-of-range choices do not play', () => {
  [0, 1, 2, 3, -1, 4, 0.5, NaN].forEach(index => flightSound.choice(index));
  expect(native.playEffect.mock.calls).toEqual([
    ['choice_1'],
    ['choice_2'],
    ['choice_3'],
    ['choice_4'],
  ]);
});
