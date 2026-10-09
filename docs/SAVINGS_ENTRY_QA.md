# Savings Entry redesign — 2026-10-07

The saved-record details screen now groups the exact amount, goal, saved date,
and note into two white cards. Recording metadata explains when the record was
added to the app. View Goal stays beside the goal details; Edit Entry and the
red Delete Entry action remain in a responsive bottom footer. Empty notes and
missing records retain clear placeholders. Long amounts can wrap at thousands
separators; the accessibility label retains the original formatted amount.

Production routes, models, repositories, and the Add/Edit Savings form are
unchanged. Existing unrelated workspace changes were preserved.

## Automated checks

- TypeScript and targeted ESLint pass.
- Nine Savings Entry screen tests pass: exact values, distinct date labels,
  blank notes, long content, navigation, confirmation cancel/dismiss, duplicate
  requests, disabled actions and progress during deletion, error announcement,
  retry, and missing records.
- Existing Savings Form tests (2) and domain tests (31) pass. Domain coverage
  includes reopening completed goals when deleting/editing drops their balance
  below the target. The final domain run uses `--testTimeout=120000` because its
  existing password-hashing setup exceeded shorter timeouts under build load.

## Native verification

The isolated `com.ipongoal.savingsentryqa` Android app uses synthetic records.
Screenshots at 320, 390, and 412 dp cover normal and 180% system text settings.
The content scrolls independently of the footer, keeping Edit Entry and Delete
Entry reachable. Long goal names, long notes, and the maximum supported amount
are exercised at 320 dp with enlarged text. Empty-note and missing-entry states
are captured separately.

Native checks confirm View Goal opens the associated goal, Edit Entry opens
the prefilled form, cancellation retains the record, and confirmed deletion
returns to the previous screen. Failure/retry and duplicate requests are
covered by automated screen tests. No real savings records were used.

Captures are `docs/screenshots/savings-entry-*.png`. The native preview and
regular Android debug builds both pass. Emulator size, density, and font scale
are restored to 1080×1920, 420 dpi, and 1.0 after layout checks. iOS runtime,
physical-device, and spoken screen-reader verification were not performed.

## Reproducing the preview

With JDK 17 configured, run from `android/`:

```powershell
.\gradlew.bat :app:assembleDebug -PreactNativeArchitectures=x86_64 --offline -I ../scripts/savings-entry-qa.gradle
```

Verify `app/build/outputs/apk/debug/output-metadata.json` identifies
`com.ipongoal.savingsentryqa` before installing. The QA APK is not a regular app
distribution. Rebuild without the init script to restore `com.ipongoal` output.

From the project root, `node scripts/savings-entry-qa.cjs` supports `launch`,
`read`, `tap <label>`, `seek <label>`, `scroll up|down`, and `shot <name>`.
Read, tap, scroll, and capture operations require the isolated QA app in front.
When several devices are connected, set `ANDROID_SERIAL` to the intended device
listed by `adb devices` before running the helper.
