
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { PortionTargets, Sex, Goal, ActivityLevel, UserProfile } from '@/types';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { saveProfile } from '@/utils/storage';
import AppLogo from '@/components/AppLogo';

export default function SetupTargetsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Profile data from params
  const [sex, setSex] = useState<Sex>('prefer-not-to-say');
  const [currentWeight, setCurrentWeight] = useState<number>(0);
  const [goalWeight, setGoalWeight] = useState<number | undefined>(undefined);
  const [goal, setGoal] = useState<Goal>('maintain');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [includeAlcohol, setIncludeAlcohol] = useState(false);
  const [alcoholServings, setAlcoholServings] = useState<number>(2);
  
  // Initialize with default values or passed values
  const [targets, setTargets] = useState<PortionTargets>({
    protein: 3,
    veggies: 4,
    fruit: 2,
    wholeGrains: 2,
    nutsSeeds: 2,
    fats: 2,
    water: 8,
    alcohol: 0,
  });

  useEffect(() => {
    // Parse all profile data from params
    if (params.sex) setSex(params.sex as Sex);
    if (params.currentWeight) setCurrentWeight(parseFloat(params.currentWeight as string));
    if (params.goalWeight) {
      const gw = parseFloat(params.goalWeight as string);
      if (!isNaN(gw)) setGoalWeight(gw);
    }
    if (params.goal) setGoal(params.goal as Goal);
    if (params.activityLevel) setActivityLevel(params.activityLevel as ActivityLevel);
    if (params.includeAlcohol) setIncludeAlcohol(params.includeAlcohol === 'true');
    if (params.alcoholServings) setAlcoholServings(parseInt(params.alcoholServings as string));
    
    // Parse targets if provided
    if (params.targets) {
      try {
        const parsedTargets = JSON.parse(params.targets as string);
        setTargets(parsedTargets);
      } catch (error) {
        console.error('Error parsing targets:', error);
      }
    }
  }, [params]);

  const handleUpdateTargets = (key: keyof PortionTargets, value: string) => {
    const numValue = parseInt(value) || 0;
    setTargets({
      ...targets,
      [key]: Math.max(0, numValue),
    });
  };

  const handleSaveTargets = async () => {
    // Validate that at least some targets are set
    const hasTargets = Object.values(targets).some(val => val > 0);
    
    if (!hasTargets) {
      Alert.alert('Invalid Targets', 'Please set at least one portion target greater than 0.');
      return;
    }

    if (!currentWeight || currentWeight <= 0) {
      Alert.alert('Error', 'Invalid profile data. Please go back and check your inputs.');
      return;
    }

    // Create the complete profile with customized targets
    const profile: UserProfile = {
      sex,
      currentWeight,
      goalWeight,
      goal,
      activityLevel,
      includeAlcohol,
      alcoholServings: includeAlcohol ? alcoholServings : undefined,
      portionTargets: targets,
    };

    try {
      await saveProfile(profile);
      Alert.alert('Success', 'Your profile and targets have been saved!', [
        { 
          text: 'OK', 
          onPress: () => {
            // Navigate to home screen
            router.replace('/(tabs)/(home)');
          }
        }
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  const foodGroupLabels: { key: keyof PortionTargets; label: string; icon: string }[] = [
    { key: 'protein', label: 'Protein', icon: '🥩' },
    { key: 'veggies', label: 'Veggies', icon: '🥦' },
    { key: 'fruit', label: 'Fruit', icon: '🍎' },
    { key: 'wholeGrains', label: 'Whole Grains', icon: '🌾' },
    { key: 'nutsSeeds', label: 'Nuts & Seeds', icon: '🥜' },
    { key: 'fats', label: 'Fats', icon: '🥑' },
    { key: 'water', label: 'Water', icon: '💧' },
    { key: 'alcohol', label: 'Alcohol', icon: '🍷' },
  ];

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <AppLogo size={60} />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Customize Your Targets</Text>
          <Text style={styles.subtitle}>Review and adjust your daily portion goals</Text>
        </View>

        {/* Tip moved above portions */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Tip: These targets are personalized based on your profile. Adjust them to match your preferences and lifestyle.
          </Text>
        </View>

        <View style={styles.targetsSection}>
          {foodGroupLabels.map((group) => (
            <View key={group.key} style={styles.targetRow}>
              <View style={styles.targetLabelContainer}>
                <Text style={styles.targetIcon}>{group.icon}</Text>
                <Text style={styles.targetLabel}>{group.label}</Text>
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.targetInput}
                  value={targets[group.key].toString()}
                  onChangeText={(text) => handleUpdateTargets(group.key, text)}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={styles.portionsText}>portions</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={[buttonStyles.primary, styles.button]} onPress={handleSaveTargets}>
          <Text style={commonStyles.buttonText}>Save Profile & Targets</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[buttonStyles.outline, styles.button]}
          onPress={() => router.back()}
        >
          <Text style={commonStyles.buttonTextOutline}>Go Back</Text>
        </TouchableOpacity>

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
  infoBox: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    fontWeight: '600',
  },
  targetsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  targetLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  targetIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  targetLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  targetInput: {
    width: 60,
    height: 44,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    backgroundColor: colors.highlight,
  },
  portionsText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  button: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  bottomPadding: {
    height: 20,
  },
});
