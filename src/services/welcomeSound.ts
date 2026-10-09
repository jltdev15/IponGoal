import { NativeModules } from 'react-native';

interface WelcomeSoundModule {
  prepare(): void;
  play(): void;
}

// Native playback owns the clip so a screen transition cannot cut it short.
// Sound is optional: older binaries and unavailable audio must still allow entry.
function invoke(method: keyof WelcomeSoundModule) {
  try {
    const sound = NativeModules.WelcomeSound as WelcomeSoundModule | undefined;
    sound?.[method]();
  } catch {
    // A decorative sound must never prevent onboarding.
  }
}

export const prepareWelcomeSound = () => invoke('prepare');
export const playWelcomeSound = () => invoke('play');
