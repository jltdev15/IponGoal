# Goal target-date calendar QA

Create/Edit Goal's optional target date is now a non-editable calendar field.
Android opens the native calendar dialog; an existing date is preselected and
an empty field starts at today without saving a deadline until Select is pressed.
Cancel preserves the existing value. Clear date removes the deadline.

The stored value remains a local calendar `YYYY-MM-DD` string, or `null` when
unset. The picker does not add a past/future restriction to existing validation.
Saving/history date controls and database schema are unchanged. The iOS path
uses a native picker in a confirmation modal; iOS native behavior is unverified.

Dependency: `@react-native-community/datetimepicker` 9.2.1. Rebuild the regular
Android app (`npm run android`) after installing this native dependency. iOS
requires its usual CocoaPods/native rebuild workflow on macOS.

Typecheck, lint, and 195 tests in 18 suites pass. Six calendar tests cover local
day/leap-day selection, saved-date preselection, cancel/clear behavior, disabled
and repeated-opening protection, cleanup/late callbacks, and Create/Edit Goal
saving both selected dates and an unset deadline.

## Isolated native preview

From `android/`, with JDK 17 configured:

```powershell
.\gradlew.bat :app:assembleDebug -PreactNativeArchitectures=x86_64 -I ../scripts/goal-calendar-qa.gradle
```

The first build downloads the new dependency's Android artifacts. Subsequent
builds may use `--offline` when those artifacts are cached. This preview is
`com.ipongoal.goalcalendarqa`, uses the real calendar field with in-memory state,
and opens no account or goal database. Never distribute its APK as the normal
app. Rebuild without the init script before using regular variant outputs.

## Native observations — 2026-10-06

The isolated Android build passes with the new module autolinked. Tapping the
date field opens a calendar, with no manual text field. Selecting October 31,
2026 displays that date and stores `2026-10-31`. Reopening preselects October 31;
Cancel leaves it unchanged, and Clear date restores No deadline. Evidence is
`screenshots/goal-calendar-picker.png` and `goal-calendar-selected.png`.
The preview uses only in-memory fixtures and does not access real records.

The regular debug app was then rebuilt and updated on the emulator through
`npm run android -- --no-packager`. The build/install succeeded with the native
calendar included. Existing app data was preserved; no reset or goal-data edits
were performed. The normal variant output now contains the regular app.
