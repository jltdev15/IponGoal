# PiggyPath

An Android-first, fully offline goal-based savings tracker for students. Set a goal, save little by little, track progress, and build awareness of saving habits. This is an academic research prototype intended to support financial literacy; no claim of scientifically proven improvement is made.

## Features

- Local registration, login, multiple independent accounts, optional Remember Me, and logout.
- Salted PBKDF2-SHA256 passwords; raw passwords are never persisted or logged.
- Create and edit goals, starting savings, optional dates, categories and icons.
- Record, edit, and delete savings with exact centavo calculations.
- Goal progress, over-target balances, completion, archive, restore, and deletion warnings.
- History by goal, week, month, or inclusive date range; filtered totals.
- Statistics, a lightweight local weekly bar chart, and deterministic insights.
- Editable local profiles, completed goals, archived goals, educational tips, About, and two-step device-wide reset.
- No backend, Expo, cloud login, tracking, ads, API calls, or remote assets.

## Stack and dependencies

| Dependency | Purpose |
| --- | --- |
| React Native CLI 0.84.1 / React 19.2 | Bare native Android application; Hermes engine |
| TypeScript | Strict typing |
| React Navigation native-stack and bottom-tabs | Auth, four main tabs, and detail/form screens |
| react-native-screens / safe-area-context | Native navigation and safe screen insets |
| Zustand | Session and SQLite-backed list caches |
| @op-engineering/op-sqlite | Embedded SQLite, native Android support, synchronous short local transactions |
| @noble/hashes 1.8 | React Native compatible asynchronous PBKDF2 hashing |
| react-native-get-random-values | Native cryptographically secure salts and IDs |
| lucide-react-native / react-native-svg | Consistent locally bundled SVG icons |

