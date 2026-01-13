
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { Sex, Goal, ActivityLevel } from '@/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';

type PickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: any) => void;
  selectedValue: any;
  items: Array<{ label: string; value: any }>;
  title: string;
};

function PickerModal({ visible, onClose, onSelect, selectedValue, items, title }: PickerModalProps) {
  const [tempValue, setTempValue] = useState(selectedValue);

  // Reset tempValue whenever the modal becomes visible or selectedValue changes
  useEffect(() => {
    if (visible) {
      setTempValue(selectedValue);
    }
  }, [visible, selectedValue]);

  const handleDone = () => {
    onSelect(tempValue);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.pickerModalOverlay}>
        <TouchableOpacity 
          style={styles.pickerModalBackdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View style={styles.pickerModalContent}>
          <View style={styles.pickerModalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.pickerModalButton}>
              <Text style={styles.pickerModalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.pickerModalTitle}>{title}</Text>
            <TouchableOpacity onPress={handleDone} style={styles.pickerModalButton}>
              <Text style={[styles.pickerModalButtonText, styles.pickerModalDoneButton]}>Done</Text>
            </TouchableOpacity>
          </View>
          <Picker
            selectedValue={tempValue}
            onValueChange={setTempValue}
            style={styles.pickerModalPicker}
          >
            {items.map((item, index) => (
              <Picker.Item key={index} label={item.label} value={item.value} />
            ))}
          </Picker>
        </View>
      </View>
    </Modal>
  );
}

