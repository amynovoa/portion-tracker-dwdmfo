
import { IconSymbol } from '@/components/IconSymbol';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { calculateRecommendedTargets } from '@/utils/portionCalculator';
import { ScrollView, StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, Switch } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { saveProfile, loadProfile } from '@/utils/storage';
import { Sex, Goal, UserProfile, PortionTargets, ActivityLevel, ACTIVITY_LEVELS } from '@/types';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 24 },
  
  section: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 },
  
  pickerContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: colors.text,
  },
  
  buttonRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
  },
  optionButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionText: { fontSize: 16, color: colors.text },
  optionTextSelected: { color: colors.primary, fontWeight: '600' },
  
  input: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  calculateButton: {
    ...buttonStyles.primary,
    marginTop: 8,
  },
  calculateButtonText: {
    ...buttonStyles.primaryText,
  },
});

export default function ProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [sex, setSex] = useState<Sex>('prefer-not-to-say');
  const [currentWeight, setCurrentWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [goal, setGoal] = useState<Goal>('maintain');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [includeAlcohol, setIncludeAlcohol] = useState(false);
  const [alcoholServings, setAlcoholServings] = useState('2');
  const [calculatedTargets, setCalculatedTargets] = useState<PortionTargets | null>(null);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadExistingProfile();
    }, [])
  );

  useEffect(() => {
    if (params.customTargets) {
      try {
        const targets = JSON.parse(params.customTargets as string);
        setCalculatedTargets(targets);
      } catch (e) {
        console.error('Failed to parse custom targets:', e);
      }
    }
  }, [params.customTargets]);

  useEffect(() => {
    if (sex && currentWeight && goal && activityLevel) {
      calculateTargets();
    }
  }, [sex, currentWeight, goal, includeAlcohol, alcoholServings, activityLevel]);

  async function loadExistingProfile() {
    const profile = await loadProfile();
    if (profile) {
      setHasExistingProfile(true);
      setSex(profile.sex);
      setCurrentWeight(profile.currentWeight.toString());
      setGoalWeight(profile.goalWeight?.toString() || '');
      setGoal(profile.goal);
      setActivityLevel(profile.activityLevel || 'moderate');
      setIncludeAlcohol(profile.includeAlcohol || false);
      setAlcoholServings(profile.alcoholServings?.toString() || '2');
      setCalculatedTargets(profile.portionTargets);
    }
  }

  function calculateTargets() {
    const weight = parseFloat(currentWeight);
    const alcohol = parseInt(alcoholServings) || 2;
    
    if (!weight || weight <= 0) return;
    
    const targets = calculateRecommendedTargets(
      sex,
      weight,
      goal,
      includeAlcohol,
      alcohol,
      activityLevel
    );
    
    setCalculatedTargets(targets);
  }

  function handleReviewTargets() {
    const weight = parseFloat(currentWeight);
    
    if (!weight || weight <= 0) {
      Alert.alert('Error', 'Please enter a valid current weight');
      return;
    }
    
    if (!calculatedTargets) {
      Alert.alert('Error', 'Please wait while we calculate your targets');
      return;
    }

    // Navigate to setup-targets with all profile data
    router.push({
      pathname: '/setup-targets',
      params: { 
        targets: JSON.stringify(calculatedTargets),
        sex,
        currentWeight,
        goalWeight: goalWeight || '',
        goal,
        activityLevel,
        includeAlcohol: includeAlcohol.toString(),
        alcoholServings,
      }
    });
  }

  async function handleSaveProfile() {
    const weight = parseFloat(currentWeight);
    const gWeight = parseFloat(goalWeight);
    
    if (!weight || weight <= 0) {
      Alert.alert('Error', 'Please enter a valid current weight');
      return;
    }
    
    if (!calculatedTargets) {
      Alert.alert('Error', 'Please calculate your portion targets first');
      return;
    }
    
    const profile: UserProfile = {
      sex,
      currentWeight: weight,
      goalWeight: gWeight || undefined,
      goal,
      activityLevel,
      includeAlcohol,
      alcoholServings: includeAlcohol ? parseInt(alcoholServings) : undefined,
      portionTargets: calculatedTargets,
    };
    
    await saveProfile(profile);
    Alert.alert('Success', 'Profile saved!', [
      { text: 'OK', onPress: () => router.push('/(tabs)/(home)') }
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Set Up Your Profile</Text>
      <Text style={styles.subtitle}>Help us personalize your portion targets</Text>
      
      {/* Sex */}
      <View style={styles.section}>
        <Text style={styles.label}>Sex</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.optionButton, sex === 'male' && styles.optionButtonSelected]}
            onPress={() => setSex('male')}
          >
            <Text style={[styles.optionText, sex === 'male' && styles.optionTextSelected]}>Male</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, sex === 'female' && styles.optionButtonSelected]}
            onPress={() => setSex('female')}
          >
            <Text style={[styles.optionText, sex === 'female' && styles.optionTextSelected]}>Female</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.optionButton, sex === 'prefer-not-to-say' && styles.optionButtonSelected]}
          onPress={() => setSex('prefer-not-to-say')}
        >
          <Text style={[styles.optionText, sex === 'prefer-not-to-say' && styles.optionTextSelected]}>
            Prefer not to say
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Weight */}
      <View style={styles.section}>
        <Text style={styles.label}>Current Weight (lbs)</Text>
        <TextInput
          style={styles.input}
          value={currentWeight}
          onChangeText={setCurrentWeight}
          keyboardType="numeric"
          placeholder="Enter weight"
          placeholderTextColor={colors.textSecondary}
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>Goal Weight (lbs) - Optional</Text>
        <TextInput
          style={styles.input}
          value={goalWeight}
          onChangeText={setGoalWeight}
          keyboardType="numeric"
          placeholder="Enter goal weight"
          placeholderTextColor={colors.textSecondary}
        />
      </View>
      
      {/* Goal */}
      <View style={styles.section}>
        <Text style={styles.label}>Primary Goal</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.optionButton, goal === 'lose' && styles.optionButtonSelected]}
            onPress={() => setGoal('lose')}
          >
            <Text style={[styles.optionText, goal === 'lose' && styles.optionTextSelected]}>Lose</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, goal === 'maintain' && styles.optionButtonSelected]}
            onPress={() => setGoal('maintain')}
          >
            <Text style={[styles.optionText, goal === 'maintain' && styles.optionTextSelected]}>Maintain</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, goal === 'build' && styles.optionButtonSelected]}
            onPress={() => setGoal('build')}
          >
            <Text style={[styles.optionText, goal === 'build' && styles.optionTextSelected]}>Build</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Activity Level Dropdown */}
      <View style={styles.section}>
        <Text style={styles.label}>How active are you on most days?</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={activityLevel}
            onValueChange={(value) => setActivityLevel(value as ActivityLevel)}
            style={styles.picker}
          >
            {ACTIVITY_LEVELS.map((level) => (
              <Picker.Item
                key={level.value}
                label={`${level.label} - ${level.description}`}
                value={level.value}
              />
            ))}
          </Picker>
        </View>
      </View>
      
      {/* Alcohol */}
      <View style={styles.section}>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Include Alcohol in Plan</Text>
          <Switch
            value={includeAlcohol}
            onValueChange={setIncludeAlcohol}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={includeAlcohol ? colors.primary : colors.textSecondary}
          />
        </View>
        
        {includeAlcohol && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.label}>Daily Alcohol Servings (max 2 recommended)</Text>
            <TextInput
              style={styles.input}
              value={alcoholServings}
              onChangeText={setAlcoholServings}
              keyboardType="numeric"
              placeholder="2"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        )}
      </View>
      
      {/* Review & Customize Button - Only show this for new profiles or when editing */}
      {calculatedTargets && (
        <TouchableOpacity
          style={styles.calculateButton}
          onPress={handleReviewTargets}
        >
          <Text style={styles.calculateButtonText}>Review & Customize Targets</Text>
        </TouchableOpacity>
      )}
      
      {/* Save Profile Button - Only show for existing profiles that want to save without customizing */}
      {hasExistingProfile && calculatedTargets && (
        <TouchableOpacity 
          style={[styles.calculateButton, { marginTop: 12, backgroundColor: colors.textSecondary }]} 
          onPress={handleSaveProfile}
        >
          <Text style={styles.calculateButtonText}>Save Profile Without Customizing</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
