import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'timers_database.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Retrieves the singleton database instance, initializing and running
 * migrations on the first call.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }
  
  dbInstance = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await runMigrations(dbInstance);
  return dbInstance;
}

/**
 * Handles database schema creation and incremental updates using user_version.
 */
async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  // Enable foreign key support
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Get the current database version
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const currentVersion = result?.user_version ?? 0;

  // Define database migrations sequentially
  const migrations: { [key: number]: string[] } = {
    1: [
      `CREATE TABLE IF NOT EXISTS timers (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        initialDuration INTEGER NOT NULL,
        remainingTime INTEGER NOT NULL,
        status TEXT NOT NULL,
        notes TEXT NOT NULL,
        isSelected INTEGER NOT NULL DEFAULT 0,
        targetTime REAL,
        notificationId TEXT,
        scheduledFor TEXT,
        completedAt TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_timers_status ON timers(status);`,
      `CREATE INDEX IF NOT EXISTS idx_timers_created ON timers(createdAt);`
    ],
    2: [
      `CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updatedAt);`
    ],
    3: [
      `ALTER TABLE timers ADD COLUMN position INTEGER NOT NULL DEFAULT 0;`,
      `CREATE INDEX IF NOT EXISTS idx_timers_position ON timers(position);`
    ],
  };

  const targetVersion = Object.keys(migrations).length;

  // Execute pending migrations
  if (currentVersion < targetVersion) {
    for (let i = currentVersion + 1; i <= targetVersion; i++) {
      const statements = migrations[i];
      if (statements) {
        for (const statement of statements) {
          await db.execAsync(statement);
        }
      }
    }
    // Update the user_version PRAGMA to the latest target
    await db.execAsync(`PRAGMA user_version = ${targetVersion};`);
  }
}
