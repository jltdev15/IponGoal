# Goal creation wizard and photos

Create Goal uses Your goal → Savings plan → Personalize → Review, with visible
step progress and Back/Continue controls. Edit Goal remains a single form.
Name/amount/date validation blocks invalid advancement. Drafts stay in screen
memory; only final Create Goal or Save Changes writes to SQLite. Back preserves
drafts, and leaving the first creation step or edited form prompts Keep Editing
or Discard. Photo operations and saving lock all controls/navigation.
Validation/save errors stay above the pinned controls rather than below the
scrolling form, and Continue dismisses the keyboard before validation.

Camera and gallery share the installed image picker: one photo, 512×512 bounds,
quality 0.8, compatible representation, base64 bytes, and no extra metadata or
automatic public-gallery saving. JPEG/PNG/WebP data URLs are capped at 2MiB
encoded length. Canceled/failed selection retains the previous draft photo.

Migration 3 adds nullable `goals.coverPhoto`. Existing records receive null.
Legacy repository callers that omit it retain the existing photo on updates;
explicit null clears it. Goal photos are private local data, shown as a 48px
Home thumbnail and a larger Goal Details photo, with category-icon fallback.
Deletion removes the photo with its goal; collection cards keep their icons.
iOS includes camera/library usage descriptions; iOS native capture is unverified.

Typecheck, lint, and 209 tests in 20 suites pass. Coverage includes wizard
validation/navigation and exit guards, no writes before review, save retries,
same-frame double actions, camera/gallery results/errors/cancel, photo fallback,
migration preservation, photo ownership, legacy updates, clearing, and deletion.

## Isolated native preview

From `android/`, with JDK 17 configured:

```powershell
.\gradlew.bat :app:assembleDebug -PreactNativeArchitectures=x86_64 --offline -I ../scripts/goal-wizard-qa.gradle
```

This is `com.ipongoal.goalwizardqa` with its own synthetic account/database and
the real Home/navigation/form/detail screens. It cannot access the regular app's
records. The seeded account is remembered; its password hash is intentionally
not for authentication. Never distribute this QA APK. Rebuild without the init
script before using the regular variant output for installation/distribution.

## Native observations — 2026-10-06

The isolated Android build passes. Creation was exercised through all four
steps, entering a synthetic name, ₱100 target, ₱10 starting savings, and an
October 31 deadline through the calendar. The emulator camera captured its
emulated scene and returned to the draft. Gallery selection and replacement
returned to the same Personalize/Edit form. Final submission created only the
synthetic goal and its starting savings.

Editing remained a single form. A saved gallery photo was visible in Goal
Details and as a Home thumbnail after stopping/restarting the isolated app.
Evidence: `screenshots/goal-wizard-step1.png`, `goal-wizard-step2.png`,
`goal-wizard-step3.png`, `goal-wizard-camera-preview.png`,
`goal-wizard-gallery-preview.png`, `goal-wizard-review.png`,
`goal-wizard-saved-photo.png`, and `goal-wizard-restarted-home.png`.

At 320 dp and 150% text, the form scrolls and Back/Continue stack with readable
targets (`screenshots/goal-wizard-large.png`). Typing and returning from the
keyboard were exercised at normal size; the emulator's floating keyboard also
opened at enlarged text. A full docked-keyboard/TalkBack audit at enlarged text,
iOS camera capture, and physical-phone camera behavior remain unverified.

Size (1080×1920), density (420), font scale (1.0), and hardware-keyboard setting
(0) were restored. The two synthetic gallery images created for the test were
removed. All creation/editing tests used the isolated package's synthetic data.

The regular Android debug app was rebuilt and updated on the emulator with
`npm run android -- --no-packager`, preserving app data. Its normal build/install
passed. After the final error-placement adjustment, typecheck, lint, and the
19 focused wizard/calendar/photo tests were rerun successfully.
