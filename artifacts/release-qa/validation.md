# PiggyPath release validation

- APK: 34,643,828 bytes (34.64 MB), down from 167.69 MB; 79.3% smaller.
- ARM32 and ARM64 phone architectures only; bundled JavaScript present.
- R8 code optimization and resource shrinking enabled; branding resource retained.
- APK signature verified; existing development key and package ID retained.
- No Android INTERNET permission.
- Typecheck and lint passed. All 40 tests across 4 suites passed.
- Installed on the Android emulator. Verified startup, registration, native photo selection, saving an offline profile photo, account and photo persistence after restart and login, and remembered session persistence after another restart.
- Rebuild with `npm run android:release`.