export default function SetupProfileScreen() {
  const router = useRouter();
  const [sex, setSex] = useState<Sex>('female');
  const [weight, setWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [goal, setGoal] = useState<Goal>('maintain');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [includeAlcohol, setIncludeAlcohol] = useState(false);
  const [alcoholGoal, setAlcoholGoal] = useState(2);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Modal visibility states
  const [sexPickerVisible, setSexPickerVisible] = useState(false);
  const [goalPickerVisible, setGoalPickerVisible] = useState(false);
  const [activityPickerVisible, setActivityPickerVisible] = useState(false);
  const [alcoholPickerVisible, setAlcoholPickerVisible] = useState(false);

  const sexOptions = [
    { label: 'Female', value: 'female' as Sex },
    { label: 'Male', value: 'male' as Sex },
    { label: 'Prefer not to say', value: 'prefer-not-to-say' as Sex },
  ];

  const goalOptions = [
    { label: 'Lose Weight', value: 'lose' as Goal },
    { label: 'Maintain Weight', value: 'maintain' as Goal },
    { label: 'Build Muscle', value: 'build' as Goal },
  ];

  const activityOptions = [
    { label: 'Sedentary - Little to no exercise', value: 'sedentary' as ActivityLevel },
    { label: 'Light - 1-3x/week or 6k-9k steps/day', value: 'light' as ActivityLevel },
    { label: 'Moderate - 3-5x/week or 9k-12k steps/day', value: 'moderate' as ActivityLevel },
    { label: 'Active - Most days or 12k-15k+ steps/day', value: 'active' as ActivityLevel },
    { label: 'Very Active - High daily activity', value: 'very-active' as ActivityLevel },
  ];

  const alcoholOptions = [
    { label: '0 servings', value: 0 },
    { label: '1 serving', value: 1 },
    { label: '2 servings (recommended max)', value: 2 },
    { label: '3 servings', value: 3 },
    { label: '4 servings', value: 4 },
    { label: '5 servings', value: 5 },
    { label: '6 servings', value: 6 },
    { label: '7 servings', value: 7 },
    { label: '8 servings', value: 8 },
    { label: '9 servings', value: 9 },
    { label: '10 servings', value: 10 },
  ];

  const getSelectedLabel = (value: any, options: Array<{ label: string; value: any }>) => {
    const option = options.find(opt => opt.value === value);
    return option ? option.label : '';
  };

  const showError = (message: string) => {
    console.log('Showing error:', message);
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  const handleContinue = () => {
    console.log('Setup profile - Continue clicked');
    
    if (!weight || !goalWeight) {
      showError('Please enter your starting and goal weight');
      return;
    }

    const weightNum = parseFloat(weight);
    const goalWeightNum = parseFloat(goalWeight);

    if (isNaN(weightNum) || isNaN(goalWeightNum) || weightNum <= 0 || goalWeightNum <= 0) {
      showError('Please enter valid weight values');
      return;
    }

    console.log('Navigating to setup-targets with params:', {
      sex,
      weight: weightNum,
      goalWeight: goalWeightNum,
      goal,
      activityLevel,
      includeAlcohol,
      alcoholGoal: includeAlcohol ? alcoholGoal : 0,
    });

    router.push({
      pathname: '/setup-targets',
      params: {
        sex,
        weight: weight,
        goalWeight: goalWeight,
        goal,
        activityLevel,
        includeAlcohol: includeAlcohol.toString(),
        alcoholGoal: (includeAlcohol ? alcoholGoal : 0).toString(),
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Let&apos;s Set Up Your Profile</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Sex</Text>
          <TouchableOpacity 
            style={styles.selectButton}
            onPress={() => setSexPickerVisible(true)}
          >
            <Text style={styles.selectButtonText}>{getSelectedLabel(sex, sexOptions)}</Text>
            <IconSymbol 
              ios_icon_name="chevron.down" 
              android_material_icon_name="arrow-drop-down" 
              size={24} 
              color={colors.text} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Starting Weight (lbs)</Text>
          <Text style={styles.helperText}>This will be your baseline for tracking progress</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            placeholder="Enter starting weight"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Goal Weight (lbs)</Text>
          <TextInput
            style={styles.input}
            value={goalWeight}
            onChangeText={setGoalWeight}
            keyboardType="numeric"
            placeholder="Enter goal weight"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Primary Goal</Text>
          <TouchableOpacity 
            style={styles.selectButton}
            onPress={() => setGoalPickerVisible(true)}
          >
            <Text style={styles.selectButtonText}>{getSelectedLabel(goal, goalOptions)}</Text>
            <IconSymbol 
              ios_icon_name="chevron.down" 
              android_material_icon_name="arrow-drop-down" 
              size={24} 
              color={colors.text} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Activity Level</Text>
          <TouchableOpacity 
            style={styles.selectButton}
            onPress={() => setActivityPickerVisible(true)}
          >
            <Text style={styles.selectButtonText}>{getSelectedLabel(activityLevel, activityOptions)}</Text>
            <IconSymbol 
              ios_icon_name="chevron.down" 
              android_material_icon_name="arrow-drop-down" 
              size={24} 
              color={colors.text} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Include Alcohol Tracking?</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                !includeAlcohol && styles.toggleButtonActive,
              ]}
              onPress={() => setIncludeAlcohol(false)}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  !includeAlcohol && styles.toggleButtonTextActive,
                ]}
              >
                No
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                includeAlcohol && styles.toggleButtonActive,
              ]}
              onPress={() => setIncludeAlcohol(true)}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  includeAlcohol && styles.toggleButtonTextActive,
                ]}
              >
                Yes
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {includeAlcohol && (
          <View style={styles.section}>
            <Text style={styles.label}>Daily Alcohol Goal</Text>
            <Text style={styles.helperText}>Recommended maximum: 2 servings per day</Text>
            <TouchableOpacity 
              style={styles.selectButton}
              onPress={() => setAlcoholPickerVisible(true)}
            >
              <Text style={styles.selectButtonText}>{getSelectedLabel(alcoholGoal, alcoholOptions)}</Text>
              <IconSymbol 
                ios_icon_name="chevron.down" 
                android_material_icon_name="arrow-drop-down" 
                size={24} 
                color={colors.text} 
              />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={buttonStyles.primary} onPress={handleContinue}>
          <Text style={buttonStyles.primaryText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Picker Modals */}
      <PickerModal
        visible={sexPickerVisible}
        onClose={() => setSexPickerVisible(false)}
        onSelect={setSex}
        selectedValue={sex}
        items={sexOptions}
        title="Select Sex"
      />

      <PickerModal
        visible={goalPickerVisible}
        onClose={() => setGoalPickerVisible(false)}
        onSelect={setGoal}
        selectedValue={goal}
        items={goalOptions}
        title="Select Primary Goal"
      />

      <PickerModal
        visible={activityPickerVisible}
        onClose={() => setActivityPickerVisible(false)}
        onSelect={setActivityLevel}
        selectedValue={activityLevel}
        items={activityOptions}
        title="Select Activity Level"
      />

      <PickerModal
        visible={alcoholPickerVisible}
        onClose={() => setAlcoholPickerVisible(false)}
        onSelect={setAlcoholGoal}
        selectedValue={alcoholGoal}
        items={alcoholOptions}
        title="Daily Alcohol Goal"
      />

      {/* Error Modal */}
      <Modal
        visible={errorModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Oops!</Text>
            <Text style={styles.modalMessage}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setErrorModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 30,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  helperText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 54,
  },
  selectButtonText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
  // Picker Modal Styles
  pickerModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  pickerModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerModalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerModalButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 70,
  },
  pickerModalButtonText: {
    fontSize: 17,
    color: colors.primary,
  },
  pickerModalDoneButton: {
    fontWeight: '600',
  },
  pickerModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  pickerModalPicker: {
    width: '100%',
    height: 216,
  },
  // Error Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
