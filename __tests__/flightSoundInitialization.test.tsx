import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { NativeModules } from 'react-native';
import {
  flightSound,
  useFlightSoundPreference,
} from '../src/services/flightSound';

test('an explicit sound choice unblocks playback before a stalled preference read finishes', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  let finishRead!: (enabled: boolean) => void;
  const native = {
    getEnabled: jest.fn(
      () =>
        new Promise<boolean>(resolve => {
          finishRead = resolve;
        }),
    ),
    setEnabled: jest.fn(),
    setMusic: jest.fn(),
    playEffect: jest.fn(),
  };
  NativeModules.FlightSound = native;
  let preference!: ReturnType<typeof useFlightSoundPreference>;
  function Harness() {
    preference = useFlightSoundPreference();
    return null;
  }
  let renderer!: ReactTestRenderer;
  try {
    await act(async () => {
      renderer = create(<Harness />);
    });
    expect(preference.ready).toBe(false);
    await act(async () => preference.toggle());
    await act(async () => preference.toggle());
    expect(preference.enabled).toBe(true);
    expect(preference.ready).toBe(true);
    flightSound.music(true);
    flightSound.effect('coin');
    expect(native.setMusic).toHaveBeenLastCalledWith(true);
    expect(native.playEffect).toHaveBeenLastCalledWith('coin');
    await act(async () => finishRead(false));
    expect(preference.enabled).toBe(true);
  } finally {
    if (renderer) await act(async () => renderer.unmount());
    delete NativeModules.FlightSound;
  }
});
