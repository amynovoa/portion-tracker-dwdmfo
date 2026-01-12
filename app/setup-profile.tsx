
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { Sex, Goal, ActivityLevel } from '@/types';
import { SafeAreaView } from 'react-native-safe-area-context';

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
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={sex}
              onValueChange={(value) => setSex(value)}
              style={styles.picker}
            >
              <Picker.Item label="Female" value="female" />
              <Picker.Item label="Male" value="male" />
              <Picker.Item label="Prefer not to say" value="prefer-not-to-say" />
            </Picker>
          </View>
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
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={goal}
              onValueChange={(value) => setGoal(value)}
              style={styles.picker}
            >
              <Picker.Item label="Lose Weight" value="lose" />
              <Picker.Item label="Maintain Weight" value="maintain" />
              <Picker.Item label="Build Muscle" value="build" />
            </Picker>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Activity Level</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={activityLevel}
              onValueChange={(value) => setActivityLevel(value)}
              style={styles.picker}
            >
              <Picker.Item label="Sedentary - Little to no exercise" value="sedentary" />
              <Picker.Item label="Light - 1-3x/week or 6k-9k steps/day" value="light" />
              <Picker.Item label="Moderate - 3-5x/week or 9k-12k steps/day" value="moderate" />
              <Picker.Item label="Active - Most days or 12k-15k+ steps/day" value="active" />
              <Picker.Item label="Very Active - High daily activity" value="very-active" />
            </Picker>
          </View>
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
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={alcoholGoal}
                onValueChange={(value) => setAlcoholGoal(value)}
                style={styles.picker}
              >
                <Picker.Item label="0 servings" value={0} />
                <Picker.Item label="1 serving" value={1} />
                <Picker.Item label="2 servings (recommended max)" value={2} />
                <Picker.Item label="3 servings" value={3} />
                <Picker.Item label="4 servings" value={4} />
                <Picker.Item label="5 servings" value={5} />
                <Picker.Item label="6 servings" value={6} />
                <Picker.Item label="7 servings" value={7} />
                <Picker.Item label="8 servings" value={8} />
                <Picker.Item label="9 servings" value={9} />
                <Picker.Item label="10 servings" value={10} />
              </Picker>
            </View>
          </View>
        )}

        <TouchableOpacity style={buttonStyles.primary} onPress={handleContinue}>
          <Text style={buttonStyles.primaryText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>

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
  pickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    height: 50,
  },
  picker: {
    height: 50,
    color: colors.text,
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
