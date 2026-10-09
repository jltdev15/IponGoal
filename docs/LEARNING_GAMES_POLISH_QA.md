# Learning Games polish QA

Implemented 2026-10-07.

## Changes

- Three visible games: Needs or Wants, Budget Challenge, Savings Flight.
- Full-width cards show descriptions and round lengths. Needs or Wants is marked Start here.
- Save or Spend and Goal Builder remain in source and registered routes, but are no longer in the menu.
- SavingsFlightSetup is the only new internal route. It retains all four topics and both modes, defaulting to manual.
- Equally styled answers, shorter introductions, quieter restart actions, and expandable result reviews.
- Budget presentation distinguishes pending, covered, and unfunded essentials; existing calculations remain intact.
- Flight guide, smaller HUD information set, optional gate controls, and manual-only result score. Engine, collision bounds, player sprite, and financial outcomes remain unchanged.
- A decorative guide coin uses a fixed-size peso symbol so enlarged text cannot clip its artwork. Instruction text still scales.
- Profile and bottom-navigation changes were preserved.

## Automated validation

- TypeScript and lint pass.
- Retained-game regression run: 80 tests across six suites pass.
- Full run: 229 of 230 tests passed; one password-derivation test exceeded 30 seconds while the native compiler was active. All 31 domain tests passed on isolated rerun after compilation, including real-data isolation for learning games. Thus every test passed across the full run and retry.
- Final guide adjustment: all 16 Flight screen/presentation tests pass; TypeScript and lint rerun successfully.
- Tests cover three menu destinations, all four Flight topics in both modes, feature gating, equivalent answer styling, budget pending/covered/unfunded labels, all 243 budget plans, frozen reading/feedback, optional gates, restart, pause/resume, completion/game-over, expandable reviews, Back to Games, and decorative animation cleanup.
- Updated the existing welcome-footer test to use the current three-logo-tap entry interaction; authentication behavior was not changed.

## Fresh Android checks

Used the isolated com.ipongoal.flightpolishqa package, which opens no accounts or database.

| Logical width / font setting | Inspected |
| --- | --- |
| 390 / 100% | Three-card menu; complete Needs or Wants round, feedback, result, expanded review, Back to Games; Budget question and feedback |
| 360 / 150% | Stacked menu cards; Budget choices, updated essential statuses and scrolling; Flight setup, Automatic question and answer controls, feedback, pause/restart, guide and reachable Start |
| 320 / 180% | Menu and setup wrapping; manual guide and reachable Start; checkpoint panel scrolling, both recoveries, game-over result and Back to Games; rebuilt guide coin without clipping |

Accessible labels were inspected through the native UI hierarchy, including game cards, mode selection, answers, pause, goal progress, hearts, and result actions. At the largest text setting, the live HUD and overlay each scroll within their areas; checkpoint controls were reached by scrolling inside the overlay.

Screenshots are saved under docs/screenshots/learning-games-*. The final guide fix is shown in learning-games-flight-guide-320-largest-bottom.png; earlier 360px guide images precede that decorative-only fix.

The emulator required a restart to recover input focus. Another QA app occasionally took foreground focus; the game-only app was explicitly reopened for checks. The temporary game package was removed, and display size, density, and font scale were restored to 1080x1920, 420dpi, and 1.0. No accessibility settings were changed.

A complete spoken TalkBack audit, iOS run, and physical-device performance check remain unverified. Automated tests cover all Flight topics/modes; native flow checks sampled Needs vs Wants in manual and automatic modes.

## Reproduce the isolated preview

Use JDK 17 and run from android:

    ./gradlew.bat --offline -I ../scripts/flight-polish-qa.gradle :app:assembleDebug -PreactNativeArchitectures=x86_64

The QA init script now has an independent app build directory to avoid collisions with other preview builds. The APK is at android/build/learning-games-app/outputs/apk/debug/app-debug.apk. Verify output-metadata.json identifies com.ipongoal.flightpolishqa before installing. This APK is for QA only; normal app builds retain their existing configuration.
