# Savings Flight sound and visual polish

Implemented 2026-10-07. Existing physics, hit boxes, financial outcomes, four topics,
both modes, routes, and the side-view pig are preserved.

## Android media-volume policy update — 2026-10-08

- Music and effects follow the in-game Sound preference and Android media volume.
  Silent and Vibrate ringtone modes no longer suppress audio or interrupt flight.
- Zero media volume silences output through Android rather than blocking playback.
  Raising media volume during flight restores sound without restarting the game.
- Saved mute, screen-reader music suppression, backgrounding, audio-focus loss,
  and headphone-disconnection behavior are preserved. The app does not change any
  system audio settings. iOS silent-switch behavior is unchanged.
- Physical-device acceptance: in Ring, Silent, and Vibrate, enable Sound and raise
  media volume; listen for music, coin chimes, and collision bumps. Start at zero
  media volume, then raise it during flight. Verify Sound off remains silent, changing
  ringtone mode does not pause flight, and backgrounding stops audio until Resume.
- Validation: **13 tests pass across 2 suites** (`flightAudio.test.tsx` and
  `savingsFlightScreen.test.tsx`, Jest `--runInBand`). The release native bridge
  contract test (`:app:testReleaseUnitTest --tests com.ipongoal.sound.FlightSoundModuleTest`)
  passes: **1 test, 0 failures**.
- `npm run android:release` succeeds. Updated APK:
  `artifacts/PiggyPath-release.apk`. All three Flight WAVs in the APK match the
  canonical assets byte-for-byte; the APK SHA-256 sidecar matches the output.
- No Android device was connected during this update. Ring/Silent/Vibrate,
  zero-volume recovery, ringtone changes, mute, lifecycle, and physical listening
  acceptance checks remain unverified on the updated APK. The automated tests
  check JS behavior and bridge signatures, not audible native playback. Earlier
  playback evidence below predates this update.

## Changes

- Original offline plucked music, money chime, and soft collision bump. Source,
  reproduction script, and provenance: `assets/audio/flight/README.md`.
- Separate native FlightSound modules on Android and iOS; welcome sound unchanged.
  Music runs only during active flight. Transient engine events trigger effects,
  including positive decision savings and the final lost heart. Checkpoints do not
  restore events. Native failures do not block play.
- Sound switch in setup, guide, toolbar, and pause. Device-local preference;
  foreground/interruption guards; explicit resume after interruptions; no music
  with a screen reader. Android audio focus supports API 24 and later.
- Full-width HUD and separate toolbar; full-content scrolling question/recovery
  panels; clearer pink obstacles and gold coins; fixed-size decorative symbols;
  numbered optional gates corresponding to the two full answer buttons.
- The scene uses the measured space below the HUD, rather than its unscaled
  400px height. The entire stage scales without altering simulation coordinates.
  Controls render immediately, without a full-screen entrance fade.
- Gentle collision highlight with persistent text, reduced-motion cleanup,
  smaller headings, wrapping results, and accessible 48px toolbar controls.

## Automated validation

- Full Jest run: **240 tests pass, 24 suites** with `--runInBand --testTimeout=60000`.
  Default 5-second domain setup timed out on password derivation on this host;
  the longer-timeout run passed without changing the authentication tests.
- Final adaptive-height/display-hiding/singular-heart adjustment: 21 focused tests pass; TypeScript
  and lint pass. Audio tests cover saved mute, silent effects, preference sharing,
  screen-reader suppression, interruptions, explicit resume, restart/disposal,
  missing/throwing modules, event deduplication, checkpoint rollback, and final hits.
- Existing engine tests cover all four topics in both modes, all authored financial
  outcomes, completion, game-over, safe optional gates, and budget shortfalls.
- Isolated Android APK builds; native bridge contract unit test passes. Native
  methods are asynchronous void exports; getEnabled resolves a promise.
- Canonical WAV files match Android resources byte-for-byte. Peak amplitude is
  0.70 (no clipping). Music lasts 19.2 seconds; its seam delta is one 16-bit sample
  step. Coin and bump durations are 0.32 and 0.22 seconds.

## Android rendering and playback checks

Used only `com.ipongoal.flightpolishqa`, which has no database/account access.

- 390px / 100%: setup, automatic Needs vs Wants guide, playfield, question,
  positive-savings feedback, and continuation. Android playback diagnostics show
  MediaPlayer started during flight, paused at the question, and SoundPool started
  for the savings gain.
