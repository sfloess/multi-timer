import sqlite3
import json
from pathlib import Path
from typing import List, Optional, Union
from datetime import datetime
import uuid

try:
    import psycopg2
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False

from multi_timer.models import TimerState, TimerStatus

class SQLiteStorage:
    def __init__(self, db_path: Union[str, Path]):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._create_table()

    def _create_table(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS timers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                total_seconds INTEGER NOT NULL,
                remaining_seconds INTEGER NOT NULL,
                status TEXT NOT NULL,
                notes TEXT,
                position INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """)
            conn.commit()

    def save_all(self, timers: List[TimerState]):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            for timer in timers:
                cursor.execute("""
                INSERT OR REPLACE INTO timers (
                    id, name, total_seconds, remaining_seconds, status, notes, position, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    timer.id,
                    timer.name,
                    timer.duration,
                    timer.remaining,
                    timer.status.value,
                    timer.notes,
                    timers.index(timer),
                    datetime.now().isoformat(),
                    datetime.now().isoformat()
                ))
            conn.commit()

    def load_all(self) -> List[TimerState]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM timers ORDER BY position")
            rows = cursor.fetchall()
            return [
                TimerState(
                    id=row[0],
                    name=row[1],
                    duration=row[2],
                    remaining=row[3],
                    is_running=row[4] == TimerStatus.RUNNING.value,
                    notes=row[5],
                    alerted=False  # Not stored in DB, reset on load
                )
                for row in rows
            ]

    def save_timer(self, timer: TimerState):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT OR REPLACE INTO timers (
                id, name, total_seconds, remaining_seconds, status, notes, position, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                timer.id,
                timer.name,
                timer.duration,
                timer.remaining,
                timer.status.value,
                timer.notes,
                0,  # Position not used for single save
                datetime.now().isoformat(),
                datetime.now().isoformat()
            ))
            conn.commit()

    def delete_timer(self, timer_id: str):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM timers WHERE id = ?", (timer_id,))
            conn.commit()

class PostgreSQLStorage:
    def __init__(self, conn_str: str):
        if not PSYCOPG2_AVAILABLE:
            raise ImportError("psycopg2 is not installed. Cannot use PostgreSQL storage.")
        self.conn_str = conn_str
        self._create_table()

    def _create_table(self):
        with psycopg2.connect(self.conn_str) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                CREATE TABLE IF NOT EXISTS timers (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    total_seconds INTEGER NOT NULL,
                    remaining_seconds INTEGER NOT NULL,
                    status TEXT NOT NULL,
                    notes TEXT,
                    position INTEGER NOT NULL,
                    created_at TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP NOT NULL
                )
                """)
                conn.commit()

    def save_all(self, timers: List[TimerState]):
        with psycopg2.connect(self.conn_str) as conn:
            with conn.cursor() as cur:
                for timer in timers:
                    cur.execute("""
                    INSERT INTO timers (
                        id, name, total_seconds, remaining_seconds, status, notes, position, created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        name = EXCLUDED.name,
                        total_seconds = EXCLUDED.total_seconds,
                        remaining_seconds = EXCLUDED.remaining_seconds,
                        status = EXCLUDED.status,
                        notes = EXCLUDED.notes,
                        position = EXCLUDED.position,
                        updated_at = EXCLUDED.updated_at
                    """, (
                        timer.id,
                        timer.name,
                        timer.duration,
                        timer.remaining,
                        timer.status.value,
                        timer.notes,
                        timers.index(timer),
                        datetime.now(),
                        datetime.now()
                    ))
                conn.commit()

    def load_all(self) -> List[TimerState]:
        with psycopg2.connect(self.conn_str) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM timers ORDER BY position")
                rows = cur.fetchall()
                return [
                    TimerState(
                        id=row[0],
                        name=row[1],
                        duration=row[2],
                        remaining=row[3],
                        is_running=row[4] == TimerStatus.RUNNING.value,
                        notes=row[5],
                        alerted=False
                    )
                    for row in rows
                ]

    def save_timer(self, timer: TimerState):
        with psycopg2.connect(self.conn_str) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                INSERT INTO timers (
                    id, name, total_seconds, remaining_seconds, status, notes, position, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    total_seconds = EXCLUDED.total_seconds,
                    remaining_seconds = EXCLUDED.remaining_seconds,
                    status = EXCLUDED.status,
                    notes = EXCLUDED.notes,
                    updated_at = EXCLUDED.updated_at
                """, (
                    timer.id,
                    timer.name,
                    timer.duration,
                    timer.remaining,
                    timer.status.value,
                    timer.notes,
                    0,
                    datetime.now(),
                    datetime.now()
                ))
                conn.commit()

    def delete_timer(self, timer_id: str):
        with psycopg2.connect(self.conn_str) as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM timers WHERE id = %s", (timer_id,))
                conn.commit()

def get_storage(config: dict) -> Union[SQLiteStorage, PostgreSQLStorage]:
    storage_mode = config.get("storage_mode", "sqlite")
    if storage_mode == "sqlite":
        db_path = config.get("sqlite_path", Path.home() / ".multi-timer" / "timers.db")
        return SQLiteStorage(db_path)
    elif storage_mode == "postgresql":
        conn_str = config.get("postgresql_conn_str")
        if not conn_str:
            raise ValueError("PostgreSQL connection string not provided in config")
        return PostgreSQLStorage(conn_str)
    else:
        raise ValueError(f"Unsupported storage mode: {storage_mode}")