The chart uses ordinary React Native views; no chart package is needed. Library compatibility was checked against the [React Native setup guide](https://reactnative.dev/docs/set-up-your-environment), [React Navigation docs](https://reactnavigation.org/docs/getting-started/), [OP-SQLite installation](https://op-engineering.github.io/op-sqlite/docs/installation/), [Noble README](https://github.com/paulmillr/noble-hashes), [random-values README](https://github.com/LinusU/react-native-get-random-values), and [Lucide Native guide](https://lucide.dev/guide/react-native).

## Requirements

- macOS, Windows, or Linux with Node **22.11+**. Node 24 is recommended and required for this project's SQLite-backed Jest tests.
- npm; dependencies are pinned in `package-lock.json`.
- **JDK 17**. `npm run android` discovers and selects an installed JDK 17, even when your terminal defaults to a newer Java. For direct Gradle commands or Android Studio, select JDK 17 yourself.
- Android SDK platform **36**, Build Tools **36.0.0**, NDK **27.1.12297006**, CMake **3.30.5**, SDK platform-tools, and an emulator system image. Android Studio is optional.
- Android **7.0 / API 24** or newer on the target phone.
- Internet is needed to install/build dependencies initially, never for normal app use.

The native project was initialized with:

```sh
npx @react-native-community/cli@20.2.0 init PiggyPath --version 0.84.1 --skip-install --skip-git-init
```

The project already exists: do not initialize over it.

## Install and run

```sh
cd PiggyPath
npm ci
npm run sync-config
```

Set `ANDROID_HOME` to your Android SDK and add its `platform-tools` and `emulator` directories to `PATH`. Set `JAVA_HOME` to your JDK 17 directory. On macOS:

```sh
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator"
```

Create `android/local.properties` with your own SDK path (`sdk.dir=/absolute/path/to/Android/sdk`); this machine-specific file is ignored by Git.

If an Android build fails at `androidJdkImage` / `JdkImageTransform` and the error mentions Java 26's `jlink`, rerun `npm run android`: the launcher selects JDK 17 automatically. Check the selected JDK with `npm run android -- --jdk-check`. It checks `JAVA_HOME`, macOS's Java registry, and common JDK installation directories. For a custom installation, set `JAVA_HOME` to JDK 17. CLI flags such as `--list-devices` and `--no-packager` still work.

### Android emulator

On Windows, install the SDK and create an Android 36 emulator without Android Studio:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/setup-android.ps1
# For a different JDK 17 location, append: -JavaHome 'C:\path\to\jdk-17'
```

The script downloads Google's command-line tools, verifies their checksum, accepts SDK licenses, installs the required packages under `%LOCALAPPDATA%\Android\Sdk`, and creates `IponGoal_API_36`. It sets user environment variables and writes the ignored `android/local.properties` file. Open a new terminal after setup. Hardware virtualization and Windows Hypervisor Platform must be available for accelerated emulation.

```powershell
npm run emulators
npm start -- --emulator=IponGoal_API_36
# In a second terminal, after the emulator boots:
npm run android
```

You can also create an Android emulator with avdmanager or Android Studio’s Device Manager. `npm start` now lists your installed emulators and lets you launch one before starting Metro. Select `0` to start Metro only. A running emulator is reused. Then:

```sh
npm start
# Choose an emulator from the numbered menu.
# After it boots, in a second terminal:
npm run android
```

Metro keeps its normal `r`, `d`, and `j` keys. The emulator continues running when Metro stops. The picker does not install the app; `npm run android` installs/opens it. If several devices are connected, use `npm run android -- --list-devices` to select the target.

`npm run android` uses `--active-arch-only` to build only the architecture of the connected device (x86_64 for `IponGoal_API_36`), reducing native compilation work. Boot the emulator before running it. Direct Gradle builds still use the configured architecture list, and `npm run android:release` still builds both ARM phone architectures.

```sh
npm run emulators
npm start -- --emulator=Pixel_10_Pro_XL
npm start -- --no-emulator
npm run start:metro
```

SDK discovery checks `ANDROID_HOME`, `ANDROID_SDK_ROOT`, `android/local.properties`, and the standard SDK location for macOS, Windows, or Linux. Noninteractive terminals start Metro without prompting. Metro flags such as `--reset-cache` still work: `npm start -- --reset-cache`.

### Physical Android phone

Enable Developer options and USB debugging. Connect by USB, authorize the computer, and confirm `adb devices` shows your phone. Run `npm run android`, or install the standalone APK:

```sh
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

There is no Expo command or setup.

## Delivered APKs

`artifacts/IponGoal-research.apk` is the 37 MB release-mode offline demo (ARM 32/64-bit). `artifacts/IponGoal-debug.apk` is the 77 MB debug demo. SHA-256 checksums are included. Both use a development signing key; use a personal release key before wider distribution. The research APK has no INTERNET permission.

## Offline APK

The debug variant deliberately bundles JavaScript and assets, so the demo APK can run without a Metro server. Developer networking permission exists only in the debug manifest. The release manifest does **not** request INTERNET. Debug builds can still connect to Metro for development when it is running; stop Metro when verifying the bundled APK.

```sh
npm run sync-config
cd android
./gradlew assembleDebug
```

Windows: use `gradlew.bat assembleDebug`. Output:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

For faster local ARM emulator builds, optionally use `-PreactNativeArchitectures=arm64-v8a`. The default build includes all configured ABIs. The delivered APKs were built with `-PreactNativeArchitectures=arm64-v8a,armeabi-v7a` for common Android phones.

### Release preparation

`./gradlew assembleRelease` bundles the application and creates `android/app/build/outputs/apk/release/app-release.apk`. The template currently signs release builds with the **development key** for research demonstrations only. Before distributing beyond testing: generate your own keystore, keep it outside the repository, configure release signing with environment/Gradle properties, increment `versionCode`, and rebuild. Do not publish an APK signed with the development key. Google Play publication is not required.

## Development commands

```sh
npm run typecheck
npm run lint
npm test -- --runInBand
npm run check
npm run format
npm run sync-config
```

Tests execute production migration/repository SQL using Node 24's SQLite engine. They test our SQL and domain rules; they do not replace native JSI/emulator tests. See [QA](docs/QA.md) for recorded results and manual cases.

## Configuration

Edit `src/config/appConfig.ts` to change the app name, version, subtitle, default PHP formatting, and defaults. Run `npm run sync-config` after changing name/version: it synchronizes Android and iOS launcher names, Android versionName, and app.json displayName. Keep the internal registered component name `PiggyPath` stable. Version 1 exposes PHP only; other currencies are future work.

Colors are centralized in `src/theme/colors.ts`. Android system fonts, generous spacing, 46–54 dp controls, text alongside progress bars, and scrollable keyboard-aware forms keep the interface readable on small phones.

## Data and offline architecture

SQLite is the only persistent source of truth. Zustand stores short-lived session state and cached query results. `app_settings` contains only preferences/session metadata. Remember Me persists a user ID and session flags; without it, a fresh process asks for login. Registration signs in for the current process without automatically remembering the account.

Passwords use 16 random salt bytes and 210,000 PBKDF2-SHA256 iterations. Android derives passwords in a background native TurboModule, using the platform PBKDF2 provider on API 26+ and a byte-compatible native HMAC implementation on API 24–25. Existing hashes remain compatible; Android does not silently fall back to JavaScript if the native module is missing. The unverified iOS scaffold retains the JavaScript provider. The hash is versioned and compared without an early exit on mismatched hash bytes. The local SQLite file is **not encrypted**; local accounts provide profile separation, not banking security or protection from rooted-device access. Backups are disabled in Android. No password recovery exists in version 1.

Amounts are **INTEGER centavos** (₱10.25 = 1025), including targets and transactions. Saved balances come from SUM(savings.amount), never a manually editable goal balance. A per-user aggregate limit of ₱1,000,000,000 keeps totals safely within exact integer arithmetic. Archived balances stay in totals/history; archive affects goal counts and visibility only.

Calendar saving dates are `YYYY-MM-DD` using local calendar days. Audit timestamps are UTC ISO strings. Week filters begin Monday; current-period statistics include today and exclude future entries. Future-dated records are allowed and remain visible in All history.

Starting savings and goal creation share a transaction. Foreign keys prevent cross-user goal references and cascade intentional goal deletion. SQL triggers reopen a completed goal when savings fall below its target or its target rises above its balance. Ordinary deposits reaching a target offer completion or continued saving.

## Folder structure

```text
src/
  components/      Reusable form, goal, list, progress, and chart UI
  config/          App name, version, currency configuration
  data/            Local categories and educational tips
  database/        Connection, versioned migrations, repositories
  navigation/      Root auth/main stacks and exactly four tabs
  screens/         Auth, goals, savings, history, statistics, profile
  services/        Password derivation, cache refresh, form lock
  stores/          Zustand session, goal, savings, settings caches
  theme/           Central colors and typography
  types/           Domain and navigation models
  utils/           Centavos, dates, IDs, validation, calculations
__tests__/         SQLite/domain and duplicate-tap tests
docs/              Architecture, schema, and QA
scripts/           Native configuration synchronization
android/           Gradle project and native Android entry points
```

See [Architecture](docs/ARCHITECTURE.md) and [Database schema](docs/DATABASE.md).

## Limitations

- Android is the verified target; the generated iOS scaffold has not been configured or tested.
- Local data has no export, backup, password recovery, encryption, or cross-device sync. Uninstall/reset erases records.
- Reset intentionally erases **all** accounts on the device after two confirmations.
- Date entry uses a labeled YYYY-MM-DD field rather than an additional native picker dependency.
- Unsaved form input is not restored after process termination.
- A plain view chart keeps dependencies low; it is not an interactive analytics dashboard.
- Averages are rounded to the nearest centavo.
- Emulator QA does not replace testing on representative physical student devices and with TalkBack.

## Potential future work (not implemented)

Local encrypted backup, JSON export/import, biometric unlock, reminders, multiple currencies, PIN login, dark mode, custom categories, accessibility preferences, optional cloud backup/synchronization, and a teacher/research dashboard.

This educational tracker records savings only. It does not hold money, connect to banks, or give investment, lending, or professional financial advice.

The app is now branded PiggyPath. Existing application IDs and the `ipon-goal.sqlite` database filename are retained to preserve installed-app updates and saved goals. The workspace folder and archived APKs, source ZIP, checksums, and build logs retain their original names; those artifacts predate the rename.

Profile photos: open Profile → Edit Profile → Choose Photo, select a device image, then Save Profile. Change Photo replaces it; Remove Photo takes effect on Save Profile. Pictures are resized and stored in the private offline database, survive restarts, and disappear when app data is reset or the app is uninstalled. No server upload or camera permission is required. The native photo-library integration uses [react-native-image-picker](https://github.com/react-native-image-picker/react-native-image-picker).

### Smaller Android phone APK

Run `npm run android:release` to create `artifacts/PiggyPath-release.apk` and its SHA-256 checksum. The release APK bundles the JavaScript for offline use, supports both 32-bit and 64-bit ARM Android phones, and enables R8 code/resource optimization. It excludes Intel emulator architectures. `npm run android` remains the development/emulator build. The release APK currently uses the existing development signing key; public store distribution requires a production signing setup.

### Savings Flight

Savings Flight adds four offline practice levels with native tap-to-fly controls, an assisted mode, untimed financial decisions, checkpoints, and learning summaries. All balances are fictional; no real savings records are read or changed. Open Home → Learning Games, select Manual or Assisted flight, and choose a level. The user confirmed the remaining acceptance checks passed; Savings Flight is enabled. See [Savings Flight architecture, QA harness, and release gate](docs/SAVINGS_FLIGHT.md).

### Needs or Wants

Open **Home → Learning Games → Play Needs or Wants**. Each untimed round draws five situations from ten authored examples, explains every answer, and ends with a review of your choices. A basic school notebook and an extra decorated notebook illustrate why context matters. Wants can be reasonable when needs and planned savings are covered. Practice answers are session memory only and never change real goals, savings, or statistics.

For isolated native QA, build from `android/` with `./gradlew :app:assembleRelease -PreactNativeArchitectures=arm64-v8a --offline -I ../scripts/learning-games-qa.gradle`. This uses the standalone `scripts/learning-games-qa-entry.js` navigator, the separate `com.ipongoal.learningqa` package, and the normal Savings Flight configuration. Rebuild without the init script before taking a regular APK from the variant output directory.

## Budget Challenge

Open **Home → Learning Games → Play Budget Challenge**. Plan a fictional ₱300 school-day allowance across five untimed choices: safe transportation, lunch, required materials, optional snacks, and savings. Feedback explains remaining priorities, unfunded needs, and overbudget plans. The review separates planned spending, planned savings, affordable savings, unallocated money, and shortfalls. An affordable treat can fit; saving is not a substitute for essentials.

`src/games/budgetChallenge/` contains the in-memory reducer, authored options, screen, and learning review. Amounts use integer centavos and the existing currency formatter. Nothing is persisted and no real balances are accessed. Restart or leaving the screen discards the plan. The isolated learning-games QA entry also registers this game.

## Save or Spend

Open **Home → Learning Games → Play Save or Spend**. Five untimed, separate fictional examples teach saving extra allowance, splitting allowance between a need and saving, delaying optional entertainment, paying an essential repair from existing practice savings, and enjoying an affordable planned want. Both choices in the planned-treat example are reasonable.

Each example labels its starting savings and new money. Feedback shows the exact savings and spending effects; results review choices and explanations without adding independent example balances together. `src/games/saveOrSpend/` separates scenarios, the in-memory session reducer, screen, and results. No real money or records are accessed, and no rewards or results are persisted. Restart or leaving discards the practice session.

## Goal Builder

Open **Home → Learning Games → Play Goal Builder**. Choose a fictional book collection, schoolbag, or bicycle, set one of two practice target prices, and plan weekly saving from a fictional ₱300 allowance. Regular essentials of ₱200 and a separate ₱40 reserve leave ₱60 for goal contributions or extras. A ₱100 weekly contribution is shown as unaffordable and cannot begin the simulation.

Three untimed practice weeks explore extra required school materials, an essential repair paid from existing goal savings, and an affordable optional treat. The review separates goal savings, spending, reserves, and unallocated money, and explains the updated whole-week estimate. Estimates assume steady future contributions without additional expenses or income; they are not deadlines or guarantees. `src/games/goalBuilder/` contains the authored examples, pure in-memory reducer, screen, and review. No real goals are created and no records or rewards are persisted. Exit removes the practice route; reopening starts fresh.

All four introductory games and Savings Flight are available. The user confirmed the remaining accessibility, manual-play, and physical-device acceptance checks passed; see docs/QA.md for the release record.

## Profile overview and editing

Profile groups your identity and Edit Profile action, total recorded savings (including archived goals), goal collections, read-only app information, logout, and device data. Reset all device data is clearly destructive and still requires both confirmations before erasing every local account and record.

Edit Profile groups the photo preview and personal details. Name, optional grade, and photo changes remain drafts until Save Profile. Going back with unsaved edits offers Keep Editing or Discard Changes; successful saving returns without a warning, while failed saving preserves the draft. Fields and actions are disabled during photo selection or saving. Long names and enlarged text wrap; compact screens stack identity and summary content.

For isolated Android profile QA, use `scripts/profile-qa-entry.js` and `scripts/profile-qa.gradle` to build `com.ipongoal.profileqa`. It creates synthetic fixtures in that package’s private database and exercises the real navigator/screens. Never run reset verification against the regular app’s data. Rebuild without the init script before distributing a normal APK.


## Authentication performance QA

Build the isolated `com.ipongoal.authqa` release using `scripts/auth-qa.gradle` and `scripts/auth-qa-entry.js`. It checks native PBKDF2 vectors against Node-generated expected results, verifies an existing hash, creates and logs into a synthetic account through the real repository/store, and reports derivation, SQLite fixture insert, authentication, and subsequent frame timings. Its database is private to that QA package; it never opens the regular app’s records. Rebuild without the init script before distributing a normal APK.

Run `:app:testDebugUnitTest` for native provider and API 24–25 fallback compatibility tests. Physical-device performance remains unverified until separately measured.
