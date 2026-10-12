import { NativeModules } from 'react-native';
import { useEffect, useSyncExternalStore } from 'react';

export type GameEffect =
  | 'coin'
  | 'bump'
  | 'choice_1'
  | 'choice_2'
  | 'choice_3'
  | 'choice_4';
const choiceEffects: readonly GameEffect[] = [
  'choice_1',
  'choice_2',
  'choice_3',
  'choice_4',
];
interface FlightSoundModule {
  getEnabled(): Promise<boolean>;
  setEnabled(enabled: boolean): void;
  prepare(): void;
  activate(): void;
  setMusic(playing: boolean): void;
  playEffect(effect: GameEffect): void;
  stop(): void;
  dispose(): void;
  testSound(): Promise<string>;
}
let enabled = true;
let ready = false;
let loading: Promise<void> | undefined;
let version = 0;
const listeners = new Set<() => void>();
const reportedFailures = new Set<keyof FlightSoundModule>();
function reportFailure(name: keyof FlightSoundModule, error?: unknown) {
  if (reportedFailures.has(name)) return;
  reportedFailures.add(name);
  console.warn(`Savings Flight audio: ${name} unavailable`, error);
}
function emit() {
  version++;
  listeners.forEach(listener => listener());
}
async function withTimeout<T>(request: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      request,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('Audio request timed out')),
          2000,
        );
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
function invoke<K extends keyof FlightSoundModule>(
  name: K,
  ...args: Parameters<FlightSoundModule[K]>
) {
  try {
    const module = NativeModules.FlightSound as FlightSoundModule | undefined;
    const method = module?.[name] as
      | ((...params: Parameters<FlightSoundModule[K]>) => void)
      | undefined;
    if (typeof method !== 'function') {
      reportFailure(name);
      return;
    }
    method(...args);
  } catch (error) {
    reportFailure(name, error);
  }
}
async function load() {
  if (!loading) {
    const initialVersion = version;
    loading = (async () => {
      try {
        const saved = await withTimeout(
          Promise.resolve(NativeModules.FlightSound?.getEnabled()),
        );
        if (version === initialVersion && typeof saved === 'boolean')
          enabled = saved;
      } catch (error) {
        reportFailure('getEnabled', error);
        // Unknown settings must not be presented as a confirmed enabled state.
        if (version === initialVersion) enabled = false;
      }
      ready = true;
      emit();
    })();
  }
  return loading;
}
export const flightSound = {
  prepare: () => invoke('prepare'),
  activate: () => invoke('activate'),
  music: (playing: boolean) => invoke('setMusic', playing && ready && enabled),
  effect: (effect: GameEffect) => {
    if (ready && enabled) invoke('playEffect', effect);
  },
  choice: (index: number) => {
    const effect = choiceEffects[index];
    if (effect && ready && enabled) invoke('playEffect', effect);
  },
  stop: () => invoke('stop'),
  release: () => invoke('dispose'),
  test: async (): Promise<string> => {
    try {
      const module = NativeModules.FlightSound as FlightSoundModule | undefined;
      if (typeof module?.testSound !== 'function') return 'unavailable';
      return await withTimeout(module.testSound());
    } catch (error) {
      reportFailure('testSound', error);
      return error instanceof Error &&
        error.message === 'Audio request timed out'
        ? 'timed_out'
        : 'playback_failed';
    }
  },
};
export function useFlightSoundPreference() {
  useSyncExternalStore(
    listener => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => version,
  );
  useEffect(() => {
    void load();
  }, []);
  return {
    enabled,
    ready,
    toggle: () => {
      enabled = !enabled;
      // A user's explicit choice must not wait for a stalled preference read.
      ready = true;
      invoke('setEnabled', enabled);
      emit();
    },
  };
}
