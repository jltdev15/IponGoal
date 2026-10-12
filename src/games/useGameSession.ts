import { useEffect, useReducer, useRef } from 'react';
import { AppState } from 'react-native';
import { flightSound, useFlightSoundPreference } from '../services/flightSound';

type GameNavigation = {
  isFocused?: () => boolean;
  addListener?: (event: 'focus' | 'blur', listener: () => void) => () => void;
};

/** Play only accepted choices. A second tap cannot answer or sound twice. */
export function useGameSession<S, A>(
  reducer: (state: S, action: A) => S,
  initialize: () => S,
  navigation: GameNavigation,
  choiceIndex: (action: A, state: S) => number | undefined,
) {
  const [session, reduce] = useReducer(reducer, undefined, initialize);
  const current = useRef(session);
  current.current = session;
  const sound = useFlightSoundPreference();
  const focused = useRef(navigation.isFocused?.() ?? true);
  const foreground = useRef(
    AppState.currentState !== 'background' &&
      AppState.currentState !== 'inactive',
  );
  useEffect(() => {
    if (focused.current) flightSound.prepare();
    const focus = navigation.addListener?.('focus', () => {
      focused.current = true;
      flightSound.prepare();
    });
    const blur = navigation.addListener?.('blur', () => {
      focused.current = false;
      flightSound.release();
    });
    const app = AppState.addEventListener('change', status => {
      foreground.current = status === 'active';
      if (!foreground.current && focused.current) flightSound.stop();
    });
    return () => {
      focus?.();
      blur?.();
      app.remove();
      if (focused.current) flightSound.release();
    };
  }, [navigation]);
  const dispatch = (action: A) => {
    const before = current.current;
    const index = choiceIndex(action, before);
    // Answer callbacks from an old question cannot select the next question.
    if (index !== undefined && before !== session) return;
    const after = reducer(before, action);
    if (after === before) return;
    current.current = after;
    reduce(action);
    if (
      index !== undefined &&
      focused.current &&
      foreground.current &&
      sound.ready &&
      sound.enabled
    ) {
      flightSound.activate();
      flightSound.choice(index);
    }
  };
  return { session, dispatch, sound };
}
