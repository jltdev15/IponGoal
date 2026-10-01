# SQLite schema v1

Database: `ipon-goal.sqlite`, private app storage. WAL mode and foreign keys are enabled on open. `PRAGMA user_version` selects ordered migrations, each committed atomically. Never change an already-shipped migration; append a new migration for future releases.

| Table | Columns |
| --- | --- |
| users | id TEXT PK, fullName TEXT, username TEXT UNIQUE COLLATE NOCASE, passwordHash TEXT, gradeLevel TEXT, profilePhoto TEXT nullable, createdAt TEXT, updatedAt TEXT |
| goals | id TEXT PK, userId FK users, name TEXT, targetAmount INTEGER centavos, targetDate TEXT nullable, category TEXT, icon TEXT, note TEXT, status TEXT, createdAt TEXT, updatedAt TEXT, completedAt TEXT nullable |
| savings | id TEXT PK, userId FK users, goalId TEXT, amount INTEGER centavos, note TEXT, transactionDate TEXT, createdAt TEXT, updatedAt TEXT |
| app_settings | key TEXT PK, value TEXT |

`goals(id,userId)` is unique. `savings(goalId,userId)` references this composite key so a user's savings cannot belong to another user's goal. Users cascade to goals/savings; goals cascade to savings.

Indexed columns: goals.userId, savings.userId, savings.goalId, savings.transactionDate. Monetary fields are positive integers up to 100,000,000,000 centavos. Repositories additionally enforce a maximum aggregate per user. Goal status is checked against active/completed/archived.

Repository goal projections add `savedAmount` and `entryCount` from aggregate SQL. Neither projection is stored as a mutable goal field.

Triggers `savings_deleted`, `savings_updated`, and `goal_target_updated` demote completed goals below their target and clear completedAt. Archived goals remain archived. Restoring an archive sets completed/active according to its current balance.

Session key `session`: JSON `{currentUserId,isLoggedIn:true,rememberMe:true}`. Only Remember Me writes this record; logout removes it without modifying domain rows. Registration creates a transient session. Reset deletes savings, goals, users, and preferences together, preserving the schema so the next registration works.

Saving dates use local YYYY-MM-DD; timestamps use UTC ISO strings. Amounts accept at most two fractional peso digits. All writes use parameter binding; screen-level SQL is prohibited.

Migration 2 adds nullable `users.profilePhoto`. It stores a resized (maximum 512 × 512) JPEG/PNG/WebP data URI, bounded to 2 MiB of encoded text. The image bytes live in private SQLite storage, not in a temporary picker path or remote URL. Replacement overwrites the old value; Remove Photo plus Save Profile clears it; resetting the app deletes it with the user row. Existing accounts migrate with no photo.
