
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, Switch } from 'react-native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { Sex, Goal, UserProfile, PortionTargets } from '@/types';
import { calculateRecommendedTargets } from '@/utils/portionCalculator';
import { saveProfile, loadProfile } from '@/utils/storage';
import { useRouter, useFocusEffect } from 'expo-router';
import AppLogo from '@/components/AppLogo';

export default function ProfileScreen() {
  const router = useRouter();
  const [sex, setSex] = useState<Sex>('female');
  const [currentWeight, setCurrentWeight] = useState('');
  const [goal, setGoal] = useState<Goal>('maintain');
  const [includeAlcohol, setIncludeAlcohol] = useState(false);
  const [alcoholServings, setAlcoholServings] = useState('1');
  const [targets, setTargets] = useState<PortionTargets | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  // Load profile when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Profile screen focused, loading profile');
      loadExistingProfile();
    }, [])
  );

  const loadExistingProfile = async () => {
    console.log('Loading existing profile...');
    const profile = await loadProfile();
    if (profile) {
      console.log('Profile found, populating fields:', profile);
      setSex(profile.sex);
      setCurrentWeight(profile.currentWeight.toString());
      setGoal(profile.goal);
      setIncludeAlcohol(profile.includeAlcohol);
      setAlcoholServings(profile.alcoholServings.toString());
      setTargets(profile.targets);
      setHasProfile(true);
      setIsEditing(false);
    } else {
      console.log('No profile found - resetting to clean state');
      // Reset all state to ensure clean setup
      setSex('female');
      setCurrentWeight('');
      setGoal('maintain');
      setIncludeAlcohol(false);
      setAlcoholServings('1');
      setTargets(null);
      setHasProfile(false);
      setIsEditing(false);
    }
  };

  const calculateTargets = () => {
    const weight = parseFloat(currentWeight);
    const servings = parseInt(alcoholServings) || 0;

    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid current weight.');
      return;
    }

    if (includeAlcohol && servings < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of alcohol servings (0 or more).');
      return;
    }

    const result = calculateRecommendedTargets(sex, weight, goal, includeAlcohol, servings);
    setTargets(result.targets);
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!targets) {
      Alert.alert('Error', 'Please calculate targets first.');
      return;
    }

    const weight = parseFloat(currentWeight);
    const servings = parseInt(alcoholServings) || 0;

    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid current weight.');
      return;
    }

    if (includeAlcohol && servings < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of alcohol servings (0 or more).');
      return;
    }

    // Calculate size category for storage
    const result = calculateRecommendedTargets(sex, weight, goal, includeAlcohol, servings);

    const profile: UserProfile = {
      sex,
      currentWeight: weight,
      goal,
      includeAlcohol,
      alcoholServings: servings,
      sizeCategory: result.sizeCategory,
      targets,
    };

    console.log('Saving profile:', profile);
    await saveProfile(profile);
    
    // Verify the profile was saved
    const savedProfile = await loadProfile();
    console.log('Profile saved and verified:', savedProfile);
    
    Alert.alert('Success', 'Profile saved successfully!', [
      {
        text: 'OK',
        onPress: () => {
          setHasProfile(true);
          setIsEditing(false);
          // Navigate to home screen
          console.log('Navigating to home screen');
          router.replace('/(tabs)/(home)/');
        },
      },
    ]);
  };

  const handleUpdateTargets = (key: keyof PortionTargets, value: string) => {
    if (!targets) return;
    const numValue = parseInt(value) || 0;
    setTargets({
      ...targets,
      [key]: Math.max(0, numValue),
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
            >
              <Text style={[styles.optionText, sex === 'female' && styles.optionTextActive]}>Female</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, sex === 'male' && styles.optionButtonActive]}
              onPress={() => setSex('male')}
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
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Goal</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.optionButton, goal === 'lose' && styles.optionButtonActive]}
              onPress={() => setGoal('lose')}
            >
              <Text style={[styles.optionText, goal === 'lose' && styles.optionTextActive]}>Lose Weight</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, goal === 'maintain' && styles.optionButtonActive]}
              onPress={() => setGoal('maintain')}
            >
              <Text style={[styles.optionText, goal === 'maintain' && styles.optionTextActive]}>Maintain Weight</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, goal === 'build' && styles.optionButtonActive]}
              onPress={() => setGoal('build')}
            >
              <Text style={[styles.optionText, goal === 'build' && styles.optionTextActive]}>Build Muscle</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Include alcohol in my daily plan</Text>
            <Switch
              value={includeAlcohol}
              onValueChange={setIncludeAlcohol}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
            />
          </View>
        </View>

        {includeAlcohol && (
          <View style={styles.section}>
            <Text style={styles.label}>How many alcoholic drinks per day do you want to budget for?</Text>
            <Text style={styles.helperText}>Suggested range: 0–5 (higher numbers allowed)</Text>
            <TextInput
              style={commonStyles.input}
              value={alcoholServings}
              onChangeText={setAlcoholServings}
              keyboardType="numeric"
              placeholder="Enter number of drinks"
              placeholderTextColor={colors.textSecondary}
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

            <TouchableOpacity style={[buttonStyles.primary, styles.button]} onPress={calculateTargets}>
              <Text style={commonStyles.buttonText}>Calculate My Portions</Text>
            </TouchableOpacity>
          </>
        )}

        {targets && (
          <>
            <View style={styles.targetsSection}>
              <Text style={styles.sectionTitle}>Daily Portion Targets</Text>
              <Text style={styles.sectionSubtitle}>You can adjust these values if needed</Text>

              {Object.entries(targets).map(([key, value]) => (
                <View key={key} style={styles.targetRow}>
                  <Text style={styles.targetLabel}>{formatTargetLabel(key)}</Text>
                  <View style={styles.targetInputContainer}>
                    <TextInput
                      style={styles.targetInput}
                      value={value.toString()}
                      onChangeText={(text) => handleUpdateTargets(key as keyof PortionTargets, text)}
                      keyboardType="numeric"
                      maxLength={2}
                    />
                    <Text style={styles.portionsText}>portions</Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity style={[buttonStyles.primary, styles.button]} onPress={handleSaveProfile}>
              <Text style={commonStyles.buttonText}>Save Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[buttonStyles.outline, styles.button]}
              onPress={() => {
                setTargets(null);
                setIsEditing(false);
              }}
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  button: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  targetsSection: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
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
  targetInput: {
    width: 60,
    height: 40,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    backgroundColor: colors.card,
  },
  portionsText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  bottomPadding: {
    height: 20,
  },
});
