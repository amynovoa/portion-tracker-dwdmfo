
import { Sex, Goal, UserProfile, PortionTargets, ActivityLevel, ACTIVITY_LEVELS } from '@/types';
import AppLogo from '@/components/AppLogo';
import { ScrollView, StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, Switch } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import React, { useState, useEffect } from 'react';
import { calculateRecommendedTargets } from '@/utils/portionCalculator';
import PortionDropdown from '@/components/PortionDropdown';
import { saveProfile, loadProfile } from '@/utils/storage';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
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
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    padding: 16,
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
  optionButtonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  optionButtonTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  targetsContainer: {
    gap: 12,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  targetLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  alcoholToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  alcoholToggleLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
});

export default function ProfileScreen() {
  const [sex, setSex] = useState<Sex>('female');
  const [currentWeight, setCurrentWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [goal, setGoal] = useState<Goal>('maintain');
  const [includeAlcohol, setIncludeAlcohol] = useState(false);
  const [alcoholServings, setAlcoholServings] = useState(2);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [customTargets, setCustomTargets] = useState<PortionTargets | null>(null);
  const [isNewUser, setIsNewUser] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (includeAlcohol || alcoholServings !== 2 || activityLevel !== 'moderate') {
      calculateTargets();
    }
  }, [includeAlcohol, alcoholServings, activityLevel]);

  useFocusEffect(
    React.useCallback(() => {
      loadExistingProfile();
    }, [])
  );

  const loadExistingProfile = async () => {
    const profile = await loadProfile();
    if (profile) {
      setIsNewUser(false);
      setSex(profile.sex);
      setCurrentWeight(profile.currentWeight.toString());
      setGoalWeight(profile.goalWeight.toString());
      setGoal(profile.goal);
      setIncludeAlcohol(profile.includeAlcohol || false);
      setAlcoholServings(profile.alcoholServings || 2);
      setActivityLevel(profile.activityLevel || 'moderate');
      setCustomTargets(profile.targets);
    }
  };

  const calculateTargets = () => {
    if (!currentWeight || !goalWeight) return;

    const weight = parseFloat(currentWeight);
    const targets = calculateRecommendedTargets(
      sex,
      weight,
      goal,
      includeAlcohol,
      alcoholServings,
      activityLevel
    );
    setCustomTargets(targets);
  };

  const handleSaveProfile = async () => {
    if (!currentWeight || !goalWeight || !customTargets) {
      Alert.alert('Error', 'Please fill in all fields and calculate targets');
      return;
    }

    const profile: UserProfile = {
      sex,
      currentWeight: parseFloat(currentWeight),
      goalWeight: parseFloat(goalWeight),
      goal,
      includeAlcohol,
      alcoholServings,
      activityLevel,
      targets: customTargets,
    };

    await saveProfile(profile);
    Alert.alert('Success', 'Profile saved successfully');
    router.back();
  };

  const handleUpdateTargets = (key: keyof PortionTargets, value: number) => {
    if (customTargets) {
      setCustomTargets({ ...customTargets, [key]: value });
    }
  };

  const formatTargetLabel = (key: string): string => {
    const labels: Record<string, string> = {
      protein: 'Protein',
      veggies: 'Veggies',
      fruit: 'Fruit',
      healthyCarbs: 'Whole Grains',
      fats: 'Fats',
      nuts: 'Nuts & Seeds',
      water: 'Water',
      alcohol: 'Alcohol',
    };
    return labels[key] || key;
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent}>
        <AppLogo />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sex</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.optionButton, sex === 'female' && styles.optionButtonSelected]}
              onPress={() => setSex('female')}
            >
              <Text style={[styles.optionButtonText, sex === 'female' && styles.optionButtonTextSelected]}>
                Female
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, sex === 'male' && styles.optionButtonSelected]}
              onPress={() => setSex('male')}
            >
              <Text style={[styles.optionButtonText, sex === 'male' && styles.optionButtonTextSelected]}>
                Male
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, sex === 'other' && styles.optionButtonSelected]}
              onPress={() => setSex('other')}
            >
              <Text style={[styles.optionButtonText, sex === 'other' && styles.optionButtonTextSelected]}>
                Other
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.inputGroup}>
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

          <View style={styles.inputGroup}>
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
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goal</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.optionButton, goal === 'lose' && styles.optionButtonSelected]}
              onPress={() => setGoal('lose')}
            >
              <Text style={[styles.optionButtonText, goal === 'lose' && styles.optionButtonTextSelected]}>
                Lose Weight
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, goal === 'maintain' && styles.optionButtonSelected]}
              onPress={() => setGoal('maintain')}
            >
              <Text style={[styles.optionButtonText, goal === 'maintain' && styles.optionButtonTextSelected]}>
                Maintain
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, goal === 'build' && styles.optionButtonSelected]}
              onPress={() => setGoal('build')}
            >
              <Text style={[styles.optionButtonText, goal === 'build' && styles.optionButtonTextSelected]}>
                Build Muscle
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Level</Text>
          <View style={styles.buttonGroup}>
            {ACTIVITY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level}
                style={[styles.optionButton, activityLevel === level && styles.optionButtonSelected]}
                onPress={() => setActivityLevel(level)}
              >
                <Text style={[styles.optionButtonText, activityLevel === level && styles.optionButtonTextSelected]}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alcohol</Text>
          <View style={styles.alcoholToggleContainer}>
            <Text style={styles.alcoholToggleLabel}>Include Alcohol Tracking</Text>
            <Switch
              value={includeAlcohol}
              onValueChange={setIncludeAlcohol}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
          {includeAlcohol && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Daily Alcohol Servings (max 2 recommended)</Text>
              <TextInput
                style={styles.input}
                value={alcoholServings.toString()}
                onChangeText={(text) => setAlcoholServings(Math.min(parseInt(text) || 0, 2))}
                keyboardType="numeric"
                placeholder="Enter servings"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          )}
        </View>

        <TouchableOpacity style={[buttonStyles.primary, { marginBottom: 16 }]} onPress={calculateTargets}>
          <Text style={buttonStyles.primaryText}>Calculate Targets</Text>
        </TouchableOpacity>

        {customTargets && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily Portion Targets</Text>
            <View style={styles.targetsContainer}>
              {Object.entries(customTargets).map(([key, value]) => (
                <View key={key} style={styles.targetRow}>
                  <Text style={styles.targetLabel}>{formatTargetLabel(key)}</Text>
                  <PortionDropdown
                    value={value}
                    onChange={(newValue) => handleUpdateTargets(key as keyof PortionTargets, newValue)}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity style={buttonStyles.primary} onPress={handleSaveProfile}>
          <Text style={buttonStyles.primaryText}>Save Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
