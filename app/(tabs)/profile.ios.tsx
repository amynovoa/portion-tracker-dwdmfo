
import { calculateRecommendedTargets } from '@/utils/portionCalculator';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, Switch } from 'react-native';
import { saveProfile, loadProfile } from '@/utils/storage';
import PortionDropdown from '@/components/PortionDropdown';
import { Sex, Goal, UserProfile, PortionTargets, ActivityLevel, ACTIVITY_LEVELS } from '@/types';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [sex, setSex] = useState<Sex>('female');
  const [currentWeight, setCurrentWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [goal, setGoal] = useState<Goal>('maintain');
  const [includeAlcohol, setIncludeAlcohol] = useState(false);
  const [alcoholServings, setAlcoholServings] = useState(2);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [targets, setTargets] = useState<PortionTargets>({
    protein: 0,
    veggies: 0,
    fruit: 0,
    wholeGrains: 0,
    legumes: 0,
    nutsSeeds: 0,
    fats: 0,
    water: 0,
    alcohol: 0,
  });

  useFocusEffect(
    React.useCallback(() => {
      loadExistingProfile();
    }, [])
  );

  useEffect(() => {
    if (params.customTargets) {
      try {
        const customTargets = JSON.parse(params.customTargets as string);
        setTargets(customTargets);
      } catch (e) {
        console.error('Failed to parse custom targets:', e);
      }
    }
  }, [params.customTargets]);

  useEffect(() => {
    calculateTargets();
  }, [sex, currentWeight, goal, includeAlcohol, alcoholServings, activityLevel]);

  async function loadExistingProfile() {
    const profile = await loadProfile();
    if (profile) {
      setSex(profile.sex);
      setCurrentWeight(profile.currentWeight.toString());
      setGoalWeight(profile.goalWeight.toString());
      setGoal(profile.goal);
      setIncludeAlcohol(profile.includeAlcohol ?? false);
      setAlcoholServings(profile.alcoholServings ?? 2);
      setActivityLevel(profile.activityLevel ?? 'moderate');
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

  function handleSetupCustomTargets() {
    router.push({
      pathname: '/setup-targets',
      params: { targets: JSON.stringify(targets) }
    });
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
    Alert.alert('Success', 'Profile saved!');
    router.push('/(tabs)/(home)');
  }

  function handleUpdateTargets(key: keyof PortionTargets, value: number) {
    setTargets(prev => ({ ...prev, [key]: value }));
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Your Profile</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Sex</Text>
        <View style={styles.buttonGroup}>
          {(['female', 'male', 'preferNotToSay'] as Sex[]).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.optionButton, sex === s && styles.optionButtonActive]}
              onPress={() => setSex(s)}
            >
              <Text style={[styles.optionButtonText, sex === s && styles.optionButtonTextActive]}>
                {s === 'female' ? 'Female' : s === 'male' ? 'Male' : 'Prefer Not to Say'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Current Weight (lbs)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={currentWeight}
          onChangeText={setCurrentWeight}
          placeholder="e.g. 150"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Goal Weight (lbs)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={goalWeight}
          onChangeText={setGoalWeight}
          placeholder="e.g. 140"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Primary Goal</Text>
        <View style={styles.buttonGroup}>
          {(['lose', 'maintain', 'build'] as Goal[]).map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.optionButton, goal === g && styles.optionButtonActive]}
              onPress={() => setGoal(g)}
            >
              <Text style={[styles.optionButtonText, goal === g && styles.optionButtonTextActive]}>
                {g === 'lose' ? 'Lose Weight' : g === 'maintain' ? 'Maintain' : 'Build Muscle'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Activity Level</Text>
        <View style={styles.buttonGroup}>
          {ACTIVITY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level}
              style={[styles.optionButton, activityLevel === level && styles.optionButtonActive]}
              onPress={() => setActivityLevel(level)}
            >
              <Text style={[styles.optionButtonText, activityLevel === level && styles.optionButtonTextActive]}>
                {formatActivityLevel(level)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Include Alcohol in Plan?</Text>
          <Switch
            value={includeAlcohol}
            onValueChange={setIncludeAlcohol}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
        {includeAlcohol && (
          <View style={styles.alcoholServingsContainer}>
            <Text style={styles.subLabel}>Daily Alcohol Servings (max 2 recommended)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={alcoholServings.toString()}
              onChangeText={(text) => {
                const val = parseInt(text) || 0;
                setAlcoholServings(Math.max(0, Math.min(val, 5)));
              }}
            />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended Daily Targets</Text>
        <Text style={styles.sectionSubtitle}>
          Based on your profile. Tap to adjust or use "Customize Targets" below.
        </Text>
        {(Object.keys(targets) as Array<keyof PortionTargets>).map((key) => (
          <View key={key} style={styles.targetRow}>
            <Text style={styles.targetLabel}>{formatTargetLabel(key)}</Text>
            <PortionDropdown
              value={targets[key]}
              onChange={(val) => handleUpdateTargets(key, val)}
              min={0}
              max={15}
            />
          </View>
        ))}
      </View>

      <TouchableOpacity style={[commonStyles.button, buttonStyles.secondary]} onPress={handleSetupCustomTargets}>
        <Text style={[commonStyles.buttonText, buttonStyles.secondaryText]}>Customize Targets</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[commonStyles.button, buttonStyles.primary]} onPress={handleSaveProfile}>
        <Text style={[commonStyles.buttonText, buttonStyles.primaryText]}>Save Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
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
  subLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionButtonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  optionButtonTextActive: {
    color: colors.white,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alcoholServingsContainer: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  targetLabel: {
    fontSize: 16,
    color: colors.text,
  },
});
