import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { NativeModules, Platform, Text } from 'react-native';
import { AppButton } from '../src/components/AppButton';
import { FlightSoundCheck } from '../src/games/savingsFlight/components/FlightSoundCheck';
import { flightSound } from '../src/services/flightSound';

let renderer: ReactTestRenderer | undefined;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  jest.replaceProperty(Platform, 'OS', 'android');
});
afterEach(async () => {
  if (renderer) await act(async () => renderer!.unmount());
  renderer = undefined;
  delete NativeModules.FlightSound;
  jest.restoreAllMocks();
});

test.each([
  ['focus_denied', 'Android is blocking game audio'],
  ['volume_zero', 'Phone media volume is muted'],
  ['load_failed', 'could not load its sound'],
  ['completed', 'If you did not hear a chime'],
])(
  'sound check reports %s without claiming that audio was heard',
  async (status, message) => {
    NativeModules.FlightSound = {
      testSound: jest.fn().mockResolvedValue(status),
    };
    await act(async () => {
      renderer = create(<FlightSoundCheck enabled />);
    });
    await act(async () => {
      await renderer!.root.findByType(AppButton).props.onPress();
    });
    expect(
      renderer!.root
        .findAllByType(Text)
        .some(node => String(node.props.children).includes(message)),
    ).toBe(true);
    expect(renderer!.root.findByType(AppButton).props.disabled).toBe(false);
  },
);

test('older phone builds report an unavailable sound check safely', async () => {
  expect(await flightSound.test()).toBe('unavailable');
});

test('a native sound-check failure does not tell users to reinstall a current build', async () => {
  NativeModules.FlightSound = {
    testSound: jest.fn().mockRejectedValue(new Error('Audio unavailable')),
  };
  expect(await flightSound.test()).toBe('playback_failed');
});

test('a stalled sound check returns a bounded timeout', async () => {
  jest.useFakeTimers();
  try {
    NativeModules.FlightSound = {
      testSound: jest.fn(() => new Promise<string>(() => {})),
    };
    const result = flightSound.test();
    jest.advanceTimersByTime(2000);
    expect(await result).toBe('timed_out');
  } finally {
    jest.useRealTimers();
  }
});

test('muted games disable the sound check', async () => {
  await act(async () => {
    renderer = create(<FlightSoundCheck enabled={false} />);
  });
  expect(renderer!.root.findByType(AppButton).props.disabled).toBe(true);
});
