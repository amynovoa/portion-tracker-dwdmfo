
import { IconSymbol } from '@/components/IconSymbol';
import { calculateRecommendedTargets } from '@/utils/portionCalculator';
import { ScrollView, StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, Switch } from 'react-native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { saveProfile, loadProfile } from '@/utils/storage';
import React, { useState, useEffect, useCallback } from 'react';
import { Sex, Goal, UserProfile, PortionTargets, ActivityLevel, ACTIVITY_LEVELS } from '@/types';
import { useRouter, useFocusEffect } from 'expo-router';
import AppLogo from '@/components/AppLogo';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 32,
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  optionButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  optionTextSelected: {
    color: colors.primary,
  },
  input: {
    ...commonStyles.input,
    fontSize: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  targetsSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  infoText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  saveButton: {
    ...buttonStyles.primary,
    marginTop: 16,
  },
  saveButtonText: {
    ...buttonStyles.primaryText,
  },
  activityButton: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 12,
  },
  activityButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default function ProfileScreen() {
  const router = useRouter();
  
  const [sex, setSex] = useState<Sex>('female');
  const [currentWeight, setCurrentWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [goal, setGoal] = useState<Goal>('maintain');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('sedentary');
  const [includeAlcohol, setIncludeAlcohol] = useState(false);
  const [alcoholServings, setAlcoholServings] = useState(2);
  const [targets, setTargets] = useState<PortionTargets>({
    protein: 3,
    veggies: 4,
    fruit: 2,
    wholeGrains: 2,
    legumes: 2,
    nutsSeeds: 2,
    fats: 2,
    water: 8,
    alcohol: 0,
  });

  useFocusEffect(
    useCallback(() => {
      loadExistingProfile();
    }, [])
  );

  useEffect(() => {
    calculateTargets();
  }, [sex, currentWeight, goal, includeAlcohol, alcoholServings, activityLevel]);

  const loadExistingProfile = async () => {
    const profile = await loadProfile();
    if (profile) {
      setSex(profile.sex);
      setCurrentWeight(profile.currentWeight.toString());
      setGoalWeight(profile.goalWeight.toString());
      setGoal(profile.goal);
      setActivityLevel(profile.activityLevel || 'sedentary');
      setIncludeAlcohol(profile.includeAlcohol);
      setAlcoholServings(profile.alcoholServings);
      setTargets(profile.targets);
    }
  };

  const calculateTargets = () => {
    const weight = parseFloat(currentWeight);
    if (!isNaN(weight) && weight > 0) {
      const recommended = calculateRecommendedTargets(
        sex,
        weight,
        goal,
        includeAlcohol,
        alcoholServings,
        activityLevel
      );
      setTargets(recommended);
    }
  };

  const handleSaveProfile = async () => {
    const weight = parseFloat(currentWeight);
    const goalW = parseFloat(goalWeight);

    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid current weight.');
      return;
    }

    if (isNaN(goalW) || goalW <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid goal weight.');
      return;
    }

    const profile: UserProfile = {
      sex,
      currentWeight: weight,
      goalWeight: goalW,
      goal,
      activityLevel,
      includeAlcohol,
      alcoholServings,
      targets,
    };

    await saveProfile(profile);
    Alert.alert('Success', 'Profile saved successfully!');
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Create Profile</Text>
      <Text style={styles.subtitle}>Set up your daily portion targets</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.optionButton, sex === 'female' && styles.optionButtonSelected]}
            onPress={() => setSex('female')}
          >
            <Text style={[styles.optionText, sex === 'female' && styles.optionTextSelected]}>
              Female
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, sex === 'male' && styles.optionButtonSelected]}
            onPress={() => setSex('male')}
          >
            <Text style={[styles.optionText, sex === 'male' && styles.optionTextSelected]}>
              Male
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Current Weight (lbs)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter current weight"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={currentWeight}
          onChangeText={setCurrentWeight}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Goal Weight (lbs)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter goal weight"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={goalWeight}
          onChangeText={setGoalWeight}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Goal</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.optionButton, goal === 'lose' && styles.optionButtonSelected]}
            onPress={() => setGoal('lose')}
          >
            <Text style={[styles.optionText, goal === 'lose' && styles.optionTextSelected]}>
              Lose Weight
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, goal === 'maintain' && styles.optionButtonSelected]}
            onPress={() => setGoal('maintain')}
          >
            <Text style={[styles.optionText, goal === 'maintain' && styles.optionTextSelected]}>
              Maintain
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.optionButton, goal === 'build' && styles.optionButtonSelected, { marginTop: 12 }]}
          onPress={() => setGoal('build')}
        >
          <Text style={[styles.optionText, goal === 'build' && styles.optionTextSelected]}>
            Build Muscle
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>How active are you on most days?</Text>
        {ACTIVITY_LEVELS.map((level) => (
          <TouchableOpacity
            key={level.value}
            style={[
              styles.activityButton,
              activityLevel === level.value && styles.activityButtonSelected,
            ]}
            onPress={() => setActivityLevel(level.value)}
          >
            <Text style={styles.activityTitle}>{level.label}</Text>
            <Text style={styles.activityDescription}>{level.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Include alcohol in my daily plan</Text>
          <Switch
            value={includeAlcohol}
            onValueChange={setIncludeAlcohol}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View style={styles.targetsSection}>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Click below to calculate your personalized portion targets based on your profile.
          </Text>
        </View>
        
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
          <Text style={styles.saveButtonText}>Calculate My Portions</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
