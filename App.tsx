import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  useWindowDimensions,
  Platform,
  AppState,
  AppStateStatus,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';

import { TimerProvider, useTimerContext } from './src/context/TimerContext';
import { Toolbar } from './src/components/Toolbar';
import { TimerPane } from './src/components/TimerPane';
import { CalendarView } from './src/components/CalendarView';
import { SettingsView } from './src/components/SettingsView';
import { NotesJournalView } from './src/components/NotesJournalView';

// Configure notification behavior for when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function MainAppContent() {
  const { state } = useTimerContext();
  const { width } = useWindowDimensions();
  const [, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [activeTab, setActiveTab] = useState<'timers' | 'calendar' | 'notes' | 'settings'>('timers');

  // Sync state on foregrounding to instantly recalculate backgrounded countdowns
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      setAppState(nextAppState);
    });
    return () => {
      subscription.remove();
    };
  }, []);

  // Request notification permissions on native platforms on mount
  useEffect(() => {
    async function requestPermissions() {
      if (Platform.OS !== 'web') {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          console.log('Permission for native notifications was not granted.');
        }
      }
    }
    requestPermissions();
  }, []);

  // Set up notification response listener
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      // Logic for handling user interaction with notifications can be added here
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Responsive grid configuration based on screen width
  const getGridConfig = () => {
    if (width > 1024) {
      return { columns: 3, padding: 24, gap: 20 };
    } else if (width > 640) {
      return { columns: 2, padding: 20, gap: 16 };
    } else {
      return { columns: 1, padding: 16, gap: 16 };
    }
  };

  const { columns, padding, gap } = getGridConfig();
  const containerWidth = width - padding * 2;
  const itemWidth = (containerWidth - (columns - 1) * gap) / columns;

  return (
    <View style={styles.appContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Main Content Area */}
      <View style={styles.contentContainer}>
        {activeTab === 'timers' ? (
          <>
            {/* Global Action Toolbar */}
            <Toolbar />

            {state.timers.length === 0 ? (
              /* Empty State Screen */
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="hourglass-outline" size={48} color="#94A3B8" />
                </View>
                <Text style={styles.emptyTitle}>No Active Timers</Text>
                <Text style={styles.emptySubtitle}>
                  Tap "Add Timer" above to spin up a new high-precision countdown tracker.
                </Text>
              </View>
            ) : (
              /* Responsive Scrollable Grid */
              <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={[
                  styles.scrollContent,
                  { paddingHorizontal: padding, paddingTop: padding, paddingBottom: padding + 40 },
                ]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={[styles.gridContainer, { gap }]}>
                  {state.timers.map((timer) => (
                    <View
                      key={timer.id}
                      style={[
                        styles.gridItem,
                        { width: Platform.OS === 'web' ? (itemWidth as any) : itemWidth },
                      ]}
                    >
                      <TimerPane timer={timer} />
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </>
        ) : activeTab === 'calendar' ? (
          <CalendarView />
        ) : activeTab === 'notes' ? (
          <NotesJournalView />
        ) : (
          <SettingsView />
        )}
      </View>

      {/* Custom Bottom Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('timers')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="timer-outline"
            size={24}
            color={activeTab === 'timers' ? '#3B82F6' : '#64748B'}
          />
          <Text style={[styles.tabLabel, { color: activeTab === 'timers' ? '#3B82F6' : '#64748B' }]}>
            Timers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('calendar')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="calendar-outline"
            size={24}
            color={activeTab === 'calendar' ? '#3B82F6' : '#64748B'}
          />
          <Text style={[styles.tabLabel, { color: activeTab === 'calendar' ? '#3B82F6' : '#64748B' }]}>
            Calendar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('notes')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="document-text-outline"
            size={24}
            color={activeTab === 'notes' ? '#3B82F6' : '#64748B'}
          />
          <Text style={[styles.tabLabel, { color: activeTab === 'notes' ? '#3B82F6' : '#64748B' }]}>
            Notes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('settings')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="settings-outline"
            size={24}
            color={activeTab === 'settings' ? '#3B82F6' : '#64748B'}
          />
          <Text style={[styles.tabLabel, { color: activeTab === 'settings' ? '#3B82F6' : '#64748B' }]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <TimerProvider>
        <SafeAreaView style={styles.safeArea}>
          <MainAppContent />
        </SafeAreaView>
      </TimerProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    width: '100%',
  },
  gridItem: {
    // Width computed dynamically via useWindowDimensions
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 340,
  },
  tabBar: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
