
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { Sex, Goal, UserProfile, PortionTargets } from '@/types';
import { calculateRecommendedTargets } from '@/utils/portionCalculator';
import { saveProfile, loadProfile } from '@/utils/storage';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  const [sex, setSex] = useState<Sex>('female');
  const [currentWeight, setCurrentWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [goal, setGoal] = useState<Goal>('maintain');
  const [alcoholGoal, setAlcoholGoal] = useState('0');
  const [targets, setTargets] = useState<PortionTargets | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
    const profile = await loadProfile();
    if (profile) {
      setSex(profile.sex);
      setCurrentWeight(profile.currentWeight.toString());
      setGoalWeight(profile.goalWeight.toString());
      setGoal(profile.goal);
      setAlcoholGoal(profile.alcoholGoal.toString());
      setTargets(profile.targets);
      setHasProfile(true);
    }
  };

  const calculateTargets = () => {
    const weight = parseFloat(currentWeight);
    const alcohol = Math.min(2, parseInt(alcoholGoal) || 0);

    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid current weight.');
      return;
    }

    const recommended = calculateRecommendedTargets(sex, weight, goal, alcohol);
    setTargets(recommended);
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!targets) {
      Alert.alert('Error', 'Please calculate targets first.');
      return;
    }

    const weight = parseFloat(currentWeight);
    const goalWt = parseFloat(goalWeight);

    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid current weight.');
      return;
    }

    if (isNaN(goalWt) || goalWt <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid goal weight.');
      return;
    }

    const profile: UserProfile = {
      sex,
      currentWeight: weight,
      goalWeight: goalWt,
      goal,
      alcoholGoal: Math.min(2, parseInt(alcoholGoal) || 0),
      targets,
    };

    await saveProfile(profile);
    Alert.alert('Success', 'Profile saved successfully!', [
      {
        text: 'OK',
        onPress: () => {
          setHasProfile(true);
          setIsEditing(false);
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

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{hasProfile ? 'Update Profile' : 'Create Profile'}</Text>
          <Text style={styles.subtitle}>Set up your daily portion targets</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Sex</Text>
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
            <TouchableOpacity
              style={[styles.optionButton, sex === 'prefer-not-to-say' && styles.optionButtonActive]}
              onPress={() => setSex('prefer-not-to-say')}
            >
              <Text style={[styles.optionText, sex === 'prefer-not-to-say' && styles.optionTextActive]}>Prefer not to say</Text>
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
          <Text style={styles.label}>Goal Weight (lbs)</Text>
          <TextInput
            style={commonStyles.input}
            value={goalWeight}
            onChangeText={setGoalWeight}
            keyboardType="numeric"
            placeholder="Enter goal weight"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Primary Goal</Text>
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
              <Text style={[styles.optionText, goal === 'maintain' && styles.optionTextActive]}>Maintain</Text>
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
          <Text style={styles.label}>Daily Alcohol Goal (max 2)</Text>
          <TextInput
            style={commonStyles.input}
            value={alcoholGoal}
            onChangeText={(text) => {
              const num = parseInt(text) || 0;
              setAlcoholGoal(Math.min(2, num).toString());
            }}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {!targets && (
          <TouchableOpacity style={[buttonStyles.primary, styles.button]} onPress={calculateTargets}>
            <Text style={commonStyles.buttonText}>Calculate Targets</Text>
          </TouchableOpacity>
        )}

        {targets && (
          <>
            <View style={styles.targetsSection}>
              <Text style={styles.sectionTitle}>Daily Portion Targets</Text>
              <Text style={styles.sectionSubtitle}>You can adjust these values</Text>

              {Object.entries(targets).map(([key, value]) => (
                <View key={key} style={styles.targetRow}>
                  <Text style={styles.targetLabel}>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</Text>
                  <TextInput
                    style={styles.targetInput}
                    value={value.toString()}
                    onChangeText={(text) => handleUpdateTargets(key as keyof PortionTargets, text)}
                    keyboardType="numeric"
                  />
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
              <Text style={commonStyles.buttonTextOutline}>Recalculate</Text>
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
  targetInput: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    backgroundColor: colors.card,
  },
  bottomPadding: {
    height: 20,
  },
});
