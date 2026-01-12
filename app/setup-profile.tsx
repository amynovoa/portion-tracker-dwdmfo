
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
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
  const [alcoholGoal, setAlcoholGoal] = useState('2');

  const handleContinue = () => {
    console.log('Setup profile - Continue clicked');
    
    if (!weight || !goalWeight) {
      alert('Please enter your current and goal weight');
      return;
    }

    const weightNum = parseFloat(weight);
    const goalWeightNum = parseFloat(goalWeight);
    const alcoholGoalNum = includeAlcohol ? parseInt(alcoholGoal) || 2 : 0;

    if (isNaN(weightNum) || isNaN(goalWeightNum) || weightNum <= 0 || goalWeightNum <= 0) {
      alert('Please enter valid weight values');
      return;
    }

    // Validate alcohol goal if included (max recommended is 2)
    if (includeAlcohol && (alcoholGoalNum < 0 || alcoholGoalNum > 10)) {
      alert('Please enter a valid alcohol goal (0-10 servings)');
      return;
    }

    console.log('Navigating to setup-targets with params:', {
      sex,
      weight: weightNum,
      goalWeight: goalWeightNum,
      goal,
      activityLevel,
      includeAlcohol,
      alcoholGoal: alcoholGoalNum,
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
        alcoholGoal: alcoholGoalNum.toString(),
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
          <Text style={styles.label}>Current Weight (lbs)</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            placeholder="Enter weight"
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
              <Picker.Item label="Very Active - High daily activity" value="veryActive" />
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
            <TextInput
              style={styles.input}
              value={alcoholGoal}
              onChangeText={setAlcoholGoal}
              keyboardType="numeric"
              placeholder="Enter daily alcohol goal"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        )}

        <TouchableOpacity style={buttonStyles.primary} onPress={handleContinue}>
          <Text style={buttonStyles.primaryText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
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
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
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
  },
  picker: {
    height: 50,
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
});
