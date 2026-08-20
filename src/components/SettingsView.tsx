import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTimerContext } from '../context/TimerContext';
import {
  AppSettings,
  DEFAULT_SETTINGS,
  loadAppSettings,
  saveAppSettings,
  testPostgresConnection,
  syncTimersToPostgres,
} from '../config/appConfig';

export const SettingsView: React.FC = () => {
  const { state } = useTimerContext();
  const timers = state.timers;
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);
  const [testing, setTesting] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load initial settings on mount
  useEffect(() => {
    loadAppSettings().then((loaded) => {
      setSettings(loaded);
      setLoading(false);
    });
  }, []);

  // Generic helper to update settings and persist
  const updateSettings = async (updater: (prev: AppSettings) => AppSettings) => {
    try {
      const next = updater(settings);
      setSettings(next);
      await saveAppSettings(next);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testPostgresConnection(settings.postgres);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'An unknown error occurred' });
    } finally {
      setTesting(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const res = await syncTimersToPostgres(settings.postgres, timers);
      await updateSettings((prev) => ({
        ...prev,
        lastSyncedAt: res.success ? res.timestamp : prev.lastSyncedAt,
        syncError: res.success ? null : res.message,
      }));
      if (Platform.OS === 'web') {
        window.alert(res.message);
      } else {
        Alert.alert(res.success ? 'Sync Successful' : 'Sync Failed', res.message);
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Sync failed unexpectedly';
      await updateSettings((prev) => ({
        ...prev,
        syncError: errMsg,
      }));
      if (Platform.OS === 'web') {
        window.alert(errMsg);
      } else {
        Alert.alert('Sync Failed', errMsg);
      }
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.headerTitle}>Settings</Text>

      {/* LOCAL STORAGE SECTION */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="folder-outline" size={20} color="#3B82F6" />
          <Text style={styles.sectionTitle}>Local Storage</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>SQLite Database Location</Text>
          <TextInput
            style={styles.input}
            placeholder="timers_database.db"
            placeholderTextColor="#64748b"
            value={settings.storage.sqliteLocation}
            onChangeText={(val) =>
              updateSettings((p) => ({ ...p, storage: { ...p.storage, sqliteLocation: val } }))
            }
            autoCapitalize="none"
          />
          <Text style={styles.subLabel}>
            File path for the local SQLite database. Changes take effect on restart.
          </Text>
        </View>
      </View>

      {/* STORAGE BACKEND SECTION */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="server-outline" size={20} color="#3B82F6" />
          <Text style={styles.sectionTitle}>Storage Backend</Text>
        </View>

        <View style={styles.rowBetween}>
          <View style={styles.rowLabelContainer}>
            <Text style={styles.label}>Enable PostgreSQL Sync</Text>
            <Text style={styles.subLabel}>Directly synchronize timers to a PostgreSQL DB</Text>
          </View>
          <Switch
            value={settings.postgres.enabled}
            onValueChange={async (val) => {
              await updateSettings((prev) => ({
                ...prev,
                postgres: { ...prev.postgres, enabled: val },
              }));
              if (val && settings.general.autoSync) {
                // Trigger an immediate auto sync if turning on
                syncTimersToPostgres(settings.postgres, timers).then((res) => {
                  updateSettings((p) => ({
                    ...p,
                    lastSyncedAt: res.success ? res.timestamp : p.lastSyncedAt,
                    syncError: res.success ? null : res.message,
                  }));
                });
              }
            }}
            trackColor={{ false: '#334155', true: '#3B82F6' }}
            thumbColor={settings.postgres.enabled ? '#ffffff' : '#94a3b8'}
          />
        </View>

        {settings.postgres.enabled && (
          <View style={styles.postgresForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Host</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. localhost or db.example.com"
                placeholderTextColor="#64748b"
                value={settings.postgres.host}
                onChangeText={(val) =>
                  updateSettings((p) => ({ ...p, postgres: { ...p.postgres, host: val } }))
                }
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Port</Text>
              <TextInput
                style={styles.input}
                placeholder="5432"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={settings.postgres.port}
                onChangeText={(val) =>
                  updateSettings((p) => ({ ...p, postgres: { ...p.postgres, port: val } }))
                }
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Database Name</Text>
              <TextInput
                style={styles.input}
                placeholder="multitimers"
                placeholderTextColor="#64748b"
                value={settings.postgres.database}
                onChangeText={(val) =>
                  updateSettings((p) => ({ ...p, postgres: { ...p.postgres, database: val } }))
                }
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="postgres"
                placeholderTextColor="#64748b"
                value={settings.postgres.username}
                onChangeText={(val) =>
                  updateSettings((p) => ({ ...p, postgres: { ...p.postgres, username: val } }))
                }
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#64748b"
                secureTextEntry
                value={settings.postgres.password}
                onChangeText={(val) =>
                  updateSettings((p) => ({ ...p, postgres: { ...p.postgres, password: val } }))
                }
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.testButton]}
                onPress={handleTestConnection}
                disabled={testing}
              >
                {testing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.buttonText}>Test Connection</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.syncButton]}
                onPress={handleSyncNow}
                disabled={syncing}
              >
                {syncing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.buttonText}>Sync Now</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {testResult && (
              <View
                style={[
                  styles.resultBox,
                  testResult.success ? styles.resultSuccess : styles.resultError,
                ]}
              >
                <Text style={styles.resultText}>{testResult.message}</Text>
              </View>
            )}

            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>
                Last Synced:{' '}
                <Text style={styles.statusValue}>{settings.lastSyncedAt || 'Never'}</Text>
              </Text>
              {settings.syncError && (
                <Text style={[styles.statusText, { color: '#ef4444', marginTop: 4 }]}>
                  Error: {settings.syncError}
                </Text>
              )}
            </View>
          </View>
        )}
      </View>

      {/* GENERAL SECTION */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="options-outline" size={20} color="#3B82F6" />
          <Text style={styles.sectionTitle}>General</Text>
        </View>

        <View style={styles.rowBetween}>
          <View style={styles.rowLabelContainer}>
            <Text style={styles.label}>Auto-sync</Text>
            <Text style={styles.subLabel}>Automatically sync changes to PostgreSQL</Text>
          </View>
          <Switch
            value={settings.general.autoSync}
            onValueChange={async (val) => {
              await updateSettings((p) => ({
                ...p,
                general: { ...p.general, autoSync: val },
              }));
              if (val && settings.postgres.enabled) {
                syncTimersToPostgres(settings.postgres, timers).then((res) => {
                  updateSettings((p) => ({
                    ...p,
                    lastSyncedAt: res.success ? res.timestamp : p.lastSyncedAt,
                    syncError: res.success ? null : res.message,
                  }));
                });
              }
            }}
            trackColor={{ false: '#334155', true: '#3B82F6' }}
            thumbColor={settings.general.autoSync ? '#ffffff' : '#94a3b8'}
          />
        </View>

        <View style={[styles.rowBetween, { marginTop: 16 }]}>
          <View style={styles.rowLabelContainer}>
            <Text style={styles.label}>Timer Sound</Text>
            <Text style={styles.subLabel}>Play alert sound when a timer finishes</Text>
          </View>
          <Switch
            value={settings.general.playSound}
            onValueChange={(val) =>
              updateSettings((p) => ({
                ...p,
                general: { ...p.general, playSound: val },
              }))
            }
            trackColor={{ false: '#334155', true: '#3B82F6' }}
            thumbColor={settings.general.playSound ? '#ffffff' : '#94a3b8'}
          />
        </View>

        <View style={[styles.rowBetween, { marginTop: 16 }]}>
          <View style={styles.rowLabelContainer}>
            <Text style={styles.label}>Notifications</Text>
            <Text style={styles.subLabel}>Push notifications for active timers</Text>
          </View>
          <Switch
            value={settings.general.notificationsEnabled}
            onValueChange={(val) =>
              updateSettings((p) => ({
                ...p,
                general: { ...p.general, notificationsEnabled: val },
              }))
            }
            trackColor={{ false: '#334155', true: '#3B82F6' }}
            thumbColor={settings.general.notificationsEnabled ? '#ffffff' : '#94a3b8'}
          />
        </View>
      </View>

      {/* HELP SECTION */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="help-circle-outline" size={20} color="#3B82F6" />
          <Text style={styles.sectionTitle}>Help & Instructions</Text>
        </View>

        <Text style={styles.helpHeading}>Timer App Usage</Text>
        <Text style={styles.helpText}>
          • Create multiple countdowns or stopwatches from the Timers tab.{'\n'}
          • Group timers using tags to manage workouts, cooking recipes, or focus sessions easily.{'\n'}
          • Use bulk controls to start, pause, or reset all visible timers simultaneously.
        </Text>

        <Text style={[styles.helpHeading, { marginTop: 16 }]}>PostgreSQL Setup</Text>
        <Text style={styles.helpText}>
          • Ensure your PostgreSQL server accepts remote TCP/IP connections if running externally.{'\n'}
          • Create a target database (e.g., multitimers) and grant appropriate read/write privileges to your username.{'\n'}
          • If connection fails, verify firewall configurations, port forwarding, and credentials.
        </Text>
      </View>

      {/* ABOUT SECTION */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
          <Text style={styles.sectionTitle}>About</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.label}>Application</Text>
          <Text style={styles.aboutValue}>Multi-Timer Pro</Text>
        </View>
        <View style={[styles.aboutRow, { marginTop: 8 }]}>
          <Text style={styles.label}>Version</Text>
          <Text style={styles.aboutValue}>1.0.0 (Build 104)</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e2e8f0',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e2e8f0',
    marginLeft: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#e2e8f0',
  },
  subLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  postgresForm: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    color: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  testButton: {
    backgroundColor: '#6366f1',
  },
  syncButton: {
    backgroundColor: '#3B82F6',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  resultBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  resultSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  resultError: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  resultText: {
    color: '#e2e8f0',
    fontSize: 13,
  },
  statusContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  statusText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  statusValue: {
    color: '#e2e8f0',
    fontWeight: '500',
  },
  helpHeading: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 6,
  },
  helpText: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 20,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aboutValue: {
    fontSize: 15,
    color: '#94a3b8',
  },
});
