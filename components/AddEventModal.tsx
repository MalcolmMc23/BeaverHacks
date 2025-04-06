import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Switch,
  TouchableOpacity,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import { Colors } from '@/constants/Colors';

type ImportanceLevel = 'low' | 'medium' | 'high' | 'urgent';

type AddEventModalProps = {
  onCancel: () => void;
  onAdd: (event: {
    title: string;
    location: string;
    isAllDay: boolean;
    startDate: Date;
    endDate: Date;
    description?: string;
    alert?: string;
    showAs?: string;
    importance: ImportanceLevel;
  }) => void;
};

export function AddEventModal({ onCancel, onAdd }: AddEventModalProps) {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 60 * 60 * 1000)); // 1 hour later
  const [description, setDescription] = useState('');
  const [alert, setAlert] = useState('None');
  const [showAs, setShowAs] = useState('Busy');
  const [importance, setImportance] = useState<ImportanceLevel>('low');
  const [showImportanceModal, setShowImportanceModal] = useState(false);

  const importanceLevels: ImportanceLevel[] = ['low', 'medium', 'high', 'urgent'];

  const handleAdd = () => {
    if (!title.trim()) return;
    
    onAdd({
      title,
      location,
      isAllDay,
      startDate,
      endDate,
      description,
      alert,
      showAs,
      importance,
    });
  };

  const renderImportanceOption = (level: ImportanceLevel) => (
    <TouchableOpacity
      key={level}
      style={styles.importanceOption}
      onPress={() => {
        setImportance(level);
        setShowImportanceModal(false);
      }}
    >
      <View style={styles.importanceRow}>
        <View style={[styles.importanceColor, { backgroundColor: Colors.light.importance[level] }]} />
        <ThemedText style={styles.importanceText}>
          {level.charAt(0).toUpperCase() + level.slice(1)}
        </ThemedText>
      </View>
      {importance === level && (
        <IconSymbol name="checkmark" size={20} color={Colors.light.tint} />
      )}
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel}>
          <ThemedText style={styles.cancelButton}>Cancel</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>New</ThemedText>
        <TouchableOpacity onPress={handleAdd}>
          <ThemedText style={[styles.addButton, title.trim() ? styles.addButtonEnabled : null]}>
            Add
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form}>
        <View style={styles.inputGroup}>
          <TextInput
            style={styles.titleInput}
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={Colors.light.icon}
          />
          <TextInput
            style={styles.locationInput}
            placeholder="Location or Video Call"
            value={location}
            onChangeText={setLocation}
            placeholderTextColor={Colors.light.icon}
          />
        </View>

        <View style={styles.timeGroup}>
          <View style={styles.switchRow}>
            <ThemedText style={styles.label}>All-day</ThemedText>
            <Switch 
              value={isAllDay} 
              onValueChange={setIsAllDay}
              trackColor={{ false: Colors.light.icon, true: Colors.light.tint }}
              thumbColor={Colors.light.background}
              ios_backgroundColor={Colors.light.icon}
            />
          </View>
          
          <View style={styles.dateRow}>
            <ThemedText style={styles.dateLabel}>Starts</ThemedText>
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={startDate}
                mode={isAllDay ? "date" : "datetime"}
                is24Hour={false}
                onChange={(event, date) => date && setStartDate(date)}
                textColor={Colors.light.text}
              />
            </View>
          </View>

          <View style={styles.dateRow}>
            <ThemedText style={styles.dateLabel}>Ends</ThemedText>
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={endDate}
                mode={isAllDay ? "date" : "datetime"}
                is24Hour={false}
                onChange={(event, date) => date && setEndDate(date)}
                textColor={Colors.light.text}
              />
            </View>
          </View>
        </View>

        <View style={styles.optionsGroup}>
          <TouchableOpacity style={styles.optionRow}>
            <ThemedText style={styles.label}>Push Notification</ThemedText>
            <View style={styles.optionValue}>
              <ThemedText style={styles.optionValueText}>{alert}</ThemedText>
              <IconSymbol name="chevron.right" size={20} color={Colors.light.icon} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow}>
            <ThemedText style={styles.label}>Show As</ThemedText>
            <View style={styles.optionValue}>
              <ThemedText style={styles.optionValueText}>{showAs}</ThemedText>
              <IconSymbol name="chevron.right" size={20} color={Colors.light.icon} />
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.importanceGroup}
          onPress={() => setShowImportanceModal(true)}
        >
          <View style={styles.importanceHeader}>
            <ThemedText style={styles.label}>Importance</ThemedText>
            <View style={styles.importanceValue}>
              <View style={[styles.importanceColor, { backgroundColor: Colors.light.importance[importance] }]} />
              <ThemedText style={styles.importanceValueText}>
                {importance.charAt(0).toUpperCase() + importance.slice(1)}
              </ThemedText>
              <IconSymbol name="chevron.right" size={20} color={Colors.light.icon} />
            </View>
          </View>
        </TouchableOpacity>

        <TextInput
          style={styles.descriptionInput}
          placeholder="URL"
          value={description}
          onChangeText={setDescription}
          placeholderTextColor={Colors.light.icon}
          multiline
        />
      </ScrollView>

      <Modal
        visible={showImportanceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImportanceModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowImportanceModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Importance</ThemedText>
            </View>
            {importanceLevels.map(renderImportanceOption)}
          </View>
        </TouchableOpacity>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    backgroundColor: Colors.light.background,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.light.text,
  },
  cancelButton: {
    fontSize: 17,
    color: Colors.light.tint,
  },
  addButton: {
    fontSize: 17,
    color: Colors.light.tint,
    opacity: 0.5,
  },
  addButtonEnabled: {
    opacity: 1,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.icon,
  },
  titleInput: {
    height: 44,
    paddingHorizontal: 16,
    fontSize: 17,
    color: Colors.light.text,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.icon,
  },
  locationInput: {
    height: 44,
    paddingHorizontal: 16,
    fontSize: 17,
    color: Colors.light.text,
  },
  timeGroup: {
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.icon,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateLabel: {
    width: 80,
    color: Colors.light.text,
  },
  label: {
    color: Colors.light.text,
    fontSize: 17,
  },
  datePickerContainer: {
    flex: 1,
  },
  optionsGroup: {
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.icon,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.icon,
  },
  optionValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionValueText: {
    marginRight: 8,
    color: Colors.light.icon,
  },
  importanceGroup: {
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.icon,
  },
  importanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  importanceValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  importanceValueText: {
    marginHorizontal: 8,
    color: Colors.light.icon,
    fontSize: 17,
  },
  importanceColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.icon,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    color: Colors.light.text,
  },
  importanceOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.icon,
  },
  importanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  importanceText: {
    marginLeft: 12,
    fontSize: 17,
    color: Colors.light.text,
  },
  descriptionInput: {
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    minHeight: 100,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.icon,
  },
}); 