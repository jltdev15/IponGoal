import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  AppState,
  DeviceEventEmitter,
  NativeEventEmitter,
  NativeModules,
} from 'react-native';
import {
  flightSound,
  useFlightSoundPreference,
} from '../../services/flightSound';
import { EngineSnapshot, SavingsFlightEngine } from './SavingsFlightEngine';

export function useFlightAudio(
  engine: SavingsFlightEngine,
  state: EngineSnapshot,
  onInterrupt: () => void,
) {
  const preference = useFlightSoundPreference();
  const [reader, setReader] = useState(true);
  const interrupt = useRef(onInterrupt);
  interrupt.current = onInterrupt;
  useEffect(() => {
    let alive = true;
    let changed = false;
    flightSound.prepare();
    const readerTimeout = setTimeout(() => {
      if (alive && !changed) setReader(false);
    }, 2000);
    AccessibilityInfo.isScreenReaderEnabled()
      .then(value => {
        clearTimeout(readerTimeout);
        if (alive && !changed) setReader(value);
      })
      .catch(() => {
        clearTimeout(readerTimeout);
        if (alive && !changed) setReader(false);
      });
    const screenReader = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      value => {
        changed = true;
        clearTimeout(readerTimeout);
        setReader(value);
      },
    );
    const emitter = NativeModules.FlightSound?.addListener
      ? new NativeEventEmitter(NativeModules.FlightSound)
      : DeviceEventEmitter;
    const audio = emitter.addListener('FlightSoundInterrupted', () =>
      interrupt.current(),
    );
    const app = AppState.addEventListener('change', status => {
      if (status !== 'active') {
        flightSound.stop();
        interrupt.current();
      }
    });
    return () => {
      alive = false;
      clearTimeout(readerTimeout);
      screenReader.remove();
      audio.remove();
      app.remove();
      engine.drainEvents();
      flightSound.release();
    };
  }, [engine]);
  useEffect(() => {
    flightSound.music(state.gameStatus === 'playing' && !reader);
  }, [state.gameStatus, reader, preference.enabled, preference.ready, engine]);
  return preference;
}
