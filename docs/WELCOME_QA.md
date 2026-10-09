# Three-tap welcome QA

The Welcome route shows the app logo and savings message, with the instruction
"Tap the piggy 3 times to begin" and a visible 0/3 counter. Three logo activations
at any pace open the existing three onboarding steps. There is no Continue button
or automatic advancement. Tapping elsewhere, backgrounding, or leaving and
reopening the welcome resets a partial sequence. Reduced motion and screen readers
disable the fade; the third activation still enters onboarding. Existing accounts
retain their startup flow.

The bundled cartoon oink pair plays on each activation, including the third,
using native Android SoundPool and iOS AVAudioPlayer playback. Rapid activations
restart playback; the short sound survives the onboarding transition. System
volume and silent mode are respected, and audio failure cannot block onboarding.
The native module requires rebuilding the app; Metro refresh alone cannot add it.

Automated validation on 2026-10-07: all 22 welcome/onboarding tests pass, including
long pauses, outside taps, rapid repeated activation, keyboard/accessibility click
routing, unavailable audio, lifecycle reset, interrupted transitions, compact
artwork, existing onboarding navigation, and hardware Back. Lint passes. The full
suite reports failures in unrelated game/authentication areas; full typecheck also
reports unrelated game-grid and budget-challenge interface errors.

The native Android regression test `WelcomeSoundModuleTest` passes and enforces
the asynchronous void method signatures required by React Native interop.

## Refined cartoon oink — 2026-10-07

The current 0.555-second asset refines the performed oink pair with less pitch
shift, broad nasal presence, softer breath noise and transients, and a 110 ms
gap. The second oink is slightly lower and softer. Source and reproducible
processing details are in assets/audio/README.md. Validation confirms valid mono
PCM16 at 44.1 kHz, identical Android/iOS asset bytes, two substantial vocal bursts
with silence between them, faded edges, no clipping, and deterministic
regeneration. Generator lint passes. The audio player and three-tap behavior are
unchanged. This asset needs an app rebuild; no new native build or device listening
check was performed for this refinement. The fresh preview is
artifacts/welcome-refined-oink-v2.wav. Earlier build observations below apply to
the older recording.

## Recorded-oink correction — 2026-10-07

The user reported that the synthesized clip did not sound like an oink. It has
been replaced with qubodup's CC0 Pig Oink recording (see assets/audio/README.md
for source and license), played at its original pitch and timing. The packaging
script now uses the retained recording instead of generating a synthetic tone.
The 0.744-second PCM16 mono clip has no clipped samples, and the Android raw
resource and iOS source asset have identical SHA-256 hashes. All 22 welcome tests
still pass. The isolated Android preview build passes, and its APK contains the
exact replacement WAV. Perceived sound quality should be assessed using the supplied audio
preview or on a device; waveform checks alone do not establish that.

## Manual acceptance checks

- Confirm welcome stays visible after a long wait, and Continue is absent.
- Activate the logo once and twice: hear an oink and see 1/3 then 2/3.
- Tap the message or blank screen area: progress returns to 0/3.
- Activate the logo three times: step one opens once and the third oink finishes.
- Repeat in airplane mode, at zero media volume, and in silent mode.
- Use a physical keyboard and a screen reader to activate the logo three times.
- Check narrow displays and large text; scroll to reach the hint if needed.
- Confirm backgrounding and reopening the welcome reset partial progress.
- Confirm all remaining onboarding controls retain their existing behavior.

## Isolated native preview

From `android/`, with JDK 17 configured, build:

```powershell
.\gradlew.bat :app:assembleDebug -PreactNativeArchitectures=x86_64 --offline -I ../scripts/welcome-qa.gradle
```

Install the generated APK only on an x86_64 emulator. Its application ID is
`com.ipongoal.welcomeqa`; it never opens the real app's database. The preview
uses bundled JavaScript, the real Welcome screen, and placeholder authentication
destinations. It must not be distributed as the normal app. Rebuild without the
init script before using the regular variant output for installation/distribution.

## Emulator observations — 2026-10-07

The isolated x86_64 Android build passes. Screenshots
`screenshots/welcome-three-tap.png` and
`screenshots/welcome-three-tap-onboarding.png` show the new logo, instruction and
counter, followed by the first onboarding step. The screen remained on welcome
after a long wait; logo taps showed 1/3 and 2/3, an outside tap reset to 0/3, and
three consecutive taps opened "Set your goal".

Android audio-service records confirm that the welcome SoundPool registers and
starts playback on a logo tap. Hardware-keyboard Tab/Enter activation opened the
first onboarding step while media volume was zero and airplane mode was enabled.
Temporary volume and connectivity settings were restored. The shared emulator
was also in use by another QA app; no production account or goal data was opened.

iOS source/resource wiring is included, but an iOS build, full spoken-output
screen-reader audit, and physical-device listening check remain unverified.

## Emulator observations — 2026-10-06

Historical observations below describe the previous automatic welcome behavior
and the screenshots from that build, not the current three-tap interaction.

The isolated x86_64 build passes. Screenshots `screenshots/welcome-intro.png` and
`screenshots/welcome-onboarding-step1.png` show the rendered welcome followed by
automatic advancement to step one at normal text size. At 360 dp width and 150%
text, `screenshots/welcome-large-talkback.png` shows the complete message and
Continue button without clipping. With TalkBack enabled, welcome remained visible
after an eight-second wait and its heading received accessibility focus.

TalkBack subsequently opened its own notification permission dialog; a full
spoken-output and gesture audit was not completed. Physical-device animation
smoothness remains unverified. Emulator font scale (1.0), physical density (420),
and disabled accessibility-service state were restored. Real account/goal data
was never opened or modified by this harness.
