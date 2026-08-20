import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  initialSeconds: number;
  onSave: (seconds: number) => void;
  timerName: string; // To display contextually in the modal header
}

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  onClose,
  initialSeconds,
  onSave,
  timerName,
}) => {
  const insets = useSafeAreaInsets();

  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);

  // Refs for scroll views to allow programmatic scrolling
  const hoursScrollRef = useRef<ScrollView | null>(null);
  const minutesScrollRef = useRef<ScrollView | null>(null);
  const secondsScrollRef = useRef<ScrollView | null>(null);

  // Helper to scroll to a specific item
  const scrollToItem = (ref: React.RefObject<ScrollView | null>, index: number, itemHeight: number) => {
    ref.current?.scrollTo({ y: index * itemHeight, animated: false });
  };

  // Synchronize state with initialSeconds prop when modal becomes visible or initialSeconds changes
  useEffect(() => {
    if (visible) {
      const hrs = Math.floor(initialSeconds / 3600);
      const mins = Math.floor((initialSeconds % 3600) / 60);
      const secs = initialSeconds % 60;
      setHours(hrs);
      setMinutes(mins);
      setSeconds(secs);

      // Programmatically scroll to the initial values after state update and layout
      const scrollDelay = setTimeout(() => {
        scrollToItem(hoursScrollRef, hrs, 40); // 40 is item height + margin (approx)
        scrollToItem(minutesScrollRef, mins, 40);
        scrollToItem(secondsScrollRef, secs, 40);
      }, 50); // Small delay to allow layout to render
      return () => clearTimeout(scrollDelay);
    }
  }, [initialSeconds, visible]);

  const handleSave = () => {
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    onSave(totalSeconds > 0 ? totalSeconds : 1); // Ensure minimum 1 second duration
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const applyPreset = (minutesPreset: number) => {
    const totalSecs = minutesPreset * 60;
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    setHours(hrs);
    setMinutes(mins);
    setSeconds(secs);
    scrollToItem(hoursScrollRef, hrs, 40);
    scrollToItem(minutesScrollRef, mins, 40);
    scrollToItem(secondsScrollRef, secs, 40);
  };

  const renderPickerColumn = (
    label: string,
    value: number,
    maxValue: number,
    onChange: (val: number) => void,
    scrollRef: React.RefObject<ScrollView | null>
  ) => {
    const items = Array.from({ length: maxValue + 1 }, (_, i) => i);
    const itemHeight = 40;

    return (
      <View style={styles.columnContainer}>
        <Text style={styles.columnLabel}>{label}</Text>
        <ScrollView
          ref={scrollRef}
          style={styles.pickerScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          decelerationRate="fast"
          snapToInterval={itemHeight}
          snapToAlignment="center"
          onMomentumScrollEnd={(event) => {
            const y = event.nativeEvent.contentOffset.y;
            const newIndex = Math.round(y / itemHeight);
            onChange(items[newIndex] !== undefined ? items[newIndex] : value);
          }}
        >
          <View style={{ height: 60 }} />
          {items.map((item) => {
            const isSelected = item === value;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.pickerItem, isSelected && styles.pickerItemSelected, { height: itemHeight }]}
                onPress={() => {
                  onChange(item);
                  scrollToItem(scrollRef, item, itemHeight);
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    isSelected && styles.pickerItemTextSelected,
                  ]}
                >
                  {String(item).padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    );
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleCancel}
    >
      <View style={styles.centeredView}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCancel}
        />
        <View style={[styles.modalView, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} numberOfLines={1}>
              Set Duration: {timerName}
            </Text>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <Ionicons name="close-circle-outline" size={28} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.pickersWrapper}>
            {renderPickerColumn('Hours', hours, 23, setHours, hoursScrollRef)}
            <Text style={styles.separatorColon}>:</Text>
            {renderPickerColumn('Mins', minutes, 59, setMinutes, minutesScrollRef)}
            <Text style={styles.separatorColon}>:</Text>
            {renderPickerColumn('Secs', seconds, 59, setSeconds, secondsScrollRef)}
          </View>

          <Text style={styles.sectionTitle}>Quick Presets</Text>
          <View style={styles.presetsContainer}>
            {[1, 5, 15, 30, 60].map((presetMins) => (
              <TouchableOpacity
                key={presetMins}
                style={styles.presetButton}
                onPress={() => applyPreset(presetMins)}
              >
                <Text style={styles.presetButtonText}>
                  {presetMins >= 60 ? `${presetMins / 60}h` : `${presetMins}m`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelActionButton]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelActionText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveActionButton]}
              onPress={handleSave}
            >
              <Text style={styles.saveActionText}>Set Timer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    padding: 20,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFill,
  },
  modalView: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
    marginRight: 12,
  },
  closeButton: {
    padding: 2,
  },
  pickersWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 160,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  columnContainer: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  columnLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerScroll: {
    height: 120,
  },
  scrollContent: {
    alignItems: 'center',
  },
  pickerItem: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
  },
  pickerItemText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#94A3B8',
  },
  pickerItemTextSelected: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  separatorColon: {
    fontSize: 24,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 20,
    marginHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 10,
  },
  presetsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelActionButton: {
    backgroundColor: '#F1F5F9',
  },
  cancelActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  saveActionButton: {
    backgroundColor: '#3B82F6',
  },
  saveActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
