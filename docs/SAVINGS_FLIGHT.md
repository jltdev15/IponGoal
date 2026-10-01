# Savings Flight

An offline practice activity with four levels and two control modes. Every flight has five financial decisions and three expense-card sections before each decision. Manual flights use three hearts, forgiving collisions, small fictional windfalls, and checkpoints. Assisted flights navigate automatically and use untimed answer buttons without coins or an arcade score.

## Release gate

`src/config/appConfig.ts` keeps `ENABLE_SAVINGS_FLIGHT` false. Home exposes Learning Games for all four introductory games. Games hides Savings Flight controls, and a direct SavingsFlight route displays an unavailable screen. The regular app entry is `index.js`.

Do not enable this flag until all of these have recorded passing QA:

- Needs or Wants
- Budget Challenge
- Save or Spend
- Goal Builder
- Savings Flight native acceptance checks below

All four introductory games are implemented. Remaining accessibility/usability QA and Savings Flight acceptance checks must still be documented and completed. Savings Flight does not unlock automatically based on gameplay or user data.

## Architecture and money

`src/games/savingsFlight/` separates the pure engine, fixed-step physics, configuration, authored scenarios, native screen, results, and lightweight SVG/view components. Rendering uses Animated values for frame movement; React updates on events. Paused, reading, and feedback states stop the frame loop. Ordinary sections reuse one obstacle pair and one coin.

All financial amounts are integer centavos. New-allowance spending does not subtract existing savings; only the explicitly labeled essential repair uses existing practice savings. Emergency reserves are recorded separately from goal savings and spending. Budget Flight starts with ₱300 and has no collectible coins. Unaffordable budget choices move no money and explain the shortfall. Affordable needs remain thoughtful even after an earlier budget mistake.

Every answer has explicit money effects and contextual feedback. Both saving and enjoying an affordable planned treat can be thoughtful. Gate positions alternate. Financial choices do not award arcade points. Goal completion never truncates the five decisions.

The game never reads or writes the real goal/savings stores or database. Results and checkpoints are session memory only. Restart and process termination discard the session. A collision rolls back post-checkpoint arcade and coin rewards; answered choices, checkpoint savings, and remaining lives are preserved correctly.

## Isolated Android QA app

The QA entry is `scripts/savings-flight-qa-entry.js`, with the Gradle override in `scripts/savings-flight-qa.gradle`. It enables the feature only in the QA process and registers a standalone navigator without auth or database access. Its application ID is `com.ipongoal.flightqa`, distinct from the real app. It is never imported by the regular entry.

From `android/`, with JDK 17 configured:

```sh
./gradlew :app:assembleRelease -PreactNativeArchitectures=arm64-v8a --offline -I ../scripts/savings-flight-qa.gradle
adb -s emulator-5554 install -r app/build/outputs/apk/release/app-release.apk
adb -s emulator-5554 shell am start -n com.ipongoal.flightqa/com.ipongoal.MainActivity
```

The QA APK uses the existing development signing key. Do not distribute it as the real application. This build writes the normal variant output location, so rebuild without the init script before taking a regular APK from that directory:

```sh
./gradlew :app:assembleDebug -PreactNativeArchitectures=arm64-v8a --offline
```

## Verification

Automated checks cover every authored option, budget limits and shortfalls, reserve accounting, frame-rate independence, collision bounds, gate/button equivalence, checkpoint/reward rollback, three-life game over, untimed decisions, pause, restart, route guards, background/blur handling, viewport changes, callback cleanup, and assisted completion. A SQLite-backed regression compares real goals, savings, users, settings, and statistics before and after repeated complete and interrupted flights.

Native acceptance checklist:

- Complete all four assisted levels with buttons; check balances, reserves, budget shortfalls, and learning summaries.
- Complete manual flight; compare gate and button answers, coin collection, collisions, safe recovery, and partial results.
- Pause while flying and while choosing; background and return; rotate/resize; restart and exit.
- Verify an offline bundled release build, with no Metro dependency or remote assets.
- Inspect 360-dp small screens and large font settings. Scroll all scenario, feedback, HUD, and result content without clipped essential controls.
- Use TalkBack to select assisted mode, hear scenarios and feedback, answer all five decisions, and reach results. The decorative scene must not receive focus in assisted mode or behind an overlay.
- Profile manual play on a representative average physical Android device. Aim for 60 FPS; do not treat emulator timing as physical-device evidence.
- Verify the regular Games menu offers all four introductory games while hiding Savings Flight and rejecting direct flight access with the default flag.

See the validation record in `docs/QA.md`. Unverified acceptance items remain release blockers.
