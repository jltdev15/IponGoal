import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

// Keep unknown accessibility preferences conservative until native queries settle.
export function useWelcomeIntro() {
  const [welcome, setWelcome] = useState(true);
  const [preferences, setPreferences] = useState({
    ready: false,
    reduced: true,
    reader: true,
  });
  const [appState, setAppState] = useState(AppState.currentState);
  const art = useRef(new Animated.Value(0)).current;
  const message = useRef(new Animated.Value(0)).current;
  const page = useRef(new Animated.Value(1)).current;
  const animation = useRef<Animated.CompositeAnimation | null>(null);
  const focused = useRef(false);
  const transitioning = useRef(false);
  const entered = useRef(false);
  const clearWork = useCallback(() => {
    animation.current?.stop();
    animation.current = null;
  }, []);

  useEffect(() => {
    let live = true;
    let reducedChanged = false;
    let readerChanged = false;
    const reducedSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      reduced => {
        reducedChanged = true;
        setPreferences(current => ({ ...current, reduced }));
      },
    );
    const readerSubscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      reader => {
        readerChanged = true;
        setPreferences(current => ({ ...current, reader }));
      },
    );
    Promise.all([
      AccessibilityInfo.isReduceMotionEnabled().catch(() => true),
      AccessibilityInfo.isScreenReaderEnabled().catch(() => true),
    ]).then(([reduced, reader]) => {
      if (live) {
        setPreferences(current => ({
          ready: true,
          reduced: reducedChanged ? current.reduced : reduced,
          reader: readerChanged ? current.reader : reader,
        }));
      }
    });
    const stateSubscription = AppState.addEventListener('change', setAppState);
    return () => {
      live = false;
      reducedSubscription.remove();
      readerSubscription.remove();
      stateSubscription.remove();
    };
  }, []);

  const continueToOnboarding = useCallback(() => {
    if (
      !welcome ||
      !focused.current ||
      transitioning.current ||
      (appState !== null && appState !== 'active')
    ) {
      return;
    }
    transitioning.current = true;
    clearWork();
    art.setValue(1);
    message.setValue(1);
    if (preferences.reduced || preferences.reader) {
      page.setValue(1);
      setWelcome(false);
      return;
    }
    animation.current = Animated.timing(page, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    });
    animation.current.start(({ finished }) => {
      if (finished && focused.current) {
        setWelcome(false);
      }
    });
  }, [
    welcome,
    appState,
    preferences.reduced,
    preferences.reader,
    clearWork,
    art,
    message,
    page,
  ]);

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      // Finish an accepted third tap if an accessibility/lifecycle change
      // interrupted its fade, rather than leaving a locked welcome screen.
      if (welcome && transitioning.current) {
        setWelcome(false);
      }
      transitioning.current = false;
      const active = appState === null || appState === 'active';
      if (!welcome) {
        if (preferences.reduced || preferences.reader || !active) {
          page.setValue(1);
        } else {
          animation.current = Animated.timing(page, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          });
          animation.current.start();
        }
      } else {
        page.setValue(1);
        if (
          !active ||
          !preferences.ready ||
          preferences.reduced ||
          preferences.reader ||
          entered.current
        ) {
          if (preferences.ready) {
            art.setValue(1);
            message.setValue(1);
          }
          if (preferences.ready && active) {
            entered.current = true;
          }
        } else {
          entered.current = true;
          art.setValue(0);
          message.setValue(0);
          animation.current = Animated.parallel([
            Animated.timing(art, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(message, {
              toValue: 1,
              duration: 350,
              delay: 150,
              useNativeDriver: true,
            }),
          ]);
          animation.current.start();
        }
      }
      return () => {
        focused.current = false;
        clearWork();
      };
    }, [welcome, preferences, appState, clearWork, art, message, page]),
  );

  return { welcome, continueToOnboarding, art, message, page };
}
