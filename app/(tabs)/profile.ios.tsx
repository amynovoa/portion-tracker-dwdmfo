
import { calculateRecommendedTargets } from '@/utils/portionCalculator';
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, Switch } from 'react-native';
import { saveProfile, loadProfile } from '@/utils/storage';
import PortionDropdown from '@/components/PortionDropdown';
import { Sex, Goal, UserProfile, PortionTargets, ActivityLevel, ACTIVITY_LEVELS } from '@/types';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function ProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [sex, setSex] = useState<Sex>('prefer_not_to_say');
  const [currentWeight, setCurrentWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [goal, setGoal] = useState<Goal>('maintain');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [includeAlcohol, setIncludeAlcohol] = useState(false);
  const [alcoholServings, setAlcoholServings] = useState(2);
  const [targets, setTargets] = useState<PortionTargets | null>(null);

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
    if (sex && currentWeight && goal) {
      calculateTargets();
    }
  }, [sex, currentWeight, goal, includeAlcohol, alcoholServings, activityLevel]);

  async function loadExistingProfile() {
    const profile = await loadProfile();
    if (profile) {
      setSex(profile.sex);
      setCurrentWeight(profile.currentWeight.toString());
      setGoalWeight(profile.goalWeight.toString());
      setGoal(profile.goal);
      setActivityLevel(profile.activityLevel || 'moderate');
      setIncludeAlcohol(profile.includeAlcohol);
      setAlcoholServings(profile.alcoholServings);
      setTargets(profile.targets);
    }
  }

  function calculateTargets() {
    const weight = parseFloat(currentWeight);
    if (isNaN(weight) || weight <= 0) {
      setTargets(null);
      return;
    }

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

  function handleSetupCustomTargets() {
    if (!targets) {
      Alert.alert('Error', 'Please calculate your portions first');
      return;
    }
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
    if (!targets) {
      Alert.alert('Missing Targets', 'Please calculate your portion targets first.');
      return;
    }

    const profile: UserProfile = {
      sex,
      currentWeight: weight,
      goalWeight: gWeight,
      goal,
      activityLevel,
      includeAlcohol,
      alcoholServings,
      targets,
    };

    await saveProfile(profile);
    Alert.alert('Success', 'Profile saved!');
    router.push('/(tabs)/(home)');
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
      very_active: 'Very Active',
    };
    return labels[level];
  }

  return (
    <ScrollView style={[commonStyles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => router.push('/(tabs)/settings')}
        >
          <IconSymbol 
            ios_icon_name="gearshape.fill" 
            android_material_icon_name="settings" 
            size={24} 
            color={colors.text} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Information</Text>

        <Text style={styles.label}>Sex</Text>
        <PortionDropdown
          value={sex}
          options={[
            { label: 'Male', value: 'male' },
            { label: 'Female', value: 'female' },
            { label: 'Prefer not to say', value: 'prefer_not_to_say' },
          ]}
          onSelect={(val) => setSex(val as Sex)}
        />

        <Text style={styles.label}>Current Weight (lbs)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={currentWeight}
          onChangeText={setCurrentWeight}
          placeholder="e.g. 180"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>Goal Weight (lbs)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={goalWeight}
          onChangeText={setGoalWeight}
          placeholder="e.g. 165"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>Goal</Text>
        <PortionDropdown
          value={goal}
          options={[
            { label: 'Lose Weight', value: 'lose' },
            { label: 'Maintain Weight', value: 'maintain' },
            { label: 'Build Muscle', value: 'build' },
          ]}
          onSelect={(val) => setGoal(val as Goal)}
        />

        <Text style={styles.label}>Activity Level</Text>
        <PortionDropdown
          value={activityLevel}
          options={ACTIVITY_LEVELS.map((level) => ({
            label: formatActivityLevel(level),
            value: level,
          }))}
          onSelect={(val) => setActivityLevel(val as ActivityLevel)}
        />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Include Alcohol?</Text>
          <Switch
            value={includeAlcohol}
            onValueChange={setIncludeAlcohol}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
          />
        </View>

        {includeAlcohol && (
          <>
            <Text style={styles.label}>Alcohol Servings (max 2 recommended)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={alcoholServings.toString()}
              onChangeText={(val) => {
                const num = parseInt(val) || 0;
                setAlcoholServings(Math.max(0, Math.min(num, 10)));
              }}
            />
          </>
        )}

        <TouchableOpacity style={buttonStyles.primary} onPress={calculateTargets}>
          <Text style={buttonStyles.primaryText}>Calculate My Portions</Text>
        </TouchableOpacity>
      </View>

      {targets && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Daily Targets</Text>
          <Text style={styles.subtitle}>Tap to adjust any target</Text>

          {Object.entries(targets).map(([key, value]) => (
            <View key={key} style={styles.targetRow}>
              <Text style={styles.targetLabel}>{formatTargetLabel(key)}</Text>
              <View style={styles.targetControls}>
                <TouchableOpacity
                  style={styles.targetButton}
                  onPress={() => handleUpdateTargets(key as keyof PortionTargets, Math.max(0, value - 1))}
                >
                  <Text style={styles.targetButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.targetValue}>{value}</Text>
                <TouchableOpacity
                  style={styles.targetButton}
                  onPress={() => handleUpdateTargets(key as keyof PortionTargets, value + 1)}
                >
                  <Text style={styles.targetButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity style={buttonStyles.primary} onPress={handleSaveProfile}>
            <Text style={buttonStyles.primaryText}>Save Profile</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Add bottom padding to ensure content is not hidden by tab bar */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  settingsButton: {
    padding: 8,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  targetLabel: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  targetControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  targetButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  targetValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    minWidth: 30,
    textAlign: 'center',
  },
});
