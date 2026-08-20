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
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';

import { TimerProvider, useTimerContext } from './src/context/TimerContext';
import { Toolbar } from './src/components/Toolbar';
import { TimerPane } from './src/components/TimerPane';

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
});
