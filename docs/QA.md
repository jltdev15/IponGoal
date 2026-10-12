# QA record

## Automated verification

- Strict TypeScript: passed.
- ESLint: passed, no errors or warnings.
- Jest: 30 tests passed in two suites. Production SQL is exercised against actual SQLite using Node 24; native JSI compatibility is checked separately through the Android build/emulator.
- Native debug build: passed; final branded ARM debug/release builds passed; results are recorded in `build-final.log`.

Covered: valid registration, duplicate/case-insensitive username, mismatched/short passwords, valid/invalid login, session flags and logout, goal CRUD, empty/cascading deletion, archive/restore, savings CRUD, over-target balances, completion and demotion after update/delete/target edits, inclusive history filtering, deterministic statistics, profile changes, reset, empty database, decimal/large/invalid amounts, multiple goals/accounts and ownership protections, missing records, date/leap/week helpers, schema migration constraints, immediate duplicate-submit protection, and redaction of database errors.

## Native emulator checks

Tests use an isolated emulator account on Android API 35 (API 37 was also used for the initial startup/layout check), with Wi-Fi and mobile data disabled and airplane-mode setting enabled. No production seed account is created by the app. Screenshots are in `screenshots/`. Native smoke results are updated below as performed.

| Check | Result |
| --- | --- |
| Bundled debug APK opens without Metro or connectivity | Passed |
| Release APK manifest has no INTERNET permission | Passed (aapt) |
| Welcome at 360×800 dp | Passed |
| Scrollable registration form at 360×800 dp | Passed |
| Native offline registration and login | Passed (API 35) |
| Create a goal, save ₱100.25, complete goal | Passed |
| History and statistics show matching ₱100.25 totals | Passed |
| Delete savings entry reopens completed goal | Passed |
| Save ₱25.50: 25% displayed, ₱74.75 remaining | Passed |
| Archive/restore preserves ₱25.50 history and balance | Passed |
| Remember Me, force-stop/reopen, APK reinstall persistence | Passed |
| Active Home at 360×800, 390×844, 412×915 dp | Passed |
| Logout opens Login directly; login retains savings | Passed |
| Two-step reset removes data and returns to Welcome | Passed |
| Final API 35 ReactNativeJS/AndroidRuntime error log | Empty |

## Reproducible full manual checklist

1. Fresh install: Welcome → Get Started → Register. Reject blank name, short username/password, mismatched passwords. Valid registration opens empty Home.
2. Logout; reject wrong credentials. Login correctly; verify goals persist. Repeat registration with duplicate username and reject it.
3. Login without Remember Me, force-stop/reopen: Login. Login with Remember Me, force-stop/reopen: Home. Logout clears remember preference, preserves records.
4. Create Phone target ₱15,000 and starting ₱4,500. Verify 30%, ₱10,500 remaining, one starting transaction. Edit name/date/category/target. Create zero/negative/invalid targets and reject them.
5. Create with starting amount equal to or over target: immediately completed, real amount preserved. No zero transaction inserted for starting 0.
6. Add ₱100.25; verify 4,600.25 balance. Double-tap Save rapidly: exactly one entry. Check keyboard and form scroll.
7. Reach/exceed target; choose Keep Saving, then Mark as Completed from details. Check completed collection and completion date.
8. Edit/delete a completed goal's savings so total is below target: becomes active and completion date clears. Raise target above balance: also reopens.
9. History: All, By Goal, This Week, This Month, custom date range. Check inclusivity, filtered totals, sorting/grouping, missing/invalid ranges and empty view.
10. Statistics: compare total/week/month/average/count/goals against records, month buckets including a fifth week, and future-dated entry exclusion from current periods.
11. Archive; verify history and totals remain, active/completed counts exclude it. Restore; status reflects balance. Try adding to archive: require restoration.
12. Delete empty goal; delete goal with transactions after warning; cancelling preserves records. Delete entry confirmation adjusts totals.
13. Edit profile; username stays stable. Completed/archived/About/PHP labels work. Back navigation does not expose another account.
14. Register a second account, confirm first account's financial records are invisible. Log back into first account and recover its records.
15. Two-step reset: cancel each step, then confirm. All device accounts, goals, savings, and session disappear; Welcome returns and registration still works.
16. Repeat core workflow with airplane mode, Wi-Fi off, data off, Metro stopped. Force-stop/reopen after saving to verify persistence.
17. Repeat primary screens at 360×800, 390×844, 412×915 dp. Check long names, decimal/large values, keyboard, Android Back, larger font size, and TalkBack.
18. Optional physical-device QA: low-end API 24+ phone, portrait/landscape, repeated open/close, background/foreground, interrupted form entry, and reinstall behavior.

