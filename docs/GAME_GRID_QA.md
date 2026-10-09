# Learning Games grid QA

The introductory games and Savings Flight levels use separate square-card
grids. Measured content width determines equal card widths with a 10px gap.
Normal text permits three columns at a minimum 104px card width; enlarged text
requires 160px per card. Font scales above 1.5 use one column. Titles wrap without
truncation, while illustrations yield space to text. Incomplete rows align left.

Game descriptions are accessibility hints. Decorative illustrations do not add
screen-reader stops. Manual/Assisted controls expose their selected state and
pass the chosen mode to the existing flight routes. Game logic/data are unchanged.

## Isolated native preview

From `android/`, with JDK 17 configured:

```powershell
.\gradlew.bat :app:assembleDebug -PreactNativeArchitectures=x86_64 --offline -I ../scripts/game-grid-qa.gradle
```

Install only on an x86_64 emulator. This is `com.ipongoal.gamegridqa`, loads its
bundled preview through the existing isolated QA host, and opens no account or
savings stores. It uses the real Games screen and placeholder destination screens.
Never distribute this APK as the normal app. Rebuild without the init script
before using the regular variant output for installation/distribution.

## Verification — 2026-10-06

Typecheck, lint, and all 185 tests in 17 suites pass. After native inspection
revealed that an incomplete row could shrink, cards also received an explicit
height equal to their calculated width. The 35 focused grid/navigation tests,
typecheck, and lint pass after that fix.

The isolated Android build passes. Native card bounds at normal text are square
within one physical pixel of rounding, including the incomplete row. Evidence:

- `screenshots/game-grid-normal.png`: three-column introductory grid.
- `screenshots/game-grid-flight.png`: three-column flight grid and Home action.
- `screenshots/game-grid-narrow.png`: two columns at 320 dp width.
- `screenshots/game-grid-large.png`: two columns at 150% text.
- `screenshots/game-grid-largest.png`: one column at 180% text.

Native accessibility-tree checks confirm all Play/Practice labels and selected
flight-mode state. Tapping Assisted switches its selected state to true and
Manual to false. A full spoken TalkBack audit remains unverified.

Emulator display size (1080×1920), density (420), and font scale (1.0) were
restored. This preview did not open or modify real account/goal records.
