
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { Sex, Goal, ActivityLevel, PortionTargets } from '@/types';
import { calculateRecommendedTargets } from '@/utils/portionCalculator';
import { saveProfile } from '@/utils/storage';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SetupTargetsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const sex = (params.sex as Sex) || 'female';
  const weight = parseFloat(params.weight as string) || 150;
  const goalWeight = parseFloat(params.goalWeight as string) || 150;
  const goal = (params.goal as Goal) || 'maintain';
  const activityLevel = (params.activityLevel as ActivityLevel) || 'moderate';

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
    const recommended = calculateRecommendedTargets(
      sex,
      weight,
      goal,
      activityLevel
    );
    setTargets(recommended);
  }, []);

  const handleSave = async () => {
    await saveProfile({
      sex,
      currentWeight: weight,
      goalWeight,
      goal,
      activityLevel,
      portionTargets: targets,
    });
    router.replace('/(tabs)/(home)/');
  };

  const updateTarget = (key: keyof PortionTargets, value: number) => {
    setTargets({ ...targets, [key]: value });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.tip}>💡 Tip</Text>
        <Text style={styles.tipText}>
          These targets are based on your profile. You can adjust them anytime.
        </Text>

        <Text style={styles.title}>Daily Portion Targets</Text>

        <View style={styles.targetsList}>
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

        <TouchableOpacity style={buttonStyles.primary} onPress={handleSave}>
          <Text style={buttonStyles.primaryText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function TargetRow({ label, value, onChange }: { label: string; value: number; onChange: (val: number) => void }) {
  return (
    <View style={styles.targetRow}>
      <Text style={styles.targetLabel}>{label}</Text>
      <View style={styles.targetPickerContainer}>
        <Picker
          selectedValue={value}
          onValueChange={onChange}
          style={styles.targetPicker}
        >
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
            <Picker.Item key={num} label={`${num}`} value={num} />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  tip: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  targetsList: {
    marginBottom: 32,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  targetLabel: {
    fontSize: 17,
    color: colors.text,
    flex: 1,
  },
  targetPickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    minWidth: 80,
  },
  targetPicker: {
    height: 44,
    width: 80,
  },
});
