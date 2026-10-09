# Savings Flight audio

Original additive-synthesis music and effects created for PiggyPath on 2026-10-07.
No samples, external recordings, or third-party compositions are used.

Reproduce with `node scripts/generate-flight-audio.cjs`. This writes the canonical
assets here and matching Android raw resources. iOS references these files directly.
All files are mono, 22,050 Hz, signed 16-bit PCM WAV, with normalized peaks at 70%.

- `flight_music.wav`: eight-bar C-major plucked instrumental, 100 BPM, 19.2 seconds.
  Note tails wrap at the loop boundary for a continuous waveform; native volume 18%.
- `flight_coin.wav`: ascending two-note chime, 0.32 seconds; native volume 55%.
- `flight_bump.wav`: soft descending sinusoidal bump, 0.22 seconds; native volume 55%.

Music runs only in active flight. Effects are transient engine events, never changes
in checkpoint totals. Mute is device-local (Android SharedPreferences / iOS UserDefaults)
and independent of account data. Android audio follows the in-game Sound switch and
media volume, including in Silent or Vibrate mode. Playback continues at zero media
volume so raising the volume restores sound without restarting the flight. Changing
ringtone mode does not interrupt play. The app never changes device volume or ringtone
settings. iOS continues to respect its silent switch. Lifecycle interruptions, audio-focus
loss, and headphone disconnection still stop Android audio and require explicit Resume.
Missing native support never blocks play. Screen-reader users hear effects but no
background music.
