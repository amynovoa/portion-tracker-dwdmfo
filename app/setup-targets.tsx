
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { calculateRecommendedTargets } from '@/utils/portionCalculator';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Sex, Goal, ActivityLevel, PortionTargets } from '@/types';
import { saveProfile } from '@/utils/storage';
import { Picker } from '@react-native-picker/picker';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 30,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  pickerContainer: {
    width: 80,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
    width: 80,
  },
  buttonContainer: {
    marginTop: 20,
  },
});

export default function SetupTargetsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [targets, setTargets] = useState<PortionTargets>({
    protein: 3,
    veggies: 4,
    fruits: 2,
    wholeGrains: 2,
    nutsSeeds: 2,
    fats: 2,
    water: 8,
    exercise: 3,
  });

  useEffect(() => {
    console.log('Setup targets - Received params:', params);
    
    if (params.sex && params.weight && params.goal) {
      const sex = params.sex as Sex;
      const weight = parseFloat(params.weight as string);
      const goal = params.goal as Goal;
      const activityLevel = (params.activityLevel as ActivityLevel) || 'moderate';

      console.log('Calculating recommended targets for:', { sex, weight, goal, activityLevel });

      const recommended = calculateRecommendedTargets(sex, weight, goal, activityLevel);
      console.log('Recommended targets:', recommended);
      setTargets(recommended);
    } else {
      console.warn('Missing required params for target calculation');
    }
  }, [params]);

  const handleSave = async () => {
    try {
      console.log('Saving profile with targets:', targets);

      if (!params.sex || !params.weight || !params.goalWeight || !params.goal) {
        Alert.alert('Error', 'Missing profile information. Please go back and complete all fields.');
        return;
      }

      const profile = {
        sex: params.sex as Sex,
        currentWeight: parseFloat(params.weight as string),
        goalWeight: parseFloat(params.goalWeight as string),
        goal: params.goal as Goal,
        activityLevel: (params.activityLevel as ActivityLevel) || 'moderate',
        portionTargets: targets,
      };

      console.log('Saving profile:', profile);
      await saveProfile(profile);
      console.log('Profile saved successfully');

      // Navigate to the main app
      console.log('Navigating to main app');
      router.replace('/(tabs)/(home)');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save your profile. Please try again.');
    }
  };

  const updateTarget = (key: keyof PortionTargets, value: number) => {
    console.log(`Updating ${key} to ${value}`);
    setTargets((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Set Your Daily Targets</Text>
        <Text style={styles.subtitle}>
          These are recommended based on your profile. You can adjust them to fit your needs.
        </Text>

        <View style={styles.section}>
          <TargetRow
            label="🍗 Protein"
            value={targets.protein}
            onChange={(val) => updateTarget('protein', val)}
          />
          <TargetRow
            label="🥦 Vegetables"
            value={targets.veggies}
            onChange={(val) => updateTarget('veggies', val)}
          />
          <TargetRow
            label="🍎 Fruit"
            value={targets.fruits}
            onChange={(val) => updateTarget('fruits', val)}
          />
          <TargetRow
            label="🌾 Whole Grains"
            value={targets.wholeGrains}
            onChange={(val) => updateTarget('wholeGrains', val)}
          />
          <TargetRow
            label="🥜 Nuts & Seeds"
            value={targets.nutsSeeds}
            onChange={(val) => updateTarget('nutsSeeds', val)}
          />
          <TargetRow
            label="🥑 Fats"
            value={targets.fats}
            onChange={(val) => updateTarget('fats', val)}
          />
          <TargetRow
            label="💧 Water"
            value={targets.water}
            onChange={(val) => updateTarget('water', val)}
          />
          <TargetRow
            label="💪 Exercise"
            value={targets.exercise}
            onChange={(val) => updateTarget('exercise', val)}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={buttonStyles.primary} onPress={handleSave}>
            <Text style={buttonStyles.primaryText}>Save & Start Tracking</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TargetRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
}) {
  const options = Array.from({ length: 16 }, (_, i) => i);

  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={value}
          onValueChange={(itemValue) => onChange(itemValue as number)}
          style={styles.picker}
        >
          {options.map((num) => (
            <Picker.Item key={num} label={num.toString()} value={num} />
          ))}
        </Picker>
      </View>
    </View>
  );
}
