# Savings Flight presentation QA

The actual transparent PiggyPath logo replaces the generic SVG player. Its 36px footprint, engine, collision bounds, financial outcomes, and flight configuration are unchanged.

Presentation uses local native-driver effects: logo entrance, bounded flight tilt, cloud drift, collection feedback, panel entrances, and completion-only celebration. Decorative effects stop on inactivity, navigation blur, pause, restart, or unmount. Reduced motion and screen-reader preferences disable decoration; essential flight movement remains functional.

## Automated checks

- Typecheck and lint pass.
- Full suite: 223 tests in 23 suites pass (30-second test timeout for password derivation on this machine).
- All 52 flight engine, screen, and presentation tests pass, including unchanged flight-clock progression when decorative motion preferences change.
- Tests cover the exact logo footprint, entrances and cleanup, collection-only effects, cloud stopping, completion versus game-over effects, dynamic accessibility preferences, foreground/focus lifecycle, frozen scene accessibility, and existing game behavior across all levels and both modes.

## Android checks

- Dedicated package: `com.ipongoal.flightpolishqa`, explicitly named **PiggyPath Flight QA**. Its entry point opens only Games and Savings Flight; no account or database access.
- Normal-size intro, manual upward taps/checkpoint recovery, moving scene, Assisted question/feedback panels, header back, and a complete five-decision Assisted flight inspected.
- Completed flight retained Assisted score “Not applicable,” five thoughtful decisions, zero coins, and correct practice savings of ₱800 → ₱950.
- Narrow 320dp viewport with 150% text: compact logo, wrapping intro/HUD, reachable Start Flight, and scrollable decision controls checked.
- TalkBack enabled during the narrow-screen question: answer targets and progress labels were exposed; decorative artwork was excluded. A full spoken-navigation audit remains unverified.
- QA package removed after verification; font size, display size, and accessibility settings restored to their original values.
- Preview images are under `docs/screenshots/flight-polish-*`.

Build the disposable preview with JDK 17:

```powershell
cd android
.\gradlew.bat --offline -I ..\scripts\flight-polish-qa.gradle :app:assembleDebug -PreactNativeArchitectures=x86_64
```

Install only for verification. Remove `com.ipongoal.flightpolishqa` afterward and restore display/accessibility settings. Rebuild the normal app without the QA init script before distributing its APK. Physical-device performance and an iOS native run remain unverified.
