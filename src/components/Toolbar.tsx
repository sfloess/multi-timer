import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTimerContext } from '../context/TimerContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const Toolbar: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useTimerContext();

  const totalTimers = state.timers.length;
  const selectedTimers = state.timers.filter((t) => t.isSelected);
  const selectedCount = selectedTimers.length;
  const runningCount = state.timers.filter((t) => t.status === 'RUNNING').length;

  const confirmAction = (title: string, message: string, onConfirm: () => void) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) {
        onConfirm();
      }
    } else {
      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onConfirm },
      ]);
    }
  };

  const handleAddTimer = () => {
    dispatch({ type: 'ADD_TIMER' });
  };

  const handleDeleteSelected = () => {
    if (selectedCount === 0) return;
    confirmAction(
      'Delete Selected Timers',
      `Are you sure you want to delete the ${selectedCount} selected timer(s)?`,
      () => {
        dispatch({ type: 'DELETE_TIMERS' });
      }
    );
  };

  const handleClearAll = () => {
    if (totalTimers === 0) return;
    confirmAction(
      'Clear All Timers',
      'Are you sure you want to delete all timers from your list? This cannot be undone.',
      () => {
        dispatch({ type: 'CLEAR_ALL' });
      }
    );
  };

  return (
    <View style={[styles.safeAreaWrapper, { paddingTop: insets.top }]}>
      <View style={styles.container}>
        {/* Top Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="hourglass" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.appTitle}>MultiTimer</Text>
              <Text style={styles.appSubtitle}>
                {totalTimers} {totalTimers === 1 ? 'timer' : 'timers'} total
                {runningCount > 0 && ` • ${runningCount} active`}
              </Text>
            </View>
          </View>

          {/* Quick Clear All Button */}
          {totalTimers > 0 && (
            <TouchableOpacity
              style={styles.clearAllButton}
              onPress={handleClearAll}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Action Controls Row */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddTimer}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Timer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.deleteButton,
              selectedCount === 0 && styles.disabledButton,
            ]}
            onPress={handleDeleteSelected}
            disabled={selectedCount === 0}
            activeOpacity={0.8}
          >
            <Ionicons
              name="trash"
              size={18}
              color={selectedCount > 0 ? '#EF4444' : '#94A3B8'}
            />
            <Text
              style={[
                styles.deleteButtonText,
                selectedCount > 0 ? styles.deleteActiveText : styles.deleteDisabledText,
              ]}
            >
              Delete Selected {selectedCount > 0 ? `(${selectedCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeAreaWrapper: {
    backgroundColor: '#0F172A', // Dark Slate Blue Theme
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
      },
    }),
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 1,
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  clearAllText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  addButton: {
    flex: 1,
    height: 44,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 6px rgba(59, 130, 246, 0.2)',
        cursor: 'pointer',
      },
    }),
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  deleteButton: {
    flex: 1.2,
    height: 44,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  disabledButton: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    opacity: 0.5,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  deleteActiveText: {
    color: '#EF4444',
  },
  deleteDisabledText: {
    color: '#64748B',
  },
  clearButton: {
    backgroundColor: '#F1F5F9',
  },
  clearButtonText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
});