Remaining physical-device/TalkBack checks should be performed before classroom research deployment. The generated iOS scaffold is not covered.

The API 37 emulator initially used software rendering and became unresponsive during native release compilation with host memory pressure; this appears to be an emulator/host resource issue. Final smoke testing was repeated with hardware rendering on API 35 after compilation. No app crashes occurred in the final API 35 smoke flow.

## Development launcher update

`npm start` now offers an emulator picker before Metro. Verified installed AVD discovery, running-device labels, invalid-number retry, Metro-only choice, forwarded `--port 8088`, normal Metro r/d/j keys, Ctrl+C cleanup, missing-name feedback, and ESLint/syntax checks. No runtime app or APK changes were needed.

`npm run android` now discovers JDK 17 and supplies it to the React Native CLI/Gradle subprocess. Verified discovery with `JAVA_HOME` explicitly pointing to the installed JDK 26, CLI flag forwarding, syntax, and ESLint. Ran `npm run android -- --no-packager --extra-params=-PreactNativeArchitectures=arm64-v8a`: Gradle completed successfully in 59 seconds, installed on Pixel_10_Pro_XL (API 37), and launched MainActivity. This resolves the reported Java 26 `JdkImageTransform` failure. Windows/Linux discovery is implemented but not verified on those operating systems.

## Savings Flight — 2026-10-01

Implemented all four five-decision levels, manual and assisted modes, fictional centavo accounting, independent arcade results, checkpoint recovery, untimed decisions/feedback, and guarded navigation. Production `ENABLE_SAVINGS_FLIGHT` remains **false**. The prerequisite games are not yet implemented; this feature is not released.

- `npm run check`: passed TypeScript, ESLint, and **67 tests in six suites**, including 27 added game/integration cases.
- Engine verification: all 40 authored answer outcomes, responsible spending and planned wants, separate reserves, budget shortfalls, fixed-step frame-rate equivalence, manual obstacle/coin accounting, gate/button equivalence, neutral-space gate waiting, checkpoint rollback, pause/terminal states, and completing all decisions even after reaching a practice target.
- Screen verification: disabled/direct route guards, background/blur pause, restart/exit, viewport versus internal scene resizing, unmount cleanup, assisted completion, and removing the decorative scene while decision overlays are shown.
- SQLite regression: real goals, transactions, users, settings, and computed statistics match before and after repeated completed and interrupted flights.
- Android arm64 debug and release builds: successful using JDK 17 and the local offline Gradle cache. Separate QA release entry/package also builds successfully. The regular release manifest has no INTERNET permission; existing development signing remains in use.
- Native offline QA: completed Needs vs Wants in the isolated release app without Metro. All five buttons produced Smart Choice feedback; result showed 5/5 thoughtful decisions, practice savings ₱800 → ₱950, practice spending ₱330, zero coins, and arcade score Not applicable.
- Small-screen QA: 360-dp viewport with 150% system text. Setup and answer controls remain reachable by scrolling. Selecting the second answer updated practice savings correctly, feedback reset to the top, and the decorative scene was excluded from the native accessibility tree. Native screenshots are under `docs/screenshots/savings-flight-*`.
- TalkBack smoke check: enabled the installed service and inspected native labeled mode controls. This does **not** constitute a complete TalkBack flight or spoken-output audit. Original emulator accessibility, font, and screen settings were restored afterward.

Remaining release blockers: all four introductory games and their QA; complete native manual/gate/collision testing and the other three levels; a complete TalkBack assisted flight; and representative physical Android performance/usability testing. Unit tests and emulator checks do not certify 60 FPS on student devices. See `docs/SAVINGS_FLIGHT.md` for the isolated QA harness and acceptance checklist.

## Needs or Wants — 2026-10-01

Needs or Wants is available through **Home → Learning Games → Play Needs or Wants**. Savings Flight controls remain hidden and its direct route remains guarded by the default false flag. Budget Challenge, Save or Spend, and Goal Builder are still pending.

