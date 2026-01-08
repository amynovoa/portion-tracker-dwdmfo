
import { Sex, Goal, UserProfile, PortionTargets, ActivityLevel, ACTIVITY_LEVELS } from '@/types';
import { ScrollView, StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, Switch } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import React, { useState, useEffect } from 'react';
import { calculateRecommendedTargets } from '@/utils/portionCalculator';
import PortionDropdown from '@/components/PortionDropdown';
import { saveProfile, loadProfile } from '@/utils/storage';

export default function ProfileScreen() {
  const [sex, setSex] = useState<Sex>('prefer_not_to_say');
  const [currentWeight, setCurrentWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [goal, setGoal] = useState<Goal>('maintain');
  const [includeAlcohol, setIncludeAlcohol] = useState(false);
  const [alcoholServings, setAlcoholServings] = useState(2);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderatelyActive');
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

  const router = useRouter();

  useFocusEffect(
    React.useCallback(() => {
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
      setIncludeAlcohol(profile.includeAlcohol);
      setAlcoholServings(profile.alcoholServings);
      // Ensure activityLevel is a valid string
      const loadedActivityLevel = profile.activityLevel;
      if (typeof loadedActivityLevel === 'string' && ACTIVITY_LEVELS.includes(loadedActivityLevel as ActivityLevel)) {
        setActivityLevel(loadedActivityLevel as ActivityLevel);
      } else {
        console.log('Invalid activity level loaded, defaulting to moderatelyActive:', loadedActivityLevel);
        setActivityLevel('moderatelyActive');
      }
      setTargets(profile.dailyTargets);
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
      dailyTargets: targets,
    };

    await saveProfile(profile);
    Alert.alert('Success', 'Profile saved successfully!');
    router.back();
  };

  const handleUpdateTargets = (key: keyof PortionTargets, value: number) => {
    setTargets(prev => ({ ...prev, [key]: value }));
  };

  const formatTargetLabel = (key: string): string => {
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
  };

  const formatActivityLevel = (level: ActivityLevel): string => {
    const formatted = level.replace(/([A-Z])/g, ' $1').trim();
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile Setup</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Sex</Text>
        <View style={styles.buttonGroup}>
          {(['male', 'female', 'prefer_not_to_say'] as Sex[]).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.optionButton, sex === s && styles.optionButtonActive]}
              onPress={() => setSex(s)}
            >
              <Text style={[styles.optionText, sex === s && styles.optionTextActive]}>
                {s === 'prefer_not_to_say' ? 'Prefer not to say' : s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Current Weight (lbs)</Text>
        <TextInput
          style={styles.input}
          value={currentWeight}
          onChangeText={setCurrentWeight}
          keyboardType="numeric"
          placeholder="Enter weight"
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
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Goal</Text>
        <View style={styles.buttonGroup}>
          {(['lose', 'maintain', 'build'] as Goal[]).map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.optionButton, goal === g && styles.optionButtonActive]}
              onPress={() => setGoal(g)}
            >
              <Text style={[styles.optionText, goal === g && styles.optionTextActive]}>
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
              <Text style={[styles.optionText, activityLevel === level && styles.optionTextActive]}>
                {formatActivityLevel(level)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Include Alcohol</Text>
          <Switch value={includeAlcohol} onValueChange={setIncludeAlcohol} />
        </View>
        {includeAlcohol && (
          <PortionDropdown
            label="Daily Alcohol Servings"
            value={alcoholServings}
            onChange={setAlcoholServings}
            min={0}
            max={2}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Targets</Text>
        {Object.entries(targets).map(([key, value]) => (
          <PortionDropdown
            key={key}
            label={formatTargetLabel(key)}
            value={value}
            onChange={(v) => handleUpdateTargets(key as keyof PortionTargets, v)}
            min={0}
            max={15}
          />
        ))}
      </View>

      <TouchableOpacity style={[buttonStyles.primary, styles.saveButton]} onPress={handleSaveProfile}>
        <Text style={buttonStyles.primaryText}>Save Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

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
    marginBottom: 24,
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
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    ...commonStyles.input,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 14,
    color: colors.text,
  },
  optionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButton: {
    marginTop: 12,
    marginBottom: 40,
  },
});
