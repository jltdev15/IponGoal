# Savings Flight audio

Original additive-synthesis music and effects created for PiggyPath on 2026-10-07.
No samples, external recordings, or third-party compositions are used.

Reproduce with `node scripts/generate-flight-audio.cjs`. This writes the canonical
assets here and matching Android raw resources. iOS references these files directly.
All files are mono, 22,050 Hz, signed 16-bit PCM WAV, with normalized peaks at 70%.

- `flight_music.wav`: sixteen-bar playful C-major instrumental, 125 BPM, 30.72 seconds.
  Bright mallet melody, offbeat plucked chords, rounded bass and light shaker/brush rhythm.
  Instrument and percussion tails wrap at the loop boundary; native volume 18%.
- `flight_coin.wav`: ascending two-note chime, 0.32 seconds; native volume 55%.
- `flight_bump.wav`: descending cartoon boing with phone-friendly midrange harmonics,
  0.34 seconds; native volume 70%. Plays once per block or boundary collision,
  including the final life, and finishes while the hit/result screen is shown.
- `choice_1.wav` through `choice_4.wav`: four cheerful selection signatures,
  0.36 seconds each at native volume 55%. Different pitches and rhythms identify
  the first, second, third and fourth options without implying correctness.
  Used by all practice games and by both flight answer buttons and flying gates.

Music runs only in active flight. Choice tones play once for an accepted selection;
ignored repeat taps, invalid answers, navigation and rendering do not replay them.
All games share the same device-local Sound on/off preference. Quiz sounds stop on
leaving the screen or app; the next foreground selection reactivates audio.
Flight effects are transient engine events, never changes
in checkpoint totals. Mute is device-local (Android SharedPreferences / iOS UserDefaults)
and independent of account data. Android audio follows the in-game Sound switch and
media volume, including in Silent or Vibrate mode. Playback continues at zero media
volume so raising the volume restores sound without restarting the flight. Changing
ringtone mode does not interrupt play. The app never changes device volume or ringtone
settings. iOS continues to respect its silent switch. Lifecycle interruptions, audio-focus
loss, and headphone disconnection still stop Android audio and require explicit Resume.
Missing native support never blocks play. Screen-reader users hear effects but no
background music.
