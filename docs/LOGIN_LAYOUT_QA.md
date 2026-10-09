# Reference-style login layout QA

Login uses the supplied reference's centered flower mascot, greeting/subtitle,
icon-equipped white fields, gradient Login action, divider, and account-creation
link. The decorative hero hides while the keyboard is visible. There are no
footers, so keyboard visibility cannot reorder the actions. A Login-specific
field preserves focused-input visibility, password masking/toggling, and limits.
The optional ScreenContainer background color defaults to the existing theme;
only Login uses a transparent container over its local near-white background.
Authentication, unchecked Remember Me default, and destinations are unchanged.

Typecheck, lint, and 188 tests in 17 suites pass. Focused coverage includes
keyboard-open/closed action order, account-creation navigation, checkbox state,
credential limits, focused styling, announced errors, retained drafts on failure,
password clearing/remasking on success, visibility value retention and limits,
busy-state locking, and duplicate-submit prevention.

## Isolated native preview

From `android/`, with JDK 17 configured:

```powershell
.\gradlew.bat :app:assembleDebug -PreactNativeArchitectures=x86_64 --offline -I ../scripts/login-layout-qa.gradle
```

Install only on an x86_64 emulator. This is `com.ipongoal.loginqa`; it uses the
real Login screen with a synthetic login handler that waits two seconds and returns an incorrect
credentials error, and a placeholder Register destination. It never boots auth,
opens the SQLite database, or accesses real account records. Never distribute the
preview APK as the normal app. Rebuild without the init script before using the
regular variant output for installation/distribution.

## Reference-style native observations — 2026-10-06

Button-shape follow-up: native inspection reproduced a square-cut right edge
after responsive padding changed from compact to regular. The gradient now uses
the button's measured numeric width/height, with explicit horizontal/vertical
corner radii and a native rounded clipping boundary. A solid pink fallback is
visible before measurement. Loading preserves the measured button height.
Typecheck, lint, and 23 focused tests pass, including width/height changes and
loading-height stability. Native before/after evidence is recorded separately
as `screenshots/login-button-before.png` and `login-button-after.png`.
The final Android preview confirms all four corners are rounded. At 150% text,
`screenshots/login-button-large.png` and `login-button-loading.png` show the same
button height before/during loading. Font scale was restored to 1.0 afterward.

Spacing follow-up: Login's native header is now transparent, preserving native
back navigation without reserving an empty header bar. Login applies its top
safe-area inset locally, removes the extra content-top/bottom padding, and keeps
only 8px bottom content padding plus the system safe area. Other screens retain
their existing container padding. Typecheck, lint, and 22 focused tests pass.
The screenshots below precede this spacing follow-up.

The isolated Android build passes. The final compact spacing and shadows were
rechecked with typecheck, lint, and 22 focused tests after the full 188-test run.
Reference-style screenshots supersede the earlier compact-layout images below:

- `screenshots/login-reference-normal.png`: compact phone, generated flower
  mascot, native fields/icons, gradient Login, divider, and account link.
- `screenshots/login-reference-tall.png`: larger 120px hero and 36px heading.
- `screenshots/login-reference-visible-password.png`: Show password retains
  synthetic `test123`; Hide password restores masking without clearing it.
- `screenshots/login-reference-loading.png` and `login-reference-error.png`:
  disabled/loading controls, then an error above Login with the draft retained.
- `screenshots/login-reference-large.png` and `login-reference-large-actions.png`:
  320 dp width, 150% text, readable labels and actions reachable by scrolling.
- `screenshots/login-reference-keyboard.png`: hero hidden with the keyboard open;
  greeting/subtitle retained and focused password visible above the keyboard.

Native tapping of the new account link reaches the Register QA destination.
Remember Me is initially unchecked; its checked appearance was inspected before
the loading-state capture. A full spoken TalkBack audit remains unverified.
Display size, density, font scale, and keyboard setting were restored to
1080×1920, 420, 1.0, and 0. No real account records were accessed.

## Earlier compact-layout observations — 2026-10-06

The isolated Android build passes. Evidence:

- `screenshots/login-normal.png`: reduced header, labeled fields, compact checkbox,
  Login followed by the text account-creation action.
- `screenshots/login-error.png`: synthetic error immediately above Login; username
  and masked password are retained.
- `screenshots/login-keyboard.png`: focused password remains visible above the
  normal on-screen keyboard. Dragging uses the existing container's keyboard
  dismissal behavior, revealing both actions in the original order.
- `screenshots/login-large.png` and `screenshots/login-large-actions.png`: 320 dp
  width with 150% text, wrapping checkbox copy and actions reachable by scrolling.

Native tapping of Create a local account opens the Register QA destination.
Native labels expose both actions and the Remember Me checkbox. A full spoken
TalkBack audit remains unverified. Display size (1080×1920), density (420), font
scale (1.0), and hardware-keyboard soft-input setting (0) were restored.
