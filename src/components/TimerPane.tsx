import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TimerInstance, TimerStatus } from '../types/timer';
import { useTimerContext } from '../context/TimerContext';
import { TimerDisplay } from './TimerDisplay';
import { TimePickerModal } from './TimePickerModal';
import { NotesModal } from './NotesModal';
import * as Notifications from 'expo-notifications';

interface TimerPaneProps {
  timer: TimerInstance;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export const TimerPane: React.FC<TimerPaneProps> = ({ timer }) => {
  const { dispatch } = useTimerContext();
  const [remainingTime, setRemainingTime] = useState<number>(timer.remainingTime);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [nameValue, setNameValue] = useState<string>(timer.name);
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState<boolean>(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setNameValue(timer.name);
  }, [timer.name]);

  useEffect(() => {
    setRemainingTime(timer.remainingTime);
  }, [timer.remainingTime]);

  // Handle active countdown ticking
  useEffect(() => {
    if (timer.status === 'RUNNING' && timer.targetTime) {
      const updateTimer = () => {
        const now = Date.now();
        const diff = Math.max(0, Math.ceil((timer.targetTime! - now) / 1000));
        setRemainingTime(diff);

        if (diff <= 0) {
          handleComplete();
        }
      };

      updateTimer();
      timerRef.current = setInterval(updateTimer, 200);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      if (timer.status === 'PAUSED' || timer.status === 'IDLE') {
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }
  }, [timer.status, timer.targetTime]);

  const playAlarmSound = async () => {
    // Use web Audio API for beep on web, notifications handle sound on native
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.frequency.value = 880;
        osc.connect(ctx.destination);
        osc.start();
        setTimeout(() => osc.stop(), 300);
      } catch {}
    }
  };

  const handleComplete = async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    dispatch({
      type: 'UPDATE_TIMER_STATUS',
      id: timer.id,
      status: 'COMPLETED',
      targetTime: null,
      remainingTime: 0,
      notificationId: null,
    });

    playAlarmSound();

    if (Platform.OS !== 'web') {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Timer Finished!`,
            body: `Your timer "${timer.name}" has completed.`,
            sound: true,
          },
          trigger: null,
        });
      } catch (e) {
        console.log('Notification error:', e);
      }
    }
  };

  const startTimer = async () => {
    const durationToUse = remainingTime > 0 ? remainingTime : timer.initialDuration;
    const targetTime = Date.now() + durationToUse * 1000;

    let notificationId: string | null = null;

    if (Platform.OS !== 'web') {
      try {
        const identifier = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Timer Complete',
            body: `Your timer "${timer.name}" is done!`,
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: durationToUse,
            repeats: false,
          },
        });
        notificationId = identifier;
      } catch (e) {
        console.log('Failed to schedule notification:', e);
      }
    }

    dispatch({
      type: 'UPDATE_TIMER_STATUS',
      id: timer.id,
      status: 'RUNNING',
      targetTime,
      notificationId,
      remainingTime: durationToUse,
    });
  };

  const pauseTimer = async () => {
    if (timer.notificationId && Platform.OS !== 'web') {
      try {
        await Notifications.cancelScheduledNotificationAsync(timer.notificationId);
      } catch (e) {
        console.log('Failed to cancel notification:', e);
      }
    }

    if (timerRef.current) clearInterval(timerRef.current);

    dispatch({
      type: 'UPDATE_TIMER_STATUS',
      id: timer.id,
      status: 'PAUSED',
      targetTime: null,
      notificationId: null,
      remainingTime,
    });
  };

  const resetTimer = async () => {
    if (timer.notificationId && Platform.OS !== 'web') {
      try {
        await Notifications.cancelScheduledNotificationAsync(timer.notificationId);
      } catch (e) {
        console.log('Failed to cancel notification:', e);
      }
    }

    if (timerRef.current) clearInterval(timerRef.current);
    setRemainingTime(timer.initialDuration);

    dispatch({
      type: 'UPDATE_TIMER_STATUS',
      id: timer.id,
      status: 'IDLE',
      targetTime: null,
      notificationId: null,
      remainingTime: timer.initialDuration,
    });
  };

  const handleDurationChange = (newSeconds: number) => {
    setRemainingTime(newSeconds);
    dispatch({
      type: 'UPDATE_TIMER_DURATION',
      id: timer.id,
      seconds: newSeconds,
    });
  };

  const handleNameSubmit = () => {
    setIsEditingName(false);
    if (nameValue.trim() !== '') {
      dispatch({
        type: 'UPDATE_TIMER_NAME',
        id: timer.id,
        name: nameValue.trim(),
      });
    } else {
      setNameValue(timer.name);
    }
  };

  return (
    <View style={[styles.card, timer.isSelected && styles.cardSelected]}>
      {/* Header Row */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => dispatch({ type: 'TOGGLE_SELECT_TIMER', id: timer.id })}
        >
          <Ionicons
            name={timer.isSelected ? 'checkbox' : 'square-outline'}
            size={22}
            color={timer.isSelected ? '#3B82F6' : '#94A3B8'}
          />
        </TouchableOpacity>

        {isEditingName ? (
          <TextInput
            style={styles.nameInput}
            value={nameValue}
            onChangeText={setNameValue}
            autoFocus
            onBlur={handleNameSubmit}
            onSubmitEditing={handleNameSubmit}
          />
        ) : (
          <TouchableOpacity
            style={styles.nameWrapper}
            onPress={() => setIsEditingName(true)}
          >
            <Text style={styles.nameText} numberOfLines={1}>
              {timer.name}
            </Text>
            <Ionicons name="pencil-outline" size={14} color="#64748B" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        )}

        <View style={styles.moveButtons}>
          <TouchableOpacity
            onPress={() => dispatch({ type: 'MOVE_TIMER', direction: 'UP', id: timer.id })}
            style={styles.moveBtn}
          >
            <Ionicons name="chevron-up" size={16} color="#64748B" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => dispatch({ type: 'MOVE_TIMER', direction: 'DOWN', id: timer.id })}
            style={styles.moveBtn}
          >
            <Ionicons name="chevron-down" size={16} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Display */}
      <TimerDisplay remainingTime={remainingTime} status={timer.status} />

      {/* Time Selector if Idle/Paused */}
      {timer.status !== 'RUNNING' && timer.status !== 'COMPLETED' && (
        <TouchableOpacity
          style={styles.durationBtn}
          onPress={() => setIsTimePickerOpen(true)}
        >
          <Ionicons name="time-outline" size={16} color="#1976D2" />
          <Text style={styles.durationBtnText}>
            {formatTime(remainingTime)}
          </Text>
        </TouchableOpacity>
      )}
      <TimePickerModal
        visible={isTimePickerOpen}
        initialSeconds={timer.initialDuration}
        timerName={timer.name}
        onSave={handleDurationChange}
        onClose={() => setIsTimePickerOpen(false)}
      />

      {/* Controls */}
      <View style={styles.controlsRow}>
        {timer.status === 'RUNNING' ? (
          <TouchableOpacity style={[styles.controlBtn, styles.pauseBtn]} onPress={pauseTimer}>
            <Ionicons name="pause" size={18} color="#FFFFFF" />
            <Text style={styles.controlBtnText}>Pause</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.controlBtn, styles.startBtn]} onPress={startTimer}>
            <Ionicons name="play" size={18} color="#FFFFFF" />
            <Text style={styles.controlBtnText}>
              {timer.status === 'PAUSED' ? 'Resume' : 'Start'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[styles.controlBtn, styles.resetBtn]} onPress={resetTimer}>
          <Ionicons name="refresh" size={18} color="#475569" />
          <Text style={[styles.controlBtnText, { color: '#475569' }]}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Footer / Notes trigger */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.notesButton}
          onPress={() => setIsNotesOpen(true)}
        >
          <Ionicons
            name={timer.notes ? 'document-text' : 'document-text-outline'}
            size={16}
            color={timer.notes ? '#3B82F6' : '#94A3B8'}
          />
          <Text
            style={[
              styles.notesButtonText,
              timer.notes ? styles.notesActiveText : null,
            ]}
          >
            {timer.notes ? 'View Notes' : 'Add Notes'}
          </Text>
        </TouchableOpacity>

        <View style={styles.statusBadge}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  timer.status === 'RUNNING'
                    ? '#10B981'
                    : timer.status === 'PAUSED'
                    ? '#F59E0B'
                    : timer.status === 'COMPLETED'
                    ? '#EF4444'
                    : '#94A3B8',
              },
            ]}
          />
          <Text style={styles.statusText}>{timer.status}</Text>
        </View>
      </View>

      <NotesModal
        visible={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        notes={timer.notes}
        onSave={(newNotes) => {
          dispatch({
            type: 'UPDATE_TIMER_NOTES',
            id: timer.id,
            notes: newNotes,
          });
        }}
        timerName={timer.name}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      },
    }),
  },
  cardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  checkboxContainer: {
    padding: 4,
  },
  nameWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flexShrink: 1,
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#3B82F6',
    marginHorizontal: 8,
    paddingVertical: 2,
  },
  moveButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moveBtn: {
    padding: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    marginLeft: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  controlBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  startBtn: {
    backgroundColor: '#10B981',
  },
  pauseBtn: {
    backgroundColor: '#F59E0B',
  },
  resetBtn: {
    backgroundColor: '#F1F5F9',
  },
  controlBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  notesButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notesButtonText: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 4,
  },
  notesActiveText: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  durationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  durationBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
  },
});
