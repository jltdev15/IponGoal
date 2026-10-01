# Architecture

The UI calls typed repository functions. Repositories validate input and execute parameterized SQL. After successful mutation `refreshData(userId)` reloads the two Zustand data caches from SQLite. Screens never issue SQL or mutate a stored saved balance.

The root boot opens SQLite, applies transactional schema migrations, reads Remember Me metadata, and looks up a public user record. It shows a recoverable startup message if initialization fails, without erasing data. An unknown newer schema is refused. Malformed session JSON is cleared; missing remembered users return to authentication.

Auth uses an independent native stack. Main contains Home, History, Statistics, and Profile tabs plus form/detail/collection screens. Logging out swaps the entire authenticated navigator and clears caches, preventing another user from seeing a previous account's records through Back.

Registration derives passwords asynchronously in short JS slices, maintaining UI responsiveness. Native secure random values supply salts and IDs. Unknown-user login runs a dummy derivation. Hashes remain in the repository layer; Zustand holds only public user fields.

All domain mutations are short synchronous SQLite operations, so write checks and updates cannot interleave within the JS thread. Migration and starting-goal writes explicitly use BEGIN IMMEDIATE / COMMIT / ROLLBACK. Foreign keys and checks protect the on-disk model. Completion-demotion triggers handle edits/deletions/target changes consistently, including operations outside screens.

Form submissions use an immediate ref lock in addition to a loading state. The ref closes the gap before React re-renders a disabled button. Savings success replaces the form with a result view, so Done cannot create another transaction.

The application has no fetch, remote service, analytics, or cloud dependency. All icons, strings, tips, and JavaScript ship in the APK. The release Android manifest has no network permission; debug alone permits developer tools.

Statistics derive from saving dates, not creation timestamps. Monday-based calendar week ranges are independent from the chart's 7-day month buckets. All-time totals include archived and completed goals. Active/completed goal counts exclude archived goals. No seed data is inserted by app boot or production builds.