- `npm run check`: passed TypeScript, ESLint, and **82 tests in seven suites**. Fifteen new cases cover balanced five-situation rounds, every scenario’s correct and incorrect classification, contextual needs/wants, repeated-tap protection, completion/replay/exit, and the available Games entry with Savings Flight disabled.
- The SQLite-backed learning-game regression now covers repeated completed and interrupted Needs or Wants sessions as well as Savings Flight. Real goals, savings, users, settings, and statistics remain unchanged.
- Regular Android arm64 debug and release builds passed with JDK 17 and the offline Gradle cache. The regular release has no INTERNET permission. No new native dependencies or schema changes were added.
- Native offline QA in the isolated `com.ipongoal.learningqa` release app completed five situations with correct classifications and feedback, displayed a 5/5 learning summary with answer review, and reset to instructions on Play Again.
- At 360 dp and 150% system text, answer, feedback, and Next Situation controls remained reachable by scrolling. An intentionally incorrect answer displayed supportive feedback and advanced normally. Screenshots are under `docs/screenshots/needs-wants-*`.
- Scroll positions reset between questions, feedback, results, and replay. Accessible button labels, headings, and scenario/feedback announcements are implemented; a full spoken-output TalkBack usability review with students remains unverified.
- Temporary font/screen settings were restored after the native check; the isolated QA package was removed. The production savings tracker database was not opened by the QA harness.

The introductory game is implemented and passes automated and emulator checks. These checks do not establish research effectiveness or replace representative student usability testing. Savings Flight remains gated until the other introductory games and its remaining acceptance checks are complete.

## Budget Challenge — 2026-10-01

Available through **Home → Learning Games → Play Budget Challenge**. Five untimed choices allocate a fictional ₱300 school-day allowance across transport, lunch, school materials, optional snacks, and savings. This is a planning exercise: overbudget choices display a shortfall rather than inventing available money. No real transactions, goals, or balances are accessed. Save or Spend and Goal Builder remain pending; Savings Flight stays disabled.

- `npm run check`: TypeScript, ESLint, and **87 tests in eight suites** pass. New coverage checks all 243 option combinations, integer-centavo conservation, affordable planned wants, alternative saving plans, unmet essentials, overspending, rapid-tap protection, completion, replay, restart, and exit.
- The SQLite regression includes completed, repeated, and interrupted Budget Challenge sessions. Goals, savings records, users, settings, and computed statistics remain unchanged.
- Regular Android arm64 debug and release builds pass using JDK 17 and offline Gradle. Release package remains `com.ipongoal`, with no INTERNET permission. No new dependencies or migrations.
- Isolated offline release QA (`com.ipongoal.learningqa`, no auth/database imports): completed the balanced plan with ₱240 spending, ₱60 planned/affordable savings, all three essential needs funded, and zero unallocated money. A premium-choice plan correctly reported a ₱170 shortfall and zero affordable savings; skipping transport correctly reported an unfunded transportation need. Replay and Back to Games worked.
- At 360 dp and 150% system text, all answer/feedback/advance/restart/exit controls were reachable by scrolling. Background/return preserved the first untimed choice. Question and feedback scroll positions reset on advance. Emulator font/screen settings were restored and the isolated QA package removed; the updated regular debug app was installed without resetting its data.
- Screenshots of question, contextual feedback, and budget review are under `docs/screenshots/budget-*`.

Accessible buttons, headings, scrollable content, and question/feedback announcements are implemented. Full spoken TalkBack and representative student-device usability checks remain unverified; these checks do not establish educational effectiveness. The Savings Flight release gate still requires the remaining introductory games and documented acceptance checks.

## Save or Spend — 2026-10-01

Available through **Home → Learning Games → Play Save or Spend**. Five untimed independent examples cover extra allowance, splitting new allowance between lunch and savings, delaying optional entertainment for a goal, paying an essential repair from existing practice savings, and an affordable planned treat. Both saving and spending are thoughtful in the final situation. Each example states its source of money and starting savings; example balances are not combined into a wallet.

