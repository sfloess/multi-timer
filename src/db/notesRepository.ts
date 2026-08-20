import { getDatabase } from './database';

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Migration v2: Creates the notes table if it does not exist.
 */
export const initNotesSchema = async (): Promise<void> => {
  const db = await getDatabase();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);
};

export const getAllNotes = async (): Promise<Note[]> => {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Note>(
    'SELECT id, title, content, createdAt, updatedAt FROM notes ORDER BY updatedAt DESC;'
  );
  return rows;
};

export const saveNote = async (note: Note): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO notes (id, title, content, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       title = excluded.title,
       content = excluded.content,
       updatedAt = excluded.updatedAt;`,
    [note.id, note.title, note.content, note.createdAt, note.updatedAt]
  );
};

export const deleteNote = async (id: string): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM notes WHERE id = ?;', [id]);
};

export const clearAllNotes = async (): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM notes;');
};


