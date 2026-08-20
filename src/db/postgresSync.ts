import { TimerInstance } from '../types/timer';
import { PostgresConfig, SyncResult } from './syncTypes';

export function buildApiUrl(config: PostgresConfig): string {
  if (config.apiEndpoint && config.apiEndpoint.trim() !== '') {
    return config.apiEndpoint.replace(/\/+$/, '');
  }
  const host = config.host || 'localhost';
  const port = config.port ? `:${config.port}` : '';
  return `http://${host}${port}/api`.replace(/\/+$/, '');
}

export async function testConnection(
  config: PostgresConfig
): Promise<{ success: boolean; message: string }> {
  try {
    const baseUrl = buildApiUrl(config);
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Connection failed with status ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json().catch(() => ({}));
    return {
      success: true,
      message: data.message || 'Successfully connected to PostgreSQL API',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown network error';
    return {
      success: false,
      message: `Failed to connect: ${errorMessage}`,
    };
  }
}

export async function createDatabase(
  config: PostgresConfig
): Promise<{ success: boolean; message: string }> {
  try {
    const baseUrl = buildApiUrl(config);
    const response = await fetch(`${baseUrl}/setup/database`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ database: config.database }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || `Database creation failed with status ${response.status}`,
      };
    }

    const data = await response.json().catch(() => ({}));
    return {
      success: true,
      message: data.message || `Database '${config.database}' ready`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown network error';
    return {
      success: false,
      message: `Database creation failed: ${errorMessage}`,
    };
  }
}

export async function createTimersTable(
  config: PostgresConfig
): Promise<{ success: boolean; message: string }> {
  try {
    const baseUrl = buildApiUrl(config);
    const schema = {
      tableName: 'timers',
      columns: [
        { name: 'id', type: 'TEXT PRIMARY KEY' },
        { name: 'name', type: 'TEXT NOT NULL' },
        { name: 'duration', type: 'INTEGER NOT NULL' },
        { name: 'remaining', type: 'INTEGER NOT NULL' },
        { name: 'isRunning', type: 'BOOLEAN NOT NULL DEFAULT FALSE' },
        { name: 'updatedAt', type: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
        { name: 'createdAt', type: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
      ],
    };

    const response = await fetch(`${baseUrl}/setup/tables`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(schema),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || `Table creation failed with status ${response.status}`,
      };
    }

    const data = await response.json().catch(() => ({}));
    return {
      success: true,
      message: data.message || 'Timers table created or verified successfully',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown network error';
    return {
      success: false,
      message: `Table creation failed: ${errorMessage}`,
    };
  }
}

export async function autoProvision(
  config: PostgresConfig
): Promise<{ success: boolean; message: string }> {
  try {
    const dbResult = await createDatabase(config);
    if (!dbResult.success) {
      return {
        success: false,
        message: `Auto-provisioning failed at database setup: ${dbResult.message}`,
      };
    }

    const tableResult = await createTimersTable(config);
    if (!tableResult.success) {
      return {
        success: false,
        message: `Auto-provisioning failed at table setup: ${tableResult.message}`,
      };
    }

    return {
      success: true,
      message: 'Auto-provisioning completed successfully',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: `Auto-provisioning failed: ${errorMessage}`,
    };
  }
}

export async function syncToRemote(
  timers: TimerInstance[],
  config: PostgresConfig
): Promise<SyncResult> {
  const timestamp = new Date().toISOString();
  try {
    const baseUrl = buildApiUrl(config);
    const response = await fetch(`${baseUrl}/timers`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ timers }),
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Sync to remote failed with status ${response.status}`,
        timestamp,
        syncedCount: 0,
      };
    }

    return {
      success: true,
      message: 'Successfully pushed timers to remote',
      timestamp,
      syncedCount: timers.length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown network error';
    return {
      success: false,
      message: `Failed to push to remote: ${errorMessage}`,
      timestamp,
      syncedCount: 0,
    };
  }
}

export async function syncFromRemote(
  config: PostgresConfig
): Promise<TimerInstance[]> {
  try {
    const baseUrl = buildApiUrl(config);
    const response = await fetch(`${baseUrl}/timers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      return data;
    } else if (data && Array.isArray(data.timers)) {
      return data.timers;
    }
    return [];
  } catch (error) {
    console.error('Error in syncFromRemote:', error);
    return [];
  }
}

export async function fullSync(
  localTimers: TimerInstance[],
  config: PostgresConfig
): Promise<SyncResult> {
  const timestamp = new Date().toISOString();
  try {
    const remoteTimers = await syncFromRemote(config);
    const timerMap = new Map<string, TimerInstance>();

    for (const timer of localTimers) {
      if (timer && timer.id) {
        timerMap.set(timer.id, timer);
      }
    }

    for (const remoteTimer of remoteTimers) {
      if (!remoteTimer || !remoteTimer.id) continue;

      const localTimer = timerMap.get(remoteTimer.id);
      if (!localTimer) {
        timerMap.set(remoteTimer.id, remoteTimer);
      } else {
        const localTime = new Date(localTimer.updatedAt || 0).getTime();
        const remoteTime = new Date(remoteTimer.updatedAt || 0).getTime();

        if (remoteTime > localTime) {
          timerMap.set(remoteTimer.id, remoteTimer);
        }
      }
    }

    const mergedTimers = Array.from(timerMap.values());
    const pushResult = await syncToRemote(mergedTimers, config);

    return {
      success: pushResult.success,
      message: pushResult.success
        ? `Full sync completed. Merged ${mergedTimers.length} total items.`
        : `Full sync push failed: ${pushResult.message}`,
      timestamp,
      syncedCount: pushResult.syncedCount,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: `Full sync failed: ${errorMessage}`,
      timestamp,
      syncedCount: 0,
    };
  }
}