- `npm run check`: TypeScript, ESLint, and **96 tests in nine suites** pass. Coverage includes all ten answer outcomes, all 32 full rounds, integer-centavo conservation, new-allowance versus existing-savings spending, responsible spending, affordable wants, rapid/invalid action protection, completion after reaching an example goal, review, replay, restart, and exit.
- The SQLite regression now includes repeated completed and interrupted Save or Spend sessions. Real goals, transactions, users, settings, and calculated statistics remain unchanged. No dependencies, migrations, persistent rewards, or real account access were added.
- Isolated offline Android release QA completed five thoughtful choices and a 5/5 summary with explanations and balance review. The essential repair correctly reduced practice savings from ₱500 to ₱400. The mixed lunch/savings choice and planned treat completed normally. Replay returned to instructions and exit returned to Games. Screenshots are under `docs/screenshots/save-spend-*`.
- Final regular Android arm64 debug and release builds passed offline with JDK 17. The release package remains `com.ipongoal` and has no INTERNET permission. The updated regular debug app is installed without resetting its data.
- At 360 dp and 150% text, the second answer, balance feedback, Next Situation, restart, and exit controls were reachable by scrolling. Background/return preserved the first example; exiting mid-round and reopening returned to instructions. Temporary emulator font/screen settings were restored, and the isolated QA package was removed.
- Save or Spend exits by popping to Games, removing its route so reopening starts a fresh session. Backgrounding preserves the current untimed example; leaving or restarting discards it.

Goal Builder remains pending and Savings Flight remains disabled. Accessible button labels, headings, scrolling, and question/feedback announcements are implemented. Full spoken TalkBack, representative physical-device/student usability, and educational effectiveness remain unverified; they are not established by unit tests or emulator QA.

## Goal Builder — 2026-10-01

Available through **Home → Learning Games → Play Goal Builder**. Students choose one of three fictional goals, select a target price, and plan a weekly contribution from an invented ₱300 allowance. Regular essentials of ₱200 and a separate reserve of ₱40 leave ₱60 available. A proposed ₱100 contribution is explicitly unaffordable and cannot proceed. Three untimed practice weeks explore required materials, a necessary repair from existing goal savings, and an optional treat; both treat choices are reasonable.

- `npm run check`: TypeScript, ESLint, and **102 tests in ten suites** pass. Coverage includes all 144 goal/price/affordable-contribution/answer combinations, per-week and whole-session money conservation, timeline rounding, zero contributions and completed forecasts, setup changes, oversaving rejection, one-time answer resolution, rapid-action protection, three-week completion, review, replay, restart, and exit.
- SQLite regression includes completed, repeated, and interrupted Goal Builder sessions. Real goals, transactions, users, settings, and statistics stay unchanged. No database/store imports, dependencies, migrations, persistent goals, rewards, or results were added.
- Every new-allowance contribution, existing-savings expense, reserve allocation, and unallocated amount is accounted for in integer centavos. Reserve allocations and unallocated money are excluded from goal progress. Results flag unfunded essential event needs rather than treating a larger balance as success.
- Regular Android arm64 debug and release builds pass offline with JDK 17. The release remains `com.ipongoal` with no INTERNET permission. No new native dependencies or schema changes.
- Isolated offline native QA (`com.ipongoal.learningqa`, no account/database imports): blocked the ₱100 weekly plan, completed all three weeks for a ₱300 book goal at ₱60 usual saving, and displayed ₱140 goal savings, ₱740 spending, ₱120 separate reserve allocations, zero unallocated money, and a three-more-week estimate. Alternate bicycle/target selection, replay, mid-plan exit, and fresh reopening passed. Screenshots are under `docs/screenshots/goal-builder-*`.
- At 360 dp and 150% system text, goal/price setup, the second event answer, feedback, advance, restart, and exit were reachable by scrolling. Background/return preserved the first untimed week. Temporary font/screen settings were restored and the isolated QA package removed; the updated regular debug app is installed without resetting its data.
- Forecasts round up to whole future weeks and assume the usual contribution resumes, with no additional income or withdrawals. They are estimates, not deadlines or promises. Exiting pops to Games and removes the route; restarting clears selections, answers, and simulated money.

All four introductory games are implemented, but their remaining full spoken TalkBack and representative student-device usability QA is unverified. Savings Flight remains disabled pending that QA and its native/manual/performance acceptance checks. Tests and emulator checks do not establish educational effectiveness.


## Profile and Edit Profile — 2026-10-01

