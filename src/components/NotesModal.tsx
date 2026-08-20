import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface NotesModalProps {
  visible: boolean;
  onClose: () => void;
  notes: string;
  onSave: (newNotes: string) => void;
  timerName: string;
}

export const NotesModal: React.FC<NotesModalProps> = ({
  visible,
  onClose,
  notes,
  onSave,
  timerName,
}) => {
  const insets = useSafeAreaInsets();
  const [localNotes, setLocalNotes] = useState<string>(notes);
  const CHARACTER_LIMIT = 1000;

  // Sync internal state when modal opens or the external note prop updates
  useEffect(() => {
    if (visible) {
      setLocalNotes(notes || '');
    }
  }, [visible, notes]);

  const handleSave = () => {
    onSave(localNotes.trim());
    onClose();
  };

  const handleCancel = () => {
    setLocalNotes(notes);
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleCancel}
    >
      {/* Tap outside to dismiss keyboard or close */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          {/* Transparent touch layer to close modal on backdrop click */}
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={handleCancel} 
          />
          
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardContainer}
          >
            <View style={[
              styles.modalContainer, 
              { marginBottom: Math.max(insets.bottom, 20) }
            ]}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerTitleContainer}>
                  <Ionicons name="document-text-outline" size={22} color="#3B82F6" />
                  <Text style={styles.headerTitle} numberOfLines={1}>
                    Notes: {timerName}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleCancel} style={styles.closeIconButton}>
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Input Area */}
              <ScrollView 
                keyboardShouldPersistTaps="handled" 
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
              >
                <TextInput
                  style={styles.textInput}
                  multiline
                  placeholder="Add details, instructions, or steps..."
                  placeholderTextColor="#94A3B8"
                  value={localNotes}
                  onChangeText={setLocalNotes}
                  maxLength={CHARACTER_LIMIT}
                  textAlignVertical="top"
                  autoFocus={Platform.OS !== 'web'}
                />
                <Text style={styles.charCount}>
                  {localNotes.length} / {CHARACTER_LIMIT}
                </Text>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>Save Notes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)', // Deep slate overlay
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  keyboardContainer: {
    width: '100%',
    maxWidth: 500,
    justifyContent: 'center',
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 15px 35px -5px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 10,
    flex: 1,
  },
  closeIconButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  scrollContainer: {
    maxHeight: 300, // Prevent modal from growing too tall
  },
  scrollContent: {
    paddingBottom: 8,
  },
  textInput: {
    width: '100%',
    minHeight: 150,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#334155',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  charCount: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
