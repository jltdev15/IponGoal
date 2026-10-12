import React, { useEffect, useRef, useState } from 'react';
import { Platform, Text } from 'react-native';
import { AppButton } from '../../../components/AppButton';
import { flightSound } from '../../../services/flightSound';
import { theme } from '../../../theme/theme';

const messages: Record<string, string> = {
  completed:
    'Sound check completed. If you did not hear a chime, check your phone’s game sound and audio output settings.',
  muted: 'Game sound is off. Turn sound on and try again.',
  volume_zero:
    'Phone media volume is muted. Turn up media volume and try again.',
  inactive: 'Return to the game and try again.',
  focus_denied:
    'Android is blocking game audio. End any active call or other audio session and try again.',
  load_failed:
    'The game could not load its sound. Reopen the app and try again.',
  playback_failed:
    'Android could not play the sound. Reopen the app and try again.',
  unavailable:
    'Sound check is unavailable. Install the latest app build and try again.',
  timed_out: 'Sound check did not respond. Reopen the app and try again.',
};

export function FlightSoundCheck({ enabled }: { enabled: boolean }) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState('');
  const alive = useRef(false);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => setResult(''), [enabled]);
  if (Platform.OS !== 'android') return null;
  return (
    <>
      <AppButton
        title={checking ? 'Checking sound…' : 'Test sound'}
        variant="secondary"
        disabled={!enabled || checking}
        onPress={async () => {
          setChecking(true);
          const status = await flightSound.test();
          if (alive.current) {
            setChecking(false);
            setResult(messages[status] || messages.playback_failed);
          }
        }}
      />
      {!!result && (
        <Text style={theme.muted} accessibilityLiveRegion="polite">
          {result}
        </Text>
      )}
    </>
  );
}
