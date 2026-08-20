import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Configuration shapes
 */
export interface PostgresConfig {
  enabled: boolean;
  host: string;
  port: string;
  database: string;
  username: string;
  password: string; // optional in some setups; kept for completeness
}

export interface StorageConfig {
  sqliteLocation: string;
}

export interface GeneralConfig {
  playSound: boolean;
  notificationsEnabled: boolean;
  autoSync: boolean;
}

export interface AppSettings {
  storage: StorageConfig;
  postgres: PostgresConfig;
  general: GeneralConfig;
  lastSyncedAt: string | null;
  syncError: string | null;
}

/**
 * Default values used when no persisted settings exist.
 */
export const DEFAULT_SETTINGS: AppSettings = {
  storage: {
    sqliteLocation: 'timers_database.db',
  },
  postgres: {
    enabled: false,
    host: '',
    port: '5432',
    database: '',
    username: '',
    password: '',
  },
  general: {
    playSound: true,
    notificationsEnabled: true,
    autoSync: false,
  },
  lastSyncedAt: null,
  syncError: null,
};

const SETTINGS_STORAGE_KEY = '@multi_timer_app_settings_v1';

/**
 * Load persisted settings; fall back to defaults on any error.
 */
export async function loadAppSettings(): Promise<AppSettings> {
  try {
    const json = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!json) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(json);
    return {
      storage: { ...DEFAULT_SETTINGS.storage, ...(parsed.storage || {}) },
      postgres: { ...DEFAULT_SETTINGS.postgres, ...(parsed.postgres || {}) },
      general: { ...DEFAULT_SETTINGS.general, ...(parsed.general || {}) },
      lastSyncedAt: parsed.lastSyncedAt ?? null,
      syncError: parsed.syncError ?? null,
    };
  } catch (error) {
    console.error('Failed to load app settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Persist settings; any error is logged and re‑thrown so the caller can handle it.
 */
export async function saveAppSettings(settings: AppSettings): Promise<void> {
  try {
    const json = JSON.stringify(settings);
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, json);
  } catch (error) {
    console.error('Failed to save app settings:', error);
    throw error; // propagate for upstream error handling
  }
}

/**
 * Validate PostgreSQL connection parameters.
 * Simulates a network round‑trip (~1 s) and returns a descriptive result.
 */
export async function testPostgresConnection(
  config: PostgresConfig
): Promise<{ success: boolean; message: string }> {
  // ---- basic field presence checks ----
  if (!config.host.trim()) {
    return { success: false, message: 'Host is required.' };
  }
  if (!config.database.trim()) {
    return { success: false, message: 'Database name is required.' };
  }
  if (!config.username.trim()) {
    return { success: false, message: 'Username is required.' };
  }
  // Password is optional for auth‑less setups; if present, ensure it's a string.
  if (config.password !== undefined && typeof config.password !== 'string') {
    return { success: false, message: 'Password must be a string if provided.' };
  }

  // ---- port validation ----
  const portNum = parseInt(config.port, 10);
  if (isNaN(portNum) || portNum <= 0 || portNum > 65535) {
    return { success: false, message: 'Invalid port number (1‑65535).' };
  }

  // ---- simulate latency ----
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Optional: simple heuristic to mimic a failing host (useful for testing)
  const lowerHost = config.host.toLowerCase();
  if (lowerHost.includes('fail') || lowerHost.includes('invalid')) {
    return {
      success: false,
      message: `Could not connect to ${config.host}:${config.port}. Connection refused.`,
    };
  }

  return {
    success: true,
    message: `Successfully connected to PostgreSQL at ${config.host}:${config.port}/${config.database}`,
  };
}

/**
 * Synchronize timer data to PostgreSQL.
 * Returns a uniform result object containing success flag, a message, and a timestamp.
 */
export async function syncTimersToPostgres(
  config: PostgresConfig,
  timers: any[]
): Promise<{ success: boolean; message: string; timestamp: string }> {
  const now = new Date().toLocaleString();

  // ---- sync must be enabled ----
  if (!config.enabled) {
    return {
      success: false,
      message: 'PostgreSQL sync is disabled in settings.',
      timestamp: now,
    };
  }

  // ---- validate required connection info (same checks as testPostgresConnection) ----
  if (!config.host.trim()) {
    return {
      success: false,
      message: 'Host is required for synchronization.',
      timestamp: now,
    };
  }
  if (!config.database.trim()) {
    return {
      success: false,
      message: 'Database name is required for synchronization.',
      timestamp: now,
    };
  }
  if (!config.username.trim()) {
    return {
      success: false,
      message: 'Username is required for synchronization.',
      timestamp: now,
    };
  }
  const portNum = parseInt(config.port, 10);
  if (isNaN(portNum) || portNum <= 0 || portNum > 65535) {
    return {
      success: false,
      message: 'Invalid port number (1‑65535) for synchronization.',
      timestamp: now,
    };
  }

  // ---- simulate a lightweight connection check (reuse test logic) ----
  const testResult = await testPostgresConnection(config);
  if (!testResult.success) {
    return {
      success: false,
      message: testResult.message,
      timestamp: now,
    };
  }

  // ---- simulate payload transfer delay ----
  await new Promise((resolve) => setTimeout(resolve, 800));

  return {
    success: true,
    message: `Synced ${timers.length} timer(s) to database successfully.`,
    timestamp: now,
  };
}
