import { open, type DB } from '@op-engineering/op-sqlite';
import { migrations } from './migrations';
let connection: DB | undefined;
export function database() {
  if (!connection) {
    throw new Error('Database is not ready.');
  }
  return connection;
}
export function execute(sql: string, params: (string | number | null)[] = []) {
  return database().executeSync(sql, params);
}
export function rows<T>(
  sql: string,
  params: (string | number | null)[] = [],
): T[] {
  return execute(sql, params).rows as T[];
}
export function transaction<T>(action: () => T): T {
  execute('BEGIN IMMEDIATE');
  try {
    const result = action();
    execute('COMMIT');
    return result;
  } catch (error) {
    execute('ROLLBACK');
    throw error;
  }
}
export function initializeDatabase() {
  if (connection) {
    return;
  }
  connection = open({ name: 'ipon-goal.sqlite' });
  try {
    execute('PRAGMA foreign_keys = ON');
    execute('PRAGMA journal_mode = WAL');
    const version = rows<{ user_version: number }>('PRAGMA user_version')[0]
      .user_version;
    if (version > migrations.length) {
      throw new Error('Database version is newer than this app.');
    }
    for (let i = version; i < migrations.length; i++) {
      transaction(() => {
        migrations[i]
          .split(/(?<=;)\s*(?=CREATE)/)
          .filter(Boolean)
          .forEach(sql => execute(sql));
        execute(`PRAGMA user_version = ${i + 1}`);
      });
    }
  } catch (error) {
    connection.close();
    connection = undefined;
    throw error;
  }
}
export function resetDatabase() {
  transaction(() => {
    execute('DELETE FROM savings');
    execute('DELETE FROM goals');
    execute('DELETE FROM users');
    execute('DELETE FROM app_settings');
  });
}
