# Home refresh — 2026-10-07

Home has no navigation title and keeps safe-area spacing above its compact
greeting. Other screen titles remain centered. Home has a smaller
"Saved so far" summary, a learning-games shortcut above the active goals, and
a separate saving tip below the list. The completed count opens the existing
completed-goals collection. Goal cards retain photos/category icons and show
"saved of", "Aim for", and "Record savings" with separate detail/action targets.

The custom tab bar reports its measured height through React Navigation's
height callback. Home uses the current header/tab heights to constrain and
clip its list, including the taller tab bar at enlarged text sizes. This
prevents offscreen content from drawing beneath navigation. Tab icons and
destinations are preserved.

## Automated verification

- TypeScript and targeted ESLint pass.
- 30 tests in Home, tab-bar, goal-photo, and learning-games suites pass.
- Coverage includes totals across goal statuses, original active order,
  virtualized large lists, every Home destination, empty states, progress at
  zero/target/over-target, optional dates, long names and large amounts,
  wrapping text, 48 dp controls, decorative icons, and measured tab-bar height.
- Android preview and regular debug builds pass with JDK 17, offline dependencies,
  and x86_64 architecture.

## Native verification

The isolated `com.ipongoal.homeqa` app uses synthetic records and the real
navigation/screens. Normal and 180% text layouts were inspected at 320, 390,
and 412 dp. The list clears the bottom bar, labels wrap, and controls remain
reachable through scrolling. A 30-goal fixture with a long name and a
₱1,000,000,000 amount was checked at 320 dp/180% text; Record savings opened
the correct goal's form. Completed-goals and learning-games shortcuts also
opened their correct destinations.

Screenshots use `docs/screenshots/home-refresh-*.png`: each width has Home and
goal-card captures at normal and enlarged text. Empty and completed-only
captures use 320 dp/180% text. These captures predate the Home header removal.
Full spoken TalkBack and physical-device QA were
not performed.

The emulator's System UI stalled during display resizing and was restarted.
Final screenshots were taken after recovery. Original size (1080×1920),
density (420), and font scale (1.0) are restored after QA.

## Reproducing the isolated preview

From `android/`, with JDK 17 configured:

```powershell
.\gradlew.bat :app:assembleDebug -PreactNativeArchitectures=x86_64 --offline -I ../scripts/home-refresh-qa.gradle
```

Verify `app/build/outputs/apk/debug/output-metadata.json` identifies
`com.ipongoal.homeqa` before installing. This variant is for QA only; it must
never be distributed as the regular app. Its scenario menu seeds synthetic
Populated, Empty, Completed only, or Long content records.

From the project root, `node scripts/home-refresh-qa.cjs` supports `launch`,
`read`, `tap <label>`, `seek <label>`, `scroll up|down`, and `shot <name>`.
Read/tap/scroll/capture operations require the isolated package in foreground.
Rebuild without the QA init script to restore the regular application ID and
entry point; the final regular debug output identifies `com.ipongoal`.