Profile now groups identity and editing, recorded savings, goal collections, read-only currency/app information, logout, and destructive device data controls. Total recorded savings retains the existing calculation across active, completed, and archived goals. Edit Profile groups the photo preview and labeled personal details, saves through the existing repository, and protects unsaved name, grade, and photo changes through React Navigation's removal guard. No routes, tabs, schema, dependencies, savings calculations, or learning games changed; Savings Flight remains disabled.

- `npm run check`: TypeScript, ESLint, and **110 tests in eleven suites** pass. Screen coverage includes empty/populated/archived savings, missing grade, long names, initials and failed-photo fallback, destination actions, both reset cancellations, logout, dirty drafts, Keep Editing/Discard Changes, accepted navigation after disabling the guard, save success/validation/repository failure, repeated saves, pending photo selection, cancellation, selection, removal, and failed-save draft preservation.
- Regular Android arm64 debug and release builds pass offline with JDK 17. Release remains `com.ipongoal` with no INTERNET permission.
- Native checks use `com.ipongoal.profileqa`, built from the isolated QA entry/init script. Two synthetic accounts with four goals and four savings records live in that package's private database. The normal application's database is not opened by the harness. Reset checks must use only this isolated package.
- Native navigation reached Completed Goals, Archived Goals, and About. The populated overview showed ₱350 including the archived goal. Header and Android back displayed the discard prompt; Keep Editing preserved the edited name, and Discard Changes returned to Profile. Screenshots are under `docs/screenshots/*profile*`.
- Saving an edited name updated the displayed Profile identity and returned without a discard warning. Emulator text injection can drop characters when key events arrive rapidly; assertions must use the actual displayed draft, not assume an injected string was fully entered.
- Native empty-name validation and photo-picker cancellation passed. Cancelling at either reset confirmation preserved the session. Accepting both confirmations left zero local accounts, goals, and savings records in the isolated package, proving reset affects every local account.
- At 360 dp and 150% text, the long identity stacks and wraps. Save Profile remains reachable by scrolling, and Keep Editing/Discard Changes also protect grade edits. Screenshots include the enlarged form, keyboard, and reachable Save action. Native text inputs consume their own drag gestures; automation scrolls from the outer content margin.
- The isolated fixture helper uses a precomputed hash for its synthetic password to avoid unrelated password-derivation delay. Production password handling is unchanged.
- Logout preserved both accounts, all four goals, and all four savings records in native QA.
- TalkBack was enabled with touch exploration active and focused the Profile heading (see `profile-talkback-start.png`). Injected swipe/keyboard input did not advance accessibility focus, and native computer control was unavailable because the Mac was locked. **Full focus traversal and spoken-output usability remain unverified and require manual QA on both screens.** A representative physical-device check also remains pending. Do not interpret the heading smoke check as a complete TalkBack pass.
- Emulator font scale, screen size, and accessibility settings were restored. The isolated QA package was removed. The rebuilt normal offline release was installed and launched with `install -r`, preserving its existing data; output metadata and manifest identify `com.ipongoal`, without INTERNET permission.


## Native authentication performance — 2026-10-01

Android registration and login now use an asynchronous Codegen TurboModule on a dedicated executor. API 26+ uses the platform PBKDF2-SHA256 provider; API 24–25 uses byte-compatible JCA HMAC-SHA256. Empty or non-UTF-8 byte test inputs also use native HMAC because the Android PBKDF2 factory rejects empty passwords and its character interface cannot represent arbitrary bytes. Neither path reduces the 210,000 production rounds, 16-byte random salt, 32-byte output, or existing hash format. No migration or password reset is required. The unverified iOS scaffold retains JavaScript derivation.

- Typecheck, lint, and **115 tests in thirteen suites** pass. Authentication screen tests cover pending-action field/navigation locks, repeated taps, failure preserving the draft, retry, and successful password clearing. Provider tests cover exact UTF-8 bytes, existing hash format, wrong passwords, missing/error/malformed native results, and the non-Android fallback.
- Three native unit tests compare both provider paths against 21 Node-generated vectors: rounds 1, 2, and 210,000 across ASCII, Unicode/emoji, embedded nulls, decomposed accents, 128-character passwords, empty passwords, and non-UTF-8 bytes; invalid inputs are rejected.
- Device validation runs in isolated `com.ipongoal.authqa`, using actual native hashing and real repositories/authentication stores. It does not open the normal app’s database. The helper measures derivation separately from a synthetic SQLite insert, registration/login calls, and the following two animation frames. Frame timings are scheduling measurements, not a guarantee of screen presentation time on every device.

