# Profile polish — 2026-10-07

The profile retains its routes, data calculations, editing flow, and two reset confirmations. Screen-local changes compact the identity card, replace filled summary tiles with plain counts, cap content at 480dp, and group action-specific errors with their buttons. Logout/reset use the existing action lock and show a spinner only on the running action.

## Automated validation

- TypeScript and repository ESLint pass.
- Profile and bottom-navigation suites: **15 tests pass**.
- Coverage includes archived savings, empty totals, optional grade, long identity, photo fallback, navigation, exact large totals (₱2,999,999,999.97), confirmation gating, pending actions, disabled controls, duplicate execution, contextual failures, and successful retry. Existing Edit Profile guard, persistence, and photo tests also pass.

## Native validation

An isolated x86_64 debug APK with an embedded QA bundle was built using the existing `profile-qa.gradle` harness and cached debug dependencies. Its application ID was verified as `com.ipongoal.profileqa`. Only this package's synthetic database was used for fixtures; the normal app's database was not modified.

- 390dp / 100% text: full long name wraps, summary shows ₱350 including archived savings, plain counts render, and Completed Goals, Archived Goals, and About open correctly.
- 360dp / 150% text: identity stacks and wraps; device-data controls remain reachable by scrolling. Cancellation at the first and second reset confirmations returns to Profile without ending the session.
- 320dp / 180% text: full long name wraps without ellipsis and Edit Profile remains reachable by scrolling.
- Native accessibility trees expose the Edit Profile, Log out, Reset all device data, and goal-collection labels, including counts. Full spoken TalkBack traversal was not performed.

Evidence is saved in `screenshots/profile-polish-390.png`, `profile-polish-summary.png`, `profile-polish-device-data.png`, `profile-polish-360-large.png`, `profile-polish-360-device-data.png`, `profile-polish-reset-confirmation.png`, `profile-polish-320-largest.png`, and `profile-polish-320-edit-reachable.png`.

## Verification limits

The offline release build could not resolve an uncached React Native release AAR. The debug QA build succeeded instead. After restarting the QA app with a large-value database fixture, Android input reported no focused window and a `NOT_VISIBLE` focus request. The problem persisted after restoring the baseline fixture and display settings. Consequently, native Profile large-value wrapping, final reset execution, logout persistence, and traversal of every action at 320dp remain unverified in this run; automated behavior checks pass. The prior profile QA record remains historical evidence, not a substitute for these checks.

The original display resolution, density, and 100% font scale were restored after testing. The isolated QA package and its dedicated ADB reverse connection were removed; the original Metro reverse connection was retained.
