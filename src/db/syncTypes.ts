export interface PostgresConfig {
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  apiEndpoint: string;
}

export interface SyncResult {
  success: boolean;
  message: string;
  timestamp: string;
  syncedCount: number;
}

export interface SyncStatus {
  lastSyncedAt: string | null;
  pendingChanges: number;
  syncErrors: string[];
  isOnline: boolean;
}

