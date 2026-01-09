
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
  const includeAlcohol = params.includeAlcohol === 'true';
  const alcoholServings = parseInt(params.alcoholServings as string) || 0;

  const [targets, setTargets] = useState<PortionTargets>({
    protein: 3,
    veggies: 4,
    fruit: 2,
    wholeGrains: 2,
    fats: 2,
    nutsSeeds: 2,
    water: 8,
    alcohol: 0,
  });

  useEffect(() => {
    const recommended = calculateRecommendedTargets(
      sex,
      weight,
      goal,
      includeAlcohol,
      alcoholServings,
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
      includeAlcohol,
      alcoholServings,
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
        <Text style={styles.title}>👍 You Can Customize These:</Text>

        <View style={styles.targetsList}>
          <TargetRow
            label="🥩 Protein"
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
            value={targets.fruit}
            onChange={(val) => updateTarget('fruit', val)}
          />
          <TargetRow
            label="🌾 Whole Grains"
            value={targets.wholeGrains}
            onChange={(val) => updateTarget('wholeGrains', val)}
          />
          <TargetRow
            label="🥑 Fats"
            value={targets.fats}
            onChange={(val) => updateTarget('fats', val)}
          />
          <TargetRow
            label="🥜 Nuts & Seeds"
            value={targets.nutsSeeds}
            onChange={(val) => updateTarget('nutsSeeds', val)}
          />
          <TargetRow
            label="💧 Water"
            value={targets.water}
            onChange={(val) => updateTarget('water', val)}
          />
          <TargetRow
            label="🍷 Alcohol"
            value={targets.alcohol}
            onChange={(val) => updateTarget('alcohol', val)}
          />
        </View>

        <View style={styles.callout}>
          <Text style={styles.calloutText}>
            💡 These targets are based on your profile. You can adjust them anytime in Settings.
          </Text>
        </View>

        <TouchableOpacity style={buttonStyles.primary} onPress={handleSave}>
          <Text style={buttonStyles.primaryText}>Save & Start Tracking</Text>
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
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <Picker.Item key={num} label={`${num}`} value={num} />
          ))}
        </Picker>
        <Text style={styles.portionsText}>portions</Text>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  targetsList: {
    marginBottom: 24,
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
    fontSize: 18,
    color: colors.text,
    flex: 1,
  },
  targetPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  targetPicker: {
    width: 80,
    height: 40,
  },
  portionsText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  callout: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  calloutText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
});