Measured on the Pixel 10 Pro XL API 36 ARM64 emulator, isolated release package, with a fresh process and no concurrent host build:

| Measurement | Time |
| --- | --- |
| First 210,000-round derivation | 1,098 ms |
| Five subsequent derivations | 623–781 ms |
| Synthetic account SQLite insertion only | 10 ms |
| Existing-format account login | 869 ms |
| Real registration, including random salt and account/session save | 813 ms |
| Two following animation frames after registration | 106 ms |
| Real login, including verification and session save | 811 ms |
| Two following animation frames after login | 110 ms |

- All 21 vectors passed on Android. Wrong passwords and duplicate usernames were rejected; duplicate registration left the account count unchanged. Actual Create Account and Login form submissions both reached Home without the navigation lock obstructing successful authentication. Screenshots: `native-auth-registration-home.png` and `native-auth-login-home.png`.
- An earlier run while a host native build competed for resources took 3,683 ms for the first full derivation, 1,145 ms for registration, and 867 ms for login. The two-second target was met in the uncontended repeat, not guaranteed under resource contention or on other hardware.
- The 50-ms JavaScript heartbeat continued during native hashing (191 ticks); its largest gap was 441 ms across startup, tests, and screen transitions. This establishes that derivation no longer occupies the JavaScript thread, but does not establish uniformly smooth frame delivery.
- Final regular debug and release builds pass for both `arm64-v8a` and `armeabi-v7a`. The application CMake entry links the app's generated TurboModule provider; device tests verified that the module is actually available, beyond merely compiling its Kotlin class. Release metadata remains `com.ipongoal`, with no INTERNET permission. Existing development signing is retained.
- Native HMAC compatibility is covered on the host and through fallback vectors on API 36; an actual API 24–25 device/emulator has not been tested. Physical-phone performance and the iOS scaffold remain unverified.
- The isolated authentication QA package was removed after testing. The final normal release was installed and launched with `install -r`, without resetting its database. The distributed APK and checksum are updated under `artifacts/`.

## Savings Flight gameplay follow-up — 2026-10-01

The four introductory games are now implemented, but their remaining accessibility/usability acceptance checks still gate Savings Flight. Production `ENABLE_SAVINGS_FLIGHT` remains false.

- Fixed flight exit to pop to Games, removing the session route so reopening starts fresh while retaining the chosen control mode on Games.
- Corrected Budget Flight's optional snack feedback: being affordable alone is insufficient when the purchase crowds out planned savings. Earlier mistakes do not prevent affordable essential spending from being thoughtful. Feedback quantifies the remaining plan's shortfall using the existing peso formatter.
- The animation loop checks the current engine status, stops on reaching untimed reading/feedback, and avoids allocating snapshots each frame. Pause has a 48-dp target.
- Typecheck, lint, and **132 tests in thirteen suites** pass. Added coverage exercises every one of the 128 complete answer sequences, all 40 gate/button outcomes, manual completion of all four levels, ₱10/₱20/₱50 Goal Rush windfalls, rapid input, one-time answer resolution, paused gate navigation, stopped reading/feedback callbacks, route removal, and preserved partial learning/accounting results after exhausted hearts.
- The SQLite regression continues to verify unchanged real goals, savings, users, settings, and statistics after completed, interrupted, and repeated flights.
- Final regular debug/release builds pass offline for `arm64-v8a` and `armeabi-v7a`. The release remains `com.ipongoal`, development signed, without INTERNET permission. The separate `com.ipongoal.flightqa` bundled release enables the game only for isolated testing and imports no account/database stores.

Offline native assisted results on the API 36 emulator, with five thoughtful answers, no optional coins, and arcade score **Not applicable** in every level:

| Level | Final practice savings | Practice spending | Other balance |
| --- | --- | --- | --- |
| Needs vs Wants | ₱950 | ₱330 | — |
| Save or Spend | ₱1,550 | ₱150 | Planned treat chosen |
| Budget Flight | ₱860 | ₱240 | ₱0 daily budget remaining |
| Goal Rush | ₱3,300 | ₱150 | ₱50 separate emergency reserve |

All four results and exits passed using the actual native screen and untimed answer buttons. Reopening from Games started a fresh flight; the selected mode stayed on Games. Native manual no-input collisions used all three hearts, showed a supportive zero-decision partial result, and passed Play Again and Back to Games. Native evidence is under `docs/screenshots/flight-acceptance-*`.

