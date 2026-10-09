import { NativeModules } from 'react-native';
import { useEffect, useSyncExternalStore } from 'react';

interface FlightSoundModule {
  getEnabled(): Promise<boolean>;
  setEnabled(enabled: boolean): void;
  prepare(): void;
  activate(): void;
  setMusic(playing: boolean): void;
  playEffect(effect: 'coin' | 'bump'): void;
  stop(): void;
  dispose(): void;
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
        const saved = await NativeModules.FlightSound?.getEnabled();
        if (version === initialVersion && typeof saved === 'boolean')
          enabled = saved;
      } catch {
        /* Older binaries and unavailable audio keep the default. */
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
  effect: (effect: 'coin' | 'bump') => {
    if (ready && enabled) invoke('playEffect', effect);
  },
  stop: () => invoke('stop'),
  release: () => invoke('dispose'),
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
      invoke('setEnabled', enabled);
      emit();
    },
  };
}
