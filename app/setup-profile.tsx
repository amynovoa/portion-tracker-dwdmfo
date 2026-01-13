
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { Sex, Goal, ActivityLevel } from '@/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';

type DropdownModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: any) => void;
  selectedValue: any;
  items: Array<{ label: string; value: any }>;
  title: string;
};

function DropdownModal({ visible, onClose, onSelect, selectedValue, items, title }: DropdownModalProps) {
  const handleSelect = (value: any) => {
    console.log('User selected:', value);
    onSelect(value);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.dropdownModalOverlay}>
        <TouchableOpacity 
          style={styles.dropdownModalBackdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View style={styles.dropdownModalContent}>
          <View style={styles.dropdownModalHeader}>
            <Text style={styles.dropdownModalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.dropdownModalCloseButton}>
              <IconSymbol 
                ios_icon_name="xmark" 
                android_material_icon_name="close" 
                size={24} 
                color={colors.text} 
              />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.dropdownModalScroll}>
            {items.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dropdownModalItem,
                  item.value === selectedValue && styles.dropdownModalItemSelected,
                ]}
                onPress={() => handleSelect(item.value)}
              >
                <Text
                  style={[
                    styles.dropdownModalItemText,
                    item.value === selectedValue && styles.dropdownModalItemTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
                {item.value === selectedValue && (
                  <IconSymbol 
                    ios_icon_name="checkmark" 
                    android_material_icon_name="check" 
                    size={24} 
                    color={colors.primary} 
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
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
    { label: 'Very Active - High daily activity', value: 'veryActive' as ActivityLevel },
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

  const handleGoalSelect = (value: Goal) => {
    console.log('User selected goal:', value);
    setGoal(value);
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
            onPress={() => {
              console.log('Opening sex picker with current value:', sex);
              setSexPickerVisible(true);
            }}
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
            onPress={() => {
              console.log('Opening goal picker with current value:', goal);
              setGoalPickerVisible(true);
            }}
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
            onPress={() => {
              console.log('Opening activity picker with current value:', activityLevel);
              setActivityPickerVisible(true);
            }}
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
              onPress={() => {
                console.log('Opening alcohol picker with current value:', alcoholGoal);
                setAlcoholPickerVisible(true);
              }}
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

      <DropdownModal
        visible={sexPickerVisible}
        onClose={() => setSexPickerVisible(false)}
        onSelect={setSex}
        selectedValue={sex}
        items={sexOptions}
        title="Select Sex"
      />

      <DropdownModal
        visible={goalPickerVisible}
        onClose={() => setGoalPickerVisible(false)}
        onSelect={handleGoalSelect}
        selectedValue={goal}
        items={goalOptions}
        title="Select Primary Goal"
      />

      <DropdownModal
        visible={activityPickerVisible}
        onClose={() => setActivityPickerVisible(false)}
        onSelect={setActivityLevel}
        selectedValue={activityLevel}
        items={activityOptions}
        title="Select Activity Level"
      />

      <DropdownModal
        visible={alcoholPickerVisible}
        onClose={() => setAlcoholPickerVisible(false)}
        onSelect={setAlcoholGoal}
        selectedValue={alcoholGoal}
        items={alcoholOptions}
        title="Daily Alcohol Goal"
      />

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
  // Dropdown Modal Styles
  dropdownModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dropdownModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dropdownModalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    width: '85%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  dropdownModalCloseButton: {
    padding: 4,
  },
  dropdownModalScroll: {
    maxHeight: 400,
  },
  dropdownModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownModalItemSelected: {
    backgroundColor: colors.primary + '15',
  },
  dropdownModalItemText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  dropdownModalItemTextSelected: {
    color: colors.primary,
    fontWeight: '600',
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
