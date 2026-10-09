import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import {
  AccessibilityInfo,
  DeviceEventEmitter,
  NativeModules,
} from 'react-native';
import {
  flightSound,
  useFlightSoundPreference,
} from '../src/services/flightSound';
import { useFlightAudio } from '../src/games/savingsFlight/useFlightAudio';
import { SavingsFlightEngine } from '../src/games/savingsFlight/SavingsFlightEngine';
import { EngineSnapshot } from '../src/games/savingsFlight/SavingsFlightEngine';

const native = {
  getEnabled: jest.fn().mockResolvedValue(false),
  setEnabled: jest.fn(),
  prepare: jest.fn(),
  activate: jest.fn(),
  setMusic: jest.fn(),
  playEffect: jest.fn(),
  stop: jest.fn(),
  dispose: jest.fn(),
};
let renderer: ReactTestRenderer;
let preference: ReturnType<typeof useFlightSoundPreference>;
const engine = new SavingsFlightEngine('needs', 'assisted');
const interrupt = jest.fn();
function Harness({ state }: { state: EngineSnapshot }) {
  preference = useFlightAudio(engine, state, interrupt);
  return null;
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  NativeModules.FlightSound = native;
  jest.clearAllMocks();
  jest
    .spyOn(AccessibilityInfo, 'isScreenReaderEnabled')
    .mockResolvedValue(false);
});
afterEach(async () => {
  if (renderer) await act(async () => renderer.unmount());
  jest.restoreAllMocks();
  delete NativeModules.FlightSound;
});

test('loads saved mute, persists toggle across mounts, and applies status and reader music rules', async () => {
  const playing = { ...engine.getSnapshot(), gameStatus: 'playing' as const };
  await act(async () => {
    renderer = create(<Harness state={playing} />);
  });
  expect(preference.enabled).toBe(false);
  expect(native.setMusic).toHaveBeenLastCalledWith(false);
  flightSound.effect('coin');
  expect(native.playEffect).not.toHaveBeenCalled();
  await act(async () => preference.toggle());
  expect(native.setEnabled).toHaveBeenLastCalledWith(true);
  expect(native.setMusic).toHaveBeenLastCalledWith(true);
  await act(async () =>
    renderer.update(
      <Harness
        state={{ ...playing, gameStatus: 'decision', decisionPhase: 'reading' }}
      />,
    ),
  );
  expect(native.setMusic).toHaveBeenLastCalledWith(false);
  await act(async () =>
    renderer.update(
      <Harness
        state={{
          ...playing,
          gameStatus: 'decision',
          decisionPhase: 'choosing',
        }}
      />,
    ),
  );
  expect(native.setMusic).toHaveBeenLastCalledWith(false);
  await act(async () => renderer.unmount());
  expect(native.dispose).toHaveBeenCalled();
  jest
    .spyOn(AccessibilityInfo, 'isScreenReaderEnabled')
    .mockResolvedValue(true);
  await act(async () => {
    renderer = create(<Harness state={playing} />);
  });
  expect(preference.enabled).toBe(true);
  expect(native.getEnabled).toHaveBeenCalledTimes(1);
  expect(native.setMusic).toHaveBeenLastCalledWith(false);
  flightSound.effect('coin');
  expect(native.playEffect).toHaveBeenLastCalledWith('coin');
});

test('interruptions pause the game and remove their subscription on exit', async () => {
  await act(async () => {
    renderer = create(<Harness state={engine.getSnapshot()} />);
  });
  await act(async () => DeviceEventEmitter.emit('FlightSoundInterrupted'));
  expect(interrupt).toHaveBeenCalledTimes(1);
  await act(async () => renderer.unmount());
  DeviceEventEmitter.emit('FlightSoundInterrupted');
  expect(interrupt).toHaveBeenCalledTimes(1);
  expect(native.dispose).toHaveBeenCalled();
});

test('missing or throwing native audio never blocks flight operations', () => {
  delete NativeModules.FlightSound;
  expect(() => {
    flightSound.prepare();
    flightSound.music(true);
    flightSound.effect('bump');
    flightSound.stop();
    flightSound.release();
  }).not.toThrow();
  NativeModules.FlightSound = {
    setMusic: () => {
      throw new Error('unavailable');
    },
    playEffect: () => {
      throw new Error('unavailable');
    },
  };
  expect(() => {
    flightSound.music(true);
    flightSound.effect('coin');
  }).not.toThrow();
});
