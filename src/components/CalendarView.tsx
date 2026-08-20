import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useTimerContext } from '../context/TimerContext';
import { ScheduleTimerModal } from './ScheduleTimerModal';
import { TimerInstance } from '../types/timer';

export const CalendarView: React.FC = () => {
  const { state, dispatch } = useTimerContext();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  // Generate marked dates for the calendar
  const markedDates = useMemo(() => {
    const marks: {
      [key: string]: {
        dots?: { key: string; color: string }[];
        selected?: boolean;
        selectedColor?: string;
      };
    } = {};

    state.timers.forEach((timer) => {
      // Check scheduledFor
      if (timer.scheduledFor) {
        const dateStr = timer.scheduledFor.split('T')[0];
        if (!marks[dateStr]) {
          marks[dateStr] = { dots: [] };
        }
        const hasScheduledDot = marks[dateStr].dots?.some(
          (d) => d.key === 'scheduled'
        );
        if (!hasScheduledDot) {
          marks[dateStr].dots = [
            ...(marks[dateStr].dots || []),
            { key: 'scheduled', color: '#6366f1' }, // Indigo for scheduled
          ];
        }
      }

      // Check completedAt
      if (timer.completedAt) {
        const dateStr = timer.completedAt.split('T')[0];
        if (!marks[dateStr]) {
          marks[dateStr] = { dots: [] };
        }
        const hasCompletedDot = marks[dateStr].dots?.some(
          (d) => d.key === 'completed'
        );
        if (!hasCompletedDot) {
          marks[dateStr].dots = [
            ...(marks[dateStr].dots || []),
            { key: 'completed', color: '#10b981' }, // Emerald for completed
          ];
        }
      }
    });

    // Highlight selected date
    if (marks[selectedDate]) {
      marks[selectedDate].selected = true;
      marks[selectedDate].selectedColor = '#4f46e5';
    } else {
      marks[selectedDate] = {
        selected: true,
        selectedColor: '#4f46e5',
      };
    }

    return marks;
  }, [state.timers, selectedDate]);

  // Filter timers for the selected date
  const timersForSelectedDate = useMemo(() => {
    return state.timers.filter((timer) => {
      const scheduledMatch =
        timer.scheduledFor && timer.scheduledFor.startsWith(selectedDate);
      const completedMatch =
        timer.completedAt && timer.completedAt.startsWith(selectedDate);
      return scheduledMatch || completedMatch;
    });
  }, [state.timers, selectedDate]);

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const handleToggleComplete = (timer: TimerInstance) => {
    const isCompleted = timer.status === 'COMPLETED';
    dispatch({
      type: 'UPDATE_TIMER_STATUS',
      id: timer.id,
      status: isCompleted ? 'IDLE' : 'COMPLETED',
      completedAt: isCompleted ? null : new Date().toISOString(),
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Timer Calendar</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Ionicons name="add" size={20} color="#ffffff" />
          <Text style={styles.addButtonText}>Schedule</Text>
        </TouchableOpacity>
      </View>

      <Calendar
        style={styles.calendar}
        theme={{
          backgroundColor: '#1e1b4b',
          calendarBackground: '#1e1b4b',
          textSectionTitleColor: '#a5b4fc',
          selectedDayBackgroundColor: '#4f46e5',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#818cf8',
          dayTextColor: '#e0e7ff',
          textDisabledColor: '#4338ca',
          dotColor: '#6366f1',
          selectedDotColor: '#ffffff',
          arrowColor: '#818cf8',
          monthTextColor: '#ffffff',
          indicatorColor: '#ffffff',
        }}
        markedDates={markedDates}
        markingType={'multi-dot'}
        onDayPress={handleDayPress}
      />

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#6366f1' }]} />
          <Text style={styles.legendText}>Scheduled</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
          <Text style={styles.legendText}>Completed</Text>
        </View>
      </View>

      <View style={styles.agendaContainer}>
        <Text style={styles.agendaTitle}>
          Timers for {selectedDate}
        </Text>
        <ScrollView contentContainerStyle={styles.agendaList}>
          {timersForSelectedDate.length === 0 ? (
            <Text style={styles.emptyText}>No timers scheduled or completed on this date.</Text>
          ) : (
            timersForSelectedDate.map((timer) => {
              const isCompleted = timer.status === 'COMPLETED';
              return (
                <View key={timer.id} style={styles.timerCard}>
                  <View style={styles.timerInfo}>
                    <Text style={styles.timerName}>{timer.name}</Text>
                    <Text style={styles.timerDetails}>
                      Duration: {Math.floor(timer.initialDuration / 60)}m {timer.initialDuration % 60}s
                    </Text>
                    {timer.notes ? (
                      <Text style={styles.timerNotes} numberOfLines={2}>
                        {timer.notes}
                      </Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      isCompleted ? styles.completedButton : styles.scheduledButton,
                    ]}
                    onPress={() => handleToggleComplete(timer)}
                  >
                    <Ionicons
                      name={isCompleted ? 'checkmark-circle' : 'time-outline'}
                      size={20}
                      color="#ffffff"
                    />
                    <Text style={styles.statusButtonText}>
                      {isCompleted ? 'Done' : 'Pending'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>

      <ScheduleTimerModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        initialDate={selectedDate}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1e1b4b',
    borderBottomWidth: 1,
    borderBottomColor: '#312e81',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#4f46e5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 14,
  },
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: '#312e81',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#1e1b4b',
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  agendaContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  agendaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 12,
  },
  agendaList: {
    paddingBottom: 24,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 24,
    fontSize: 14,
  },
  timerCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  timerInfo: {
    flex: 1,
  },
  timerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  timerDetails: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  timerNotes: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  scheduledButton: {
    backgroundColor: '#6366f1',
  },
  completedButton: {
    backgroundColor: '#10b981',
  },
  statusButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
});
