import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { NativeModules } from 'react-native';
import {
  flightSound,
  useFlightSoundPreference,
} from '../src/services/flightSound';

test('a stalled preference read times out and an explicit enable still restores playback', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  jest.useFakeTimers();
  const native = {
    getEnabled: jest.fn(() => new Promise<boolean>(() => {})),
    setEnabled: jest.fn(),
    setMusic: jest.fn(),
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
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(preference.ready).toBe(true);
    expect(preference.enabled).toBe(false);
    await act(async () => preference.toggle());
    expect(native.setEnabled).toHaveBeenLastCalledWith(true);
    flightSound.music(true);
    expect(native.setMusic).toHaveBeenLastCalledWith(true);
  } finally {
    if (renderer) await act(async () => renderer.unmount());
    delete NativeModules.FlightSound;
    jest.useRealTimers();
  }
});
