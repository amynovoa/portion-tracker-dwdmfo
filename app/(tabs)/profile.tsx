
import { calculateRecommendedTargets } from '@/utils/portionCalculator';
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, Switch } from 'react-native';
import { saveProfile, loadProfile } from '@/utils/storage';
import PortionDropdown from '@/components/PortionDropdown';
import { Sex, Goal, UserProfile, PortionTargets, ActivityLevel, ACTIVITY_LEVELS } from '@/types';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
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
  optionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
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
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  input: {
    ...commonStyles.input,
    marginBottom: 12,
  },
  targetsContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  targetRowLast: {
    borderBottomWidth: 0,
  },
  targetLabel: {
    fontSize: 16,
    color: colors.text,
  },
  alcoholToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alcoholLabel: {
    fontSize: 16,
    color: colors.text,
  },
});

export default function ProfileScreen() {
  const router = useRouter();
  const [sex, setSex] = useState<Sex>('female');
  const [currentWeight, setCurrentWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [goal, setGoal] = useState<Goal>('maintain');
  const [includeAlcohol, setIncludeAlcohol] = useState(false);
  const [alcoholServings, setAlcoholServings] = useState(2);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [targets, setTargets] = useState<PortionTargets | null>(null);
  const [isExistingProfile, setIsExistingProfile] = useState(false);

  useEffect(() => {
    calculateTargets();
  }, [sex, currentWeight, goal, includeAlcohol, alcoholServings, activityLevel]);

  useFocusEffect(
    React.useCallback(() => {
      loadExistingProfile();
    }, [])
  );

  async function loadExistingProfile() {
    const profile = await loadProfile();
    if (profile) {
      setIsExistingProfile(true);
      setSex(profile.sex);
      setCurrentWeight(profile.currentWeight.toString());
      setGoalWeight(profile.goalWeight.toString());
      setGoal(profile.goal);
      setIncludeAlcohol(profile.includeAlcohol ?? false);
      setAlcoholServings(profile.alcoholServings ?? 2);
      // Ensure activityLevel is a string
      const level = typeof profile.activityLevel === 'string' ? profile.activityLevel : 'moderate';
      setActivityLevel(level as ActivityLevel);
      setTargets(profile.targets);
    }
  }

  function calculateTargets() {
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
  }

  async function handleSaveProfile() {
    const weight = parseFloat(currentWeight);
    const gWeight = parseFloat(goalWeight);

    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid current weight.');
      return;
    }
    if (isNaN(gWeight) || gWeight <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid goal weight.');
      return;
    }
    if (!targets) {
      Alert.alert('Error', 'Unable to calculate targets.');
      return;
    }

    const profile: UserProfile = {
      sex,
      currentWeight: weight,
      goalWeight: gWeight,
      goal,
      includeAlcohol,
      alcoholServings,
      activityLevel,
      targets,
    };

    await saveProfile(profile);
    Alert.alert('Success', 'Profile saved successfully!');
    router.back();
  }

  function handleUpdateTargets(key: keyof PortionTargets, value: number) {
    if (targets) {
      setTargets({ ...targets, [key]: value });
    }
  }

  function formatTargetLabel(key: string): string {
    const labels: Record<string, string> = {
      protein: 'Protein',
      veggies: 'Veggies',
      fruit: 'Fruit',
      wholeGrains: 'Whole Grains',
      legumes: 'Legumes',
      nutsSeeds: 'Nuts & Seeds',
      fats: 'Fats',
      water: 'Water',
      alcohol: 'Alcohol',
    };
    return labels[key] || key;
  }

  function formatActivityLevel(level: ActivityLevel): string {
    const labels: Record<ActivityLevel, string> = {
      sedentary: 'Sedentary',
      light: 'Light',
      moderate: 'Moderate',
      active: 'Active',
      veryActive: 'Very Active',
    };
    return labels[level];
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {isExistingProfile ? 'Edit Profile' : 'Set Up My Profile'}
        </Text>
        <Text style={styles.subtitle}>
          {isExistingProfile
            ? 'Update your information and portion targets'
            : 'Tell us about yourself to get personalized portion targets'}
        </Text>

        <View style={styles.section}>
          <Text style={styles.label}>Sex</Text>
          <View style={styles.optionRow}>
            <TouchableOpacity
              style={[styles.optionButton, sex === 'female' && styles.optionButtonSelected]}
              onPress={() => setSex('female')}
            >
              <Text style={styles.optionText}>Female</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, sex === 'male' && styles.optionButtonSelected]}
              onPress={() => setSex('male')}
            >
              <Text style={styles.optionText}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, sex === 'other' && styles.optionButtonSelected]}
              onPress={() => setSex('other')}
            >
              <Text style={styles.optionText}>Other</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Current Weight (lbs)</Text>
          <TextInput
            style={styles.input}
            value={currentWeight}
            onChangeText={setCurrentWeight}
            keyboardType="numeric"
            placeholder="Enter current weight"
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
          <View style={styles.optionRow}>
            <TouchableOpacity
              style={[styles.optionButton, goal === 'lose' && styles.optionButtonSelected]}
              onPress={() => setGoal('lose')}
            >
              <Text style={styles.optionText}>Lose Weight</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, goal === 'maintain' && styles.optionButtonSelected]}
              onPress={() => setGoal('maintain')}
            >
              <Text style={styles.optionText}>Maintain</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, goal === 'build' && styles.optionButtonSelected]}
              onPress={() => setGoal('build')}
            >
              <Text style={styles.optionText}>Build Muscle</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Activity Level</Text>
          <View style={styles.optionRow}>
            {ACTIVITY_LEVELS.slice(0, 3).map((level) => (
              <TouchableOpacity
                key={level}
                style={[styles.optionButton, activityLevel === level && styles.optionButtonSelected]}
                onPress={() => setActivityLevel(level)}
              >
                <Text style={styles.optionText}>{formatActivityLevel(level)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.optionRow}>
            {ACTIVITY_LEVELS.slice(3).map((level) => (
              <TouchableOpacity
                key={level}
                style={[styles.optionButton, activityLevel === level && styles.optionButtonSelected]}
                onPress={() => setActivityLevel(level)}
              >
                <Text style={styles.optionText}>{formatActivityLevel(level)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.alcoholToggleRow}>
            <Text style={styles.alcoholLabel}>Include Alcohol Tracking</Text>
            <Switch
              value={includeAlcohol}
              onValueChange={setIncludeAlcohol}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
          {includeAlcohol && (
            <>
              <Text style={styles.label}>Daily Alcohol Goal (servings)</Text>
              <PortionDropdown
                value={alcoholServings}
                onChange={setAlcoholServings}
                min={0}
                max={4}
              />
            </>
          )}
        </View>

        {targets && (
          <View style={styles.section}>
            <Text style={styles.label}>Daily Portion Targets</Text>
            <View style={styles.targetsContainer}>
              {Object.entries(targets).map(([key, value], index) => {
                if (key === 'alcohol' && !includeAlcohol) return null;
                return (
                  <View
                    key={key}
                    style={[
                      styles.targetRow,
                      index === Object.keys(targets).length - 1 && styles.targetRowLast,
                    ]}
                  >
                    <Text style={styles.targetLabel}>{formatTargetLabel(key)}</Text>
                    <PortionDropdown
                      value={value}
                      onChange={(newValue) => handleUpdateTargets(key as keyof PortionTargets, newValue)}
                      min={0}
                      max={key === 'water' ? 15 : 10}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <TouchableOpacity style={buttonStyles.primary} onPress={handleSaveProfile}>
          <Text style={buttonStyles.primaryText}>
            {isExistingProfile ? 'Update Profile' : 'Save Profile'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
