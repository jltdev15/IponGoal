import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  playWelcomeSound,
  prepareWelcomeSound,
} from '../services/welcomeSound';

export function useWelcomeTaps(
  welcome: boolean,
  continueToOnboarding: () => void,
) {
  const [tapCount, setTapCount] = useState(0);
  // Refs guard rapid activations before React has rendered the next count.
  const count = useRef(0);
  const focused = useRef(false);
  const active = useRef(AppState.currentState);
  const reset = useCallback(() => {
    count.current = 0;
    setTapCount(0);
  }, []);

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      if (welcome) {
        reset();
        prepareWelcomeSound();
      }
      return () => {
        focused.current = false;
      };
    }, [welcome, reset]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      active.current = state;
      if (welcome && state !== 'active') {
        reset();
      }
    });
    return () => subscription.remove();
  }, [welcome, reset]);

  const tapLogo = useCallback(() => {
    if (
      !welcome ||
      !focused.current ||
      (active.current !== null && active.current !== 'active') ||
      count.current >= 3
    ) {
      return;
    }
    count.current += 1;
    setTapCount(count.current);
    playWelcomeSound();
    if (count.current === 3) {
      continueToOnboarding();
    }
  }, [welcome, continueToOnboarding]);

  const resetLogoTaps = useCallback(() => {
    if (welcome && count.current < 3) {
      reset();
    }
  }, [welcome, reset]);

  return { tapCount, tapLogo, resetLogoTaps };
}
