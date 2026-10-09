import { useEffect, useState } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParams } from '../../navigation/types';

export function useFlightMotion(
  navigation: NativeStackNavigationProp<MainStackParams, 'SavingsFlight'>,
) {
  const [preferences, setPreferences] = useState({
    reduced: true,
    reader: true,
  });
  const [active, setActive] = useState(
    AppState.currentState == null || AppState.currentState === 'active',
  );
  const [focused, setFocused] = useState(
    () => navigation.isFocused?.() ?? true,
  );
  useEffect(() => {
    let live = true;
    let reducedChanged = false;
    let readerChanged = false;
    const reduced = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      value => {
        reducedChanged = true;
        setPreferences(current => ({ ...current, reduced: value }));
      },
    );
    const reader = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      value => {
        readerChanged = true;
        setPreferences(current => ({ ...current, reader: value }));
      },
    );
    Promise.all([
      AccessibilityInfo.isReduceMotionEnabled().catch(() => true),
      AccessibilityInfo.isScreenReaderEnabled().catch(() => true),
    ]).then(([reduceMotion, screenReader]) => {
      if (live)
        setPreferences(current => ({
          reduced: reducedChanged ? current.reduced : reduceMotion,
          reader: readerChanged ? current.reader : screenReader,
        }));
    });
    const app = AppState.addEventListener('change', value =>
      setActive(value === 'active'),
    );
    const blur = navigation.addListener('blur', () => setFocused(false));
    const focus = navigation.addListener('focus', () => setFocused(true));
    return () => {
      live = false;
      reduced.remove();
      reader.remove();
      app.remove();
      blur();
      focus();
    };
  }, [navigation]);
  return active && focused && !preferences.reduced && !preferences.reader;
}
