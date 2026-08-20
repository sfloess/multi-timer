import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTimerContext } from "../context/TimerContext";

interface ScheduleTimerModalProps {
  visible: boolean;
  onClose: () => void;
  initialDate: string; // YYYY-MM-DD
}

export const ScheduleTimerModal: React.FC<ScheduleTimerModalProps> = ({
  visible,
  onClose,
  initialDate,
}) => {
  const { dispatch } = useTimerContext();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [schedHours, setSchedHours] = useState("");
  const [schedMinutes, setSchedMinutes] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (visible) {
      setName("");
      setHours("");
      setMinutes("");
      setSeconds("");
      setNotes("");
      
      const now = new Date();
      setSchedHours(String(now.getHours()).padStart(2, "0"));
      setSchedMinutes(String(now.getMinutes()).padStart(2, "0"));
    }
  }, [visible]);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert("Required Field", "Please enter a timer name.");
      return;
    }

    const h = parseInt(hours || "0", 10);
    const m = parseInt(minutes || "0", 10);
    const s = parseInt(seconds || "0", 10);
    const totalSeconds = h * 3600 + m * 60 + s;

    if (totalSeconds <= 0) {
      Alert.alert("Invalid Duration", "Duration must be greater than 0 seconds.");
      return;
    }

    const sh = parseInt(schedHours || "0", 10);
    const sm = parseInt(schedMinutes || "0", 10);

    if (isNaN(sh) || sh < 0 || sh > 23 || isNaN(sm) || sm < 0 || sm > 59) {
      Alert.alert("Invalid Time", "Please enter a valid schedule time (00:00 to 23:59).");
      return;
    }

    const pad = (num: number) => String(num).padStart(2, "0");
    const localDateTimeString = `${initialDate}T${pad(sh)}:${pad(sm)}:00`;
    const scheduledDate = new Date(localDateTimeString);

    if (isNaN(scheduledDate.getTime())) {
      Alert.alert("Invalid Date", "The selected schedule date/time is invalid.");
      return;
    }

    const isoString = scheduledDate.toISOString();

    dispatch({
      type: "SCHEDULE_NEW_TIMER",
      name: trimmedName,
      duration: totalSeconds,
      notes: notes.trim(),
      scheduledFor: isoString,
    });

    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardContainer}
        >
          <View
            style={[
              styles.modalContainer,
              { paddingBottom: Math.max(insets.bottom, 24) },
            ]}
          >
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Schedule Timer</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#e2e8f0" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Timer Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Afternoon Focus"
                  placeholderTextColor="#64748b"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Duration</Text>
                <View style={styles.durationRow}>
                  <View style={styles.durationInputWrapper}>
                    <TextInput
                      style={styles.durationInput}
                      placeholder="00"
                      placeholderTextColor="#64748b"
                      keyboardType="number-pad"
                      maxLength={2}
                      value={hours}
                      onChangeText={setHours}
                    />
                    <Text style={styles.durationLabel}>Hrs</Text>
                  </View>
                  <Text style={styles.colon}>:</Text>
                  <View style={styles.durationInputWrapper}>
                    <TextInput
                      style={styles.durationInput}
                      placeholder="00"
                      placeholderTextColor="#64748b"
                      keyboardType="number-pad"
                      maxLength={2}
                      value={minutes}
                      onChangeText={setMinutes}
                    />
                    <Text style={styles.durationLabel}>Mins</Text>
                  </View>
                  <Text style={styles.colon}>:</Text>
                  <View style={styles.durationInputWrapper}>
                    <TextInput
                      style={styles.durationInput}
                      placeholder="00"
                      placeholderTextColor="#64748b"
                      keyboardType="number-pad"
                      maxLength={2}
                      value={seconds}
                      onChangeText={setSeconds}
                    />
                    <Text style={styles.durationLabel}>Secs</Text>
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Schedule Date</Text>
                <View style={styles.dateDisplay}>
                  <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
                  <Text style={styles.dateText}>{initialDate}</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Schedule Time (HH:MM)</Text>
                <View style={styles.timeRow}>
                  <TextInput
                    style={styles.timeInput}
                    placeholder="HH"
                    placeholderTextColor="#64748b"
                    keyboardType="number-pad"
                    maxLength={2}
                    value={schedHours}
                    onChangeText={setSchedHours}
                  />
                  <Text style={styles.colon}>:</Text>
                  <TextInput
                    style={styles.timeInput}
                    placeholder="MM"
                    placeholderTextColor="#64748b"
                    keyboardType="number-pad"
                    maxLength={2}
                    value={schedMinutes}
                    onChangeText={setSchedMinutes}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Describe your schedule goal..."
                  placeholderTextColor="#64748b"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Schedule</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    justifyContent: "flex-end",
  },
  keyboardContainer: {
    maxHeight: "90%",
  },
  modalContainer: {
    backgroundColor: "#1e293b",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#e2e8f0",
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#0f172a",
    color: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  durationInputWrapper: {
    flex: 1,
    alignItems: "center",
  },
  durationInput: {
    backgroundColor: "#0f172a",
    color: "#e2e8f0",
    borderRadius: 12,
    paddingVertical: 12,
    width: "100%",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "#334155",
  },
  durationLabel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    fontWeight: "500",
  },
  colon: {
    color: "#e2e8f0",
    fontSize: 20,
    fontWeight: "bold",
    marginHorizontal: 8,
    alignSelf: "center",
    paddingBottom: 20,
  },
  dateDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f172a",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  dateText: {
    color: "#e2e8f0",
    fontSize: 16,
    marginLeft: 10,
    fontWeight: "500",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeInput: {
    backgroundColor: "#0f172a",
    color: "#e2e8f0",
    borderRadius: 12,
    width: 80,
    paddingVertical: 12,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "#334155",
  },
  saveButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});