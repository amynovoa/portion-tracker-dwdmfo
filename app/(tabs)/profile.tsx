
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, Switch } from 'react-native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { Sex, Goal, UserProfile, PortionTargets, ActivityLevel, ACTIVITY_LEVELS } from '@/types';
import { calculateRecommendedTargets } from '@/utils/portionCalculator';
import { saveProfile, loadProfile } from '@/utils/storage';
import { useRouter, useFocusEffect } from 'expo-router';
import AppLogo from '@/components/AppLogo';
import PortionDropdown from '@/components/PortionDropdown';

export default function ProfileScreen() {
  const router = useRouter();
  const [sex, setSex] = useState<Sex>('female');
  const [currentWeight, setCurrentWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [goal, setGoal] = useState<Goal>('maintain');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('sedentary');
  const [includeAlcohol, setIncludeAlcohol] = useState(false);
  const [alcoholServings, setAlcoholServings] = useState('');
  const [targets, setTargets] = useState<PortionTargets | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      console.log('Profile screen focused, loading profile');
      loadExistingProfile();
    }, [])
  );

  useEffect(() => {
    if (targets && currentWeight && goalWeight) {
      console.log('Activity level or alcohol settings changed, recalculating targets...');
      const weight = parseFloat(currentWeight);
      const servings = parseInt(alcoholServings) || 0;
      
      if (!isNaN(weight) && weight > 0) {
        const result = calculateRecommendedTargets(sex, weight, goal, includeAlcohol, servings, activityLevel);
        console.log('Recalculated targets:', result.targets);
        setTargets(result.targets);
      }
    }
  }, [includeAlcohol, alcoholServings, activityLevel]);

  const loadExistingProfile = async () => {
    console.log('Loading existing profile...');
    const profile = await loadProfile();
    if (profile) {
      console.log('Profile found, populating fields:', profile);
      setSex(profile.sex);
      setCurrentWeight(profile.currentWeight.toString());
      setGoalWeight(profile.goalWeight.toString());
      setGoal(profile.goal);
      setActivityLevel(profile.activityLevel || 'sedentary');
      setIncludeAlcohol(profile.includeAlcohol);
      setAlcoholServings(profile.alcoholServings.toString());
      setTargets(profile.targets);
      setHasProfile(true);
      setIsEditing(false);
    } else {
      console.log('No profile found - resetting to clean state');
      setSex('female');
      setCurrentWeight('');
      setGoalWeight('');
      setGoal('maintain');
      setActivityLevel('sedentary');
      setIncludeAlcohol(false);
      setAlcoholServings('');
      setTargets(null);
      setHasProfile(false);
      setIsEditing(false);
    }
  };

  const calculateTargets = () => {
    const weight = parseFloat(currentWeight);
    const goalWt = parseFloat(goalWeight);
    const servings = parseInt(alcoholServings) || 0;

    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid current weight.');
      return;
    }

    if (isNaN(goalWt) || goalWt <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid goal weight.');
      return;
    }

    if (includeAlcohol && servings < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of alcohol servings (0 or more).');
      return;
    }

    const result = calculateRecommendedTargets(sex, weight, goal, includeAlcohol, servings, activityLevel);
    console.log('Calculated targets:', result.targets);
    setTargets(result.targets);
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (isSaving) {
      console.log('Save already in progress, ignoring duplicate call');
      return;
    }

    if (!targets) {
      Alert.alert('Error', 'Please calculate targets first.');
      return;
    }

    const weight = parseFloat(currentWeight);
    const goalWt = parseFloat(goalWeight);
    const servings = parseInt(alcoholServings) || 0;

    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid current weight.');
      return;
    }

    if (isNaN(goalWt) || goalWt <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid goal weight.');
      return;
    }

    if (includeAlcohol && servings < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of alcohol servings (0 or more).');
      return;
    }

    setIsSaving(true);
    console.log('Starting profile save...');

    try {
      const result = calculateRecommendedTargets(sex, weight, goal, includeAlcohol, servings, activityLevel);

      const profile: UserProfile = {
        sex,
        currentWeight: weight,
        goalWeight: goalWt,
        goal,
        activityLevel,
        includeAlcohol,
        alcoholServings: servings,
        sizeCategory: result.sizeCategory,
        targets,
      };

      console.log('Saving profile:', profile);
      await saveProfile(profile);
      
      console.log('Profile saved successfully, verifying...');
      const savedProfile = await loadProfile();
      console.log('Profile verified:', savedProfile);
      
      setHasProfile(true);
      setIsEditing(false);
      
      console.log('Navigating to Track screen...');
      
      // Use replace instead of push to avoid navigation stack issues
      router.replace('/(tabs)/(home)');
      
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateTargets = (key: keyof PortionTargets, value: number) => {
    if (!targets) return;
    setTargets({
      ...targets,
      [key]: Math.max(0, value),
    });
  };

  const formatTargetLabel = (key: string): string => {
    const labels: { [key: string]: string } = {
      protein: 'Protein',
      veggies: 'Vegetables',
      fruit: 'Fruit',
      healthyCarbs: 'Healthy Carbs',
      fats: 'Fats',
      nuts: 'Nuts',
      water: 'Water',
      alcohol: 'Alcohol',
    };
    return labels[key] || key;
  };

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <AppLogo size={60} />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>{hasProfile ? 'Update Profile' : 'Create Profile'}</Text>
          <Text style={styles.subtitle}>Set up your daily portion targets</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.optionButton, sex === 'female' && styles.optionButtonActive]}
              onPress={() => setSex('female')}
              disabled={isSaving}
            >
              <Text style={[styles.optionText, sex === 'female' && styles.optionTextActive]}>Female</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, sex === 'male' && styles.optionButtonActive]}
              onPress={() => setSex('male')}
              disabled={isSaving}
            >
              <Text style={[styles.optionText, sex === 'male' && styles.optionTextActive]}>Male</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Current Weight (lbs)</Text>
          <TextInput
            style={commonStyles.input}
            value={currentWeight}
            onChangeText={setCurrentWeight}
            keyboardType="numeric"
            placeholder="Enter current weight"
            placeholderTextColor={colors.textSecondary}
            editable={!isSaving}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Goal Weight (lbs)</Text>
          <TextInput
            style={commonStyles.input}
            value={goalWeight}
            onChangeText={setGoalWeight}
            keyboardType="numeric"
            placeholder="Enter goal weight"
            placeholderTextColor={colors.textSecondary}
            editable={!isSaving}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Goal</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.optionButton, goal === 'lose' && styles.optionButtonActive]}
              onPress={() => setGoal('lose')}
              disabled={isSaving}
            >
              <Text style={[styles.optionText, goal === 'lose' && styles.optionTextActive]}>Lose Weight</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, goal === 'maintain' && styles.optionButtonActive]}
              onPress={() => setGoal('maintain')}
              disabled={isSaving}
            >
              <Text style={[styles.optionText, goal === 'maintain' && styles.optionTextActive]}>Maintain Weight</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, goal === 'build' && styles.optionButtonActive]}
              onPress={() => setGoal('build')}
              disabled={isSaving}
            >
              <Text style={[styles.optionText, goal === 'build' && styles.optionTextActive]}>Build Muscle</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Activity Level</Text>
          <Text style={styles.helperText}>How active are you on most days?</Text>
          <View style={styles.activityLevelContainer}>
            {ACTIVITY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.key}
                style={[
                  styles.activityLevelButton,
                  activityLevel === level.key && styles.activityLevelButtonActive
                ]}
                onPress={() => setActivityLevel(level.key)}
                disabled={isSaving}
              >
                <Text style={[
                  styles.activityLevelLabel,
                  activityLevel === level.key && styles.activityLevelLabelActive
                ]}>
                  {level.label}
                </Text>
                <Text style={[
                  styles.activityLevelDescription,
                  activityLevel === level.key && styles.activityLevelDescriptionActive
                ]}>
                  {level.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Include alcohol in my daily plan</Text>
            <Switch
              value={includeAlcohol}
              onValueChange={setIncludeAlcohol}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
              disabled={isSaving}
            />
          </View>
        </View>

        {includeAlcohol && (
          <View style={styles.section}>
            <Text style={styles.label}>How many alcoholic drinks per day do you want to budget for?</Text>
            <Text style={styles.helperText}>Suggested range: 0–3 (higher numbers allowed)</Text>
            <TextInput
              style={commonStyles.input}
              value={alcoholServings}
              onChangeText={setAlcoholServings}
              keyboardType="numeric"
              placeholder="Enter number of drinks"
              placeholderTextColor={colors.textSecondary}
              editable={!isSaving}
            />
          </View>
        )}

        {!targets && (
          <>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 Click below to calculate your personalized portion targets based on your profile.
              </Text>
            </View>

            <TouchableOpacity 
              style={[buttonStyles.primary, styles.button]} 
              onPress={calculateTargets}
              disabled={isSaving}
            >
              <Text style={commonStyles.buttonText}>Calculate My Portions</Text>
            </TouchableOpacity>
          </>
        )}

        {targets && (
          <>
            <View style={styles.targetsSection}>
              <Text style={styles.sectionTitle}>Your Daily Portion Targets</Text>
              <Text style={styles.customizeHint}>✏️ You Can Customize These!</Text>

              {Object.entries(targets).map(([key, value]) => (
                <View key={key} style={styles.targetRow}>
                  <Text style={styles.targetLabel}>{formatTargetLabel(key)}</Text>
                  <View style={styles.targetInputContainer}>
                    <PortionDropdown
                      value={value}
                      onValueChange={(newValue) => handleUpdateTargets(key as keyof PortionTargets, newValue)}
                      maxValue={key === 'alcohol' ? 10 : 15}
                    />
                    <Text style={styles.portionsText}>portions</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.saveInfoBox}>
              <Text style={styles.saveInfoText}>
                ✅ Happy with your targets? Save your profile below to start tracking!
              </Text>
            </View>

            <TouchableOpacity 
              style={[buttonStyles.primary, styles.button, isSaving && styles.buttonDisabled]} 
              onPress={handleSaveProfile}
              disabled={isSaving}
            >
              <Text style={commonStyles.buttonText}>
                {isSaving ? 'Saving...' : 'Save Profile & Go to Track'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[buttonStyles.outline, styles.button]}
              onPress={() => {
                setTargets(null);
                setIsEditing(false);
              }}
              disabled={isSaving}
            >
              <Text style={commonStyles.buttonTextOutline}>Start Over</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 48,
    paddingBottom: 120,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    paddingHorizontal: 16,
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
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  optionButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.highlight,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  optionTextActive: {
    color: colors.primary,
  },
  activityLevelContainer: {
    gap: 10,
  },
  activityLevelButton: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  activityLevelButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.highlight,
  },
  activityLevelLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  activityLevelLabelActive: {
    color: colors.primary,
  },
  activityLevelDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  activityLevelDescriptionActive: {
    color: colors.primary,
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    flexShrink: 1,
  },
  infoBox: {
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: colors.highlight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  saveInfoBox: {
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: colors.highlight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  saveInfoText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    fontWeight: '600',
  },
  button: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  targetsSection: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  customizeHint: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 16,
    fontWeight: '600',
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
  targetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  portionsText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  bottomPadding: {
    height: 20,
  },
});
