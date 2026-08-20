import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTimerContext } from '../context/TimerContext';

interface CalendarViewProps {
  onSelectDate?: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onSelectDate }) => {
  const { state } = useTimerContext();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11

  // Days in month & first day index
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Find timers scheduled for a specific date (YYYY-MM-DD)
  const getTimersForDate = (dateStr: string) => {
    return state.timers.filter((t) => {
      if (!t.scheduledFor) return false;
      const tDate = t.scheduledFor.split('T')[0];
      return tDate === dateStr;
    });
  };

  // Build calendar grid cells
  const calendarCells = [];
  
  // Empty slots for previous month padding
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(<View key={`empty-${i}`} style={styles.emptyCell} />);
  }

  // Days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${year}-${pad(month + 1)}-pad(day)`.replace('pad(day)', pad(day));
    
    const today = new Date();
    const isToday =
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();

    const scheduledTimers = getTimersForDate(dateStr);
    const hasTimers = scheduledTimers.length > 0;

    calendarCells.push(
      <TouchableOpacity
        key={`day-${day}`}
        style={[styles.dayCell, isToday && styles.todayCell]}
        onPress={() => onSelectDate?.(dateStr)}
      >
        <Text style={[styles.dayText, isToday && styles.todayText]}>
          {day}
        </Text>
        {hasTimers && (
          <View style={styles.timerIndicatorContainer}>
            {scheduledTimers.slice(0, 2).map((t, idx) => (
              <View key={idx} style={styles.timerDot} />
            ))}
            {scheduledTimers.length > 2 && (
              <Text style={styles.moreCount}>+{scheduledTimers.length - 2}</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Month Navigation Header */}
      <View style={styles.headerRow}>
        <Text style={styles.monthTitle}>
          {monthNames[month]} {year}
        </Text>
        <View style={styles.navButtons}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
            <Ionicons name="chevron-back" size={20} color="#E2E8F0" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={20} color="#E2E8F0" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Weekday Labels */}
      <View style={styles.weekdaysRow}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((wd) => (
          <Text key={wd} style={styles.weekdayText}>
            {wd}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.grid}>{calendarCells}</View>

      {/* Instructions / Summary */}
      <View style={styles.footerInfo}>
        <Ionicons name="information-circle-outline" size={18} color="#3B82F6" />
        <Text style={styles.footerText}>
          Tap any date to schedule a new timer or view scheduled tasks.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  navButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    padding: 8,
    backgroundColor: '#334155',
    borderRadius: 8,
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 4,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderRadius: 8,
    marginVertical: 2,
  },
  todayCell: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E2E8F0',
    marginTop: 4,
  },
  todayText: {
    color: '#3B82F6',
  },
  timerIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  timerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  moreCount: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '700',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    gap: 10,
  },
  footerText: {
    flex: 1,
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
