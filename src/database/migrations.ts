export const migrations = [
  `CREATE TABLE users (
    id TEXT PRIMARY KEY, fullName TEXT NOT NULL, username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    passwordHash TEXT NOT NULL, gradeLevel TEXT NOT NULL DEFAULT '', createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
  );
  CREATE TABLE goals (
    id TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL, targetAmount INTEGER NOT NULL CHECK(targetAmount > 0 AND targetAmount <= 100000000000),
    targetDate TEXT, category TEXT NOT NULL, icon TEXT NOT NULL, note TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL CHECK(status IN ('active','completed','archived')),
    createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL, completedAt TEXT,
    UNIQUE(id, userId)
  );
  CREATE TABLE savings (
    id TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goalId TEXT NOT NULL, amount INTEGER NOT NULL CHECK(amount > 0 AND amount <= 100000000000),
    note TEXT NOT NULL DEFAULT '', transactionDate TEXT NOT NULL, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL,
    FOREIGN KEY(goalId,userId) REFERENCES goals(id,userId) ON DELETE CASCADE
  );
  CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE INDEX idx_goals_user ON goals(userId);
  CREATE INDEX idx_savings_user ON savings(userId);
  CREATE INDEX idx_savings_goal ON savings(goalId);
  CREATE INDEX idx_savings_date ON savings(transactionDate);
  CREATE TRIGGER savings_deleted AFTER DELETE ON savings BEGIN
    UPDATE goals SET status='active',completedAt=NULL,updatedAt=strftime('%Y-%m-%dT%H:%M:%fZ','now')
    WHERE id=OLD.goalId AND status='completed' AND targetAmount > COALESCE((SELECT SUM(amount) FROM savings WHERE goalId=OLD.goalId),0);
  END;
  CREATE TRIGGER savings_updated AFTER UPDATE ON savings BEGIN
    UPDATE goals SET status='active',completedAt=NULL,updatedAt=strftime('%Y-%m-%dT%H:%M:%fZ','now')
    WHERE id=NEW.goalId AND status='completed' AND targetAmount > COALESCE((SELECT SUM(amount) FROM savings WHERE goalId=NEW.goalId),0);
  END;
  CREATE TRIGGER goal_target_updated AFTER UPDATE OF targetAmount ON goals BEGIN
    UPDATE goals SET status='active',completedAt=NULL
    WHERE id=NEW.id AND status='completed' AND targetAmount > COALESCE((SELECT SUM(amount) FROM savings WHERE goalId=NEW.id),0);
  END;`,
  `ALTER TABLE users ADD COLUMN profilePhoto TEXT;`,
  `ALTER TABLE goals ADD COLUMN coverPhoto TEXT;`,
];