- At 360 dp and 150% text, the native release passed background/return pause, Resume, live viewport-resize pause, second-answer selection, quantified ₱70 budget-shortfall feedback, scrollable Continue, Restart, and exit. Screenshots are `flight-small-background-pause.png`, `flight-small-reading-acceptance.png`, and `flight-small-shortfall-feedback.png`. Original 1344×2992 size, 480 density, and 1.0 font scale were restored.
- Full native manual steering/gate/coin completion, a complete spoken TalkBack assisted flight and introductory-game audit, and representative physical-device performance/usability remain unverified release blockers. Manual engine simulation and emulator life-exhaustion checks are not a substitute for those checks. Savings Flight stays disabled.
- The isolated flight QA package was removed. The rebuilt normal release and checksum were updated under `artifacts/`, installed with `install -r`, and launched without resetting real accounts or savings.

## Savings Flight release enablement — 2026-10-02

The user confirmed full manual-play QA was complete, including flight controls, gates, coins, and checkpoint recovery. After the remaining TalkBack assisted-flight, physical-phone performance, and prerequisite-game acceptance checks were described, the user confirmed **“all already done.”** On that basis, Savings Flight is enabled in the normal application configuration.

This records user-reported acceptance. No physical-phone model, Android version, frame timings, or spoken-output transcript was provided; the agent has not independently repeated those external checks. Earlier pending-check entries are historical records, superseded by this acceptance confirmation.

Home → Learning Games now exposes manual/assisted controls and all four Savings Flight levels. The disabled-flag direct-route/menu guard remains supported and tested. No account, savings, schema, or security changes accompany enablement.

Enablement validation: typecheck, lint, and **133 tests in thirteen suites** pass, including enabled manual/assisted routes for every level and the disabled-flag guard. Normal Android debug/release builds pass for ARM32 and ARM64. The updated normal release was installed with `install -r`, preserving its existing database; the APK and SHA-256 metadata are updated in `artifacts/`.

Normal-release native smoke check: opened Assisted flight → Goal Rush from the real Games menu, verified the fictional phone goal setup, and returned to Games. Screenshot: `docs/screenshots/flight-enabled-normal-release.png`. The check did not create or change financial records.

## Learning-game controls and selection sounds — 2026-10-11

Budget Challenge, Save or Spend and Goal Builder now use large colored choice cards, untimed progress, explicit next/review actions and direct replay. Needs or Wants retains its redesigned cards and gains the shared Sound control. Goal Builder's weekly amounts expose radio checked state and cannot begin an unaffordable plan. Flight answer buttons use the shared cards, and answer gates/buttons emit one option-specific sound event.

Four original 0.36-second PCM chimes identify option positions, rather than correctness. Repeated/stale/invalid quiz callbacks are silent; mute persists across games, and screen/app exit stops sounds. Android preview logs confirmed successful SoundPool playback of all four choice IDs. Physical-phone hearing checks for these new tones remain pending because the phone was disconnected. iOS resources and playback paths were updated; iOS compilation was not available on Windows.

Validation: 127 game/audio tests passed across 14 suites; the separate real-savings isolation test passed (30 unrelated tests skipped), bringing relevant Jest coverage to 128 passing tests. After the final layout adjustment, all 25 affected game/audio tests passed again. Typecheck and targeted source/test lint passed; the audio generator retains its existing seeded-noise bitwise lint warning. The Android native bridge unit test and normal/isolated release builds passed.

Native screenshots cover Budget Challenge introduction, all three visible answers, feedback, and 1.6x text at 390 dp; Save or Spend answer cards; and Goal Builder's selected fourth amount and unaffordable-plan feedback. Flight event/answer-card behavior was covered by automated regression tests. The isolated QA package never opened the real account database. The dedicated emulator was closed with its original font scale restored.

The normal APK package, ARM32/ARM64 libraries, existing signing certificate, final game bundle, and uncompressed bytes of all four choice WAVs were verified. Final normal APK SHA-256: `f1ebc3a3dadacefd459cafe2b005f02d8b843bd5e9a47a26198ac62436b1ce3c`. Download: `artifacts/PiggyPath-release.apk`; installation on the physical phone was not performed during this update.
