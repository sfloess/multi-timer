// ──────────────────────────────────────────────────────────────────────
//  Imports & Types
// ──────────────────────────────────────────────────────────────────────
import { getDatabase } from './database';
import type { TimerInstance, TimerRow, TimerStatus } from '../types/timer';

/**
 * Convert a DB row (TimerRow) to the public domain model (TimerInstance).
 */
function mapRowToInstance(row: TimerRow): TimerInstance {
  return {
    id:               row.id,
    name:             row.name,
    initialDuration:  row.initialDuration,
    remainingTime:    row.remainingTime,
    status:           row.status as TimerStatus,
    notes:            row.notes,
    isSelected:       row.isSelected === 1,
    targetTime:       row.targetTime,
    notificationId:   row.notificationId,
    scheduledFor:     row.scheduledFor,
    completedAt:      row.completedAt,
    position:         row.position,
    createdAt:        row.createdAt,
    updatedAt:        row.updatedAt,
  };
}

/**
 * Build a `TimerRow` from a `TimerInstance`.  `fallbackTimestamp` is used
 * when the timer does not yet have a `createdAt` / `updatedAt` value.
 */
function timerToRow(timer: TimerInstance, fallbackTimestamp: string): TimerRow {
  const now = fallbackTimestamp;
  return {
    id:               timer.id,
    name:             timer.name,
    initialDuration:  timer.initialDuration,
    remainingTime:    timer.remainingTime,
    status:           timer.status,
    notes:            timer.notes,
    isSelected:       timer.isSelected ? 1 : 0,
    targetTime:       timer.targetTime ?? null,
    notificationId:   timer.notificationId ?? null,
    scheduledFor:     timer.scheduledFor ?? null,
    completedAt:      timer.completedAt ?? null,
    position:         timer.position ?? 0,
    createdAt:        timer.createdAt ?? now,
    updatedAt:        timer.updatedAt ?? now,
  };
}

/**
 * Helper that returns the current ISO‑timestamp – used for `createdAt`
 * and `updatedAt` when a timer is first persisted.
 */
function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Retrieve **all** timers, ordered by newest first.
 */
export async function getAllTimers(): Promise<TimerInstance[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TimerRow>(
    'SELECT * FROM timers ORDER BY position ASC, createdAt DESC;'
  );
  return rows.map(mapRowToInstance);
}

/**
 * Retrieve a single timer by its primary‑key `id`.
 */
export async function getTimerById(id: string): Promise<TimerInstance | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<TimerRow>(
    'SELECT * FROM timers WHERE id = ?;',
    [id]
  );
  return row ? mapRowToInstance(row) : null;
}

/**
 * Insert a brand‑new timer record.
 */
export async function insertTimer(timer: TimerInstance): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO timers (
        id, name, initialDuration, remainingTime, status, notes,
        isSelected, targetTime, notificationId, scheduledFor,
        completedAt, position, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        timer.id,
        timer.name,
        timer.initialDuration,
        timer.remainingTime,
        timer.status,
        timer.notes,
        timer.isSelected ? 1 : 0,
        timer.targetTime,
        timer.notificationId,
        timer.scheduledFor ?? null,
        timer.completedAt ?? null,
        timer.position ?? 0,
        timer.createdAt ?? nowIso(),
        timer.updatedAt ?? nowIso(),
      ]
    );
  } catch (error) {
    console.error('Failed to insert timer into SQLite:', error);
    throw error;
  }
}

/**
 * Update an existing timer record.
 */
export async function updateTimer(timer: TimerInstance): Promise<void> {
  try {
    const db = await getDatabase();
    const now = nowIso();
    await db.runAsync(
      `UPDATE timers SET
        name = ?,
        initialDuration = ?,
        remainingTime = ?,
        status = ?,
        notes = ?,
        isSelected = ?,
        targetTime = ?,
        notificationId = ?,
        scheduledFor = ?,
        completedAt = ?,
        position = ?,
        updatedAt = ?
      WHERE id = ?;`,
      [
        timer.name,
        timer.initialDuration,
        timer.remainingTime,
        timer.status,
        timer.notes,
        timer.isSelected ? 1 : 0,
        timer.targetTime,
        timer.notificationId,
        timer.scheduledFor ?? null,
        timer.completedAt ?? null,
        timer.position ?? 0,
        now,
        timer.id,
      ]
    );
  } catch (error) {
    console.error(`Failed to update timer ${timer.id} in SQLite:`, error);
    throw error;
  }
}

/**
 * Upsert – insert a new timer or update an existing one.
 * Uses SQLite's `ON CONFLICT(id) DO UPDATE` clause for a single‑statement
 * operation that is atomic and efficient.
 */
export async function saveTimer(timer: TimerInstance): Promise<void> {
  try {
    const db = await getDatabase();
    const now = nowIso();
    await db.runAsync(
      `INSERT INTO timers (
        id, name, initialDuration, remainingTime, status, notes,
        isSelected, targetTime, notificationId, scheduledFor,
        completedAt, position, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        initialDuration = excluded.initialDuration,
        remainingTime = excluded.remainingTime,
        status = excluded.status,
        notes = excluded.notes,
        isSelected = excluded.isSelected,
        targetTime = excluded.targetTime,
        notificationId = excluded.notificationId,
        scheduledFor = excluded.scheduledFor,
        completedAt = excluded.completedAt,
        position = excluded.position,
        updatedAt = excluded.updatedAt;`,
      [
        timer.id,
        timer.name,
        timer.initialDuration,
        timer.remainingTime,
        timer.status,
        timer.notes,
        timer.isSelected ? 1 : 0,
        timer.targetTime,
        timer.notificationId,
        timer.scheduledFor ?? null,
        timer.completedAt ?? null,
        timer.position ?? 0,
        timer.createdAt ?? now,
        timer.updatedAt ?? now,
      ]
    );
  } catch (error) {
    console.error(`Failed to save/upsert timer ${timer.id} in SQLite:`, error);
    throw error;
  }
}

/**
 * Delete a timer by its `id`.
 */
export async function deleteTimer(id: string): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM timers WHERE id = ?;', [id]);
  } catch (error) {
    console.error(`Failed to delete timer ${id} from SQLite:`, error);
    throw error;
  }
}

/**
 * Remove **all** timer records – useful for tests or a full reset.
 */
export async function clearAllTimers(): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM timers;');
  } catch (error) {
    console.error('Failed to clear all timers from SQLite:', error);
    throw error;
  }
}