- 360px / 150%: manual Needs vs Wants guide, reachable Start, collision recovery.
- 320px / 180%: setup, manual Save or Spend guide, muted play, readable checkpoint
  panel with reachable Continue, unmuting, both later collisions including game-over,
  scrolling to Play Again / Back to Games, and successful return to the menu.
- Muted play reports both native players idle. Unmuted checkpoint continuation
  starts music and plays the collision effect; final-hit diagnostics show the effect
  started and music paused on the results transition.
- Saved Sound off survives a QA APK reinstall and process restart; the setup switch
  restores unchecked before any flight starts.
- Final 320px / 180% Budget Flight run: the entire playfield fits below the HUD;
  both question answers are reachable by scrolling; the underlying HUD/stage are
  absent from the native question hierarchy. Background/foreground returns to
  Flight paused with Resume, Restart, and Exit reachable. The immediate background
  audio dump predates settled lifecycle state, so it is not evidence of silence.
- Removed the temporary QA package and restored 1080x1920, density 420, and font
  scale 1.0. Account data and accessibility settings were not changed.

Screenshots: `docs/screenshots/flight-audio-*.png`. Build/test/playback logs:
`artifacts/flight-audio-*`. The QA helper refuses stale hierarchy dumps; Android
occasionally returns a null root during transitions, requiring a fresh read.

Final small-screen evidence: `flight-audio-playing-320-largest.png`,
`flight-audio-question-320-largest.png`, `flight-audio-question-actions-320-largest.png`,
and `flight-audio-pause-320-largest.png`. Earlier captures document intermediate
layout checks and precede the final live-footer removal.

## Limits and reproduction

- iOS source/resources are integrated, but this Windows environment cannot build
  or run iOS. Full spoken TalkBack and a physical-device listening/mix check remain
  unverified. Native playback state and waveform checks are not a listening test.
- All topic/mode combinations are covered automatically; native flows sample the
  topics and modes listed above rather than repeating the full engine matrix.
- Use JDK 17 from `android`: `./gradlew.bat --offline -I ../scripts/flight-polish-qa.gradle :app:assembleDebug :app:testDebugUnitTest -PreactNativeArchitectures=x86_64`.
- Verify `android/build/learning-games-app/outputs/apk/debug/output-metadata.json`
  identifies the isolated package before installation. The helper
  `node scripts/flight-audio-qa.cjs read` inspects it; `shot <name>` saves a screenshot.

## Android phone silence investigation - 2026-10-09

- User reports Sound on and maximum Media volume, with no audible flight audio.
  No physical Android device is connected, so the phone-specific cause is unconfirmed.
- Added Android FlightSound logs for activation, preference and music requests,
  denied audio focus, failed WAV/effect loading, player errors, and successful
  music start with Media volume. JavaScript now warns once per unavailable or
  failing native method instead of silently hiding bridge failures.
- Playback policy and volume levels are unchanged. These are diagnostic changes,
  not a confirmed repair for the reported phone issue.
- Local SDK/AVD paths and generated autolinking were stale after moving the
  project to Mobile-apps/IponGoal; refreshed local generated configuration.
- Focused Jest validation: 13 tests pass across flightAudio and savingsFlightScreen
  with --runInBand --testTimeout=60000. A default-timeout run during the native
  rebuild timed out on one screen test; the longer-timeout run passes.
  ESLint passes for src/services/flightSound.ts.
- Isolated x86_64 Flight QA APK builds successfully; native bridge contract test
  passes (1 test, 0 failures). Build and native-test logs are in
  artifacts/flight-sound-investigation-*.log.
- The distributable artifacts/PiggyPath-release.apk has not been replaced with
  this diagnostic build. Connect the affected phone with USB debugging enabled
  to inspect its installed binary, audio route, focus, player state, and logs.

- Native runtime evidence from the isolated Android 36 emulator: Start Flight
  requests music with enabled=true, active=true, interrupted=false; FlightSound
  reports Music started with Media volume 5. dumpsys media.player identifies the
  QA package, audio/raw decoding, stream 3, volume 0.18, and an unpaused renderer.
  The subsequent gameplay transition requests music=false. Logs and player/audio
  dumps are saved as artifacts/flight-sound-investigation-runtime.log,
  -player.txt, and -audio.txt. This proves native playback starts in the emulator;
  it is not a physical-phone listening test. The test package was removed after
  the check and the headless emulator was stopped.
