# Primary screen consistency — 2026-10-07

Home, History, Statistics, and Profile share a compact in-page header, a 480dp
content limit, 20dp side padding (16dp below 380dp), top safe-area inset + 16dp,
and floating-tab clearance + 24dp at the bottom. Shared white cards use 20dp
corners and 16dp padding. The shared navy savings summary retains exact totals
and stacks for narrow screens, enlarged text, or long amounts.

Home retains its greeting, avatar, completed-goals shortcut, learning games,
virtualized goals, and saving tip. History retains its existing filters, date
validation, ordering, virtualized entries, and detail navigation. Statistics
retains all six metrics and monthly chart; its header and zero summary remain
visible when empty. Profile retains its identity, editing, collections, app
information, action-specific feedback, and both reset confirmations.

## Automated checks

- TypeScript and targeted ESLint pass.
- Home, Profile, primary screens, bottom navigation, and domain suites passed
  79 tests. One additional focused regression then passed, for 80 distinct
  checks across these suites.
- The primary-screen suite has 14 passing cases covering History period/goal
  filters, changing route parameters, date validation and inclusive bounds,
  empty results, totals, entry/profile navigation, Statistics metrics/buckets,
  empty Statistics, large-history virtualization, secondary-row compatibility,
  and all four screens at 320/390/412dp with 100%/180% text.
- Domain setup needs an increased Jest timeout on this machine under Android
  build load; it passes with `--testTimeout=60000`.
- The isolated x86_64 debug Android build passes with cached dependencies and
  JDK 17. Its application ID is `com.ipongoal.primaryqa`.

## Reproducing the native preview

Build from `android/`, with JDK 17 configured:

```powershell
.\gradlew.bat :app:assembleDebug -PreactNativeArchitectures=x86_64 --offline -I ../scripts/primary-screens-qa.gradle
```

Verify `app/build-primary-screens-qa/outputs/apk/debug/output-metadata.json`
identifies `com.ipongoal.primaryqa` before installation. This is a synthetic
QA app and must never be distributed as the normal app. The init script uses
separate app and native build folders and reuses the existing Home fixtures.
Preserve a copy of the APK outside build folders before starting another
Gradle variant; Gradle can clean old variant outputs.

Run a separate emulator on port 5556, install the verified APK there, and run
`node scripts/primary-screens-qa.cjs` from the repository root. The runner is
restricted to that emulator and QA package. It captures populated screens at
320/390/412dp and 100%/180% text, then empty and long-content cases at
320dp/180%. It checks final-content reachability and restores the original
display settings in a `finally` block. Screenshots use the `primary-` prefix.

On this machine, runtime display resizing stalls Android System UI. The
verified alternative is to configure the dedicated AVD's `hw.lcd.density`
to 480 while stopped, boot with `-skin WIDTHx2532`, wait for
`sys.boot_completed=1`, and run the fixed-width mode:

| Width | Framebuffer | Capture command |
| --- | --- | --- |
| 320dp | 960x2532 | `node scripts/primary-screens-qa.cjs 320` |
| 390dp | 1170x2532 | `node scripts/primary-screens-qa.cjs 390` |
| 412dp | 1236x2532 | `node scripts/primary-screens-qa.cjs 412` |

This mode checks the configured size/density, changes only text scale, and
restores that scale after the run. It retries transient accessibility-tree
failures and can dismiss the dedicated emulator's System UI error dialog.
The normal emulator and its display settings are left unchanged.

An optional tab name limits a follow-up check, for example
`node scripts/primary-screens-qa.cjs 412 Home`.

## Native results

The isolated Android preview passed 30 scenarios: all four tabs at
320/390/412dp with 100%/180% text, plus empty History/Statistics and long
content on all four tabs at 320dp/180%. Each scenario has top and scrolled
screenshots. The final populated content and actions clear the floating tab
bar; the long Home fixture checks its first long goal action while retaining
the virtualized 30-goal list.

Side-by-side inspection confirms aligned header positions and content edges,
consistent navy summaries and white cards, wrapping names and large amounts,
and reachable final controls. A collapsed Home section heading found during
inspection was corrected by removing its row flex when stacked. All six
width/text combinations cover that regression; the final Home and primary
screen suites pass 34 tests, and TypeScript and targeted ESLint pass.

Comparison images include `screenshots/primary-412-normal-top-overview.png`,
the corresponding large-text and bottom views, and the 320/390dp overviews.
Native logs are in `artifacts/primary-screens-native-*.log`.

Verification used an Android emulator with synthetic records. iOS, physical
devices, and spoken TalkBack navigation were not exercised.
