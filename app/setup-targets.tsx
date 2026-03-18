
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { calculateRecommendedTargets } from '@/utils/portionCalculator';
import { saveProfile } from '@/utils/storage';
import { recordTargetsSaved } from '@/utils/reviewManager';
import { colors, buttonStyles } from '@/styles/commonStyles';
import { Sex, Goal, ActivityLevel, PortionTargets, FOOD_GROUPS } from '@/types';
import { IconSymbol } from '@/components/IconSymbol';

const PICKER_HEIGHT = 216;

type PickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: number) => void;
  selectedValue: number;
  title: string;
  maxValue?: number;
};

function PickerModal({ visible, onClose, onSelect, selectedValue, title, maxValue = 15 }: PickerModalProps) {
  const [tempValue, setTempValue] = useState(selectedValue);
  const options = Array.from({ length: maxValue + 1 }, (_, i) => i);

  useEffect(() => {
    if (visible) {
      console.log('PickerModal opened with value:', selectedValue);
      setTempValue(selectedValue);
    }
  }, [visible, selectedValue]);

  const handleDone = () => {
    console.log('PickerModal Done button pressed, value:', tempValue);
    onSelect(tempValue);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.pickerModalOverlay}
      >
        <TouchableOpacity 
          style={styles.pickerModalBackdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View style={styles.pickerModalContainer}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <TouchableOpacity onPress={onClose} style={styles.pickerModalButton}>
                <Text style={styles.pickerModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.pickerModalTitle} numberOfLines={1}>{title}</Text>
              <TouchableOpacity onPress={handleDone} style={styles.pickerModalButton}>
                <Text style={[styles.pickerModalButtonText, styles.pickerModalDoneButton]}>Done</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={tempValue}
                onValueChange={(value) => {
                  console.log('Picker value changed to:', value);
                  setTempValue(value);
                }}
                style={styles.pickerModalPicker}
                itemStyle={styles.pickerItem}
              >
                {options.map((num) => (
                  <Picker.Item key={num} label={`${num}`} value={num} color={colors.text} />
                ))}
              </Picker>
            </View>
          </View>
          <SafeAreaView edges={['bottom']} style={styles.safeAreaBottom} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function SetupTargetsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  // Extract specific param values to avoid infinite loop
  const sex = params.sex as string;
  const weight = params.weight as string;
  const goalWeight = params.goalWeight as string;
  const goal = params.goal as string;
  const activityLevel = params.activityLevel as string;
  const includeAlcohol = params.includeAlcohol as string;
  const alcoholGoal = params.alcoholGoal as string;
  
  const [targets, setTargets] = useState<PortionTargets>({
    protein: 3,
    veggies: 4,
    fruits: 2,
    wholeGrains: 2,
    nutsSeeds: 2,
    fats: 2,
    water: 8,
    exercise: 0,
    alcohol: 0,
  });

  const [activePickerKey, setActivePickerKey] = useState<keyof PortionTargets | null>(null);

  useEffect(() => {
    console.log('SetupTargetsScreen calculating targets');
    if (sex && weight && goal) {
      const parsedWeight = parseFloat(weight);
      const parsedActivityLevel = (activityLevel as ActivityLevel) || 'moderate';
      const shouldIncludeAlcohol = includeAlcohol === 'true';
      const parsedAlcoholGoal = shouldIncludeAlcohol ? parseInt(alcoholGoal) || 0 : 0;

      console.log('Calculating recommended targets with:', { 
        sex, 
        weight: parsedWeight, 
        goal, 
        activityLevel: parsedActivityLevel, 
        includeAlcohol: shouldIncludeAlcohol, 
        alcoholGoal: parsedAlcoholGoal 
      });
      
      const recommended = calculateRecommendedTargets(
        sex as Sex, 
        parsedWeight, 
        goal as Goal, 
        parsedActivityLevel
      );
      recommended.alcohol = parsedAlcoholGoal;
      recommended.exercise = 0;
      
      console.log('Recommended targets:', recommended);
      setTargets(recommended);
    } else {
      console.log('Missing required params, using defaults');
    }
  }, [sex, weight, goal, activityLevel, includeAlcohol, alcoholGoal]);

  const handleSave = async () => {
    console.log('Saving profile with targets:', targets);
    
    try {
      const shouldIncludeAlcohol = includeAlcohol === 'true';
      const profile = {
        sex: sex as Sex,
        currentWeight: parseFloat(weight),
        goalWeight: parseFloat(goalWeight),
        goal: goal as Goal,
        activityLevel: (activityLevel as ActivityLevel) || 'moderate',
        includeAlcohol: shouldIncludeAlcohol,
        alcoholServings: targets.alcohol,
        portionTargets: targets,
      };

      console.log('Profile to save:', profile);
      await saveProfile(profile);
      console.log('Profile saved successfully');
      
      // Record that targets were saved for review metrics
      await recordTargetsSaved();
      
      // Navigate to welcome with showPaywall flag — paywall is the next step after setup
      console.log('[SetupTargets] Profile saved — navigating to /welcome to show paywall');
      router.replace({ pathname: '/welcome', params: { showPaywall: 'true' } });
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  const updateTarget = (key: keyof PortionTargets, value: number) => {
    console.log(`Updating ${key} to ${value}`);
    setTargets((prev) => ({ ...prev, [key]: value }));
  };

  const getIconForFoodGroup = (key: keyof PortionTargets): string => {
    const foodGroup = FOOD_GROUPS.find(fg => fg.key === key);
    return foodGroup?.icon || '📊';
  };

  const getLabelForKey = (key: keyof PortionTargets): string => {
    const labels: Record<keyof PortionTargets, string> = {
      protein: 'Protein',
      veggies: 'Vegetables',
      fruits: 'Fruit',
      wholeGrains: 'Whole Grains',
      nutsSeeds: 'Nuts & Seeds',
      fats: 'Fats',
      water: 'Water (cups)',
      exercise: 'Exercise',
      alcohol: 'Alcohol',
    };
    return labels[key];
  };

  const targetKeys: (keyof PortionTargets)[] = [
    'protein',
    'veggies',
    'fruits',
    'wholeGrains',
    'nutsSeeds',
    'fats',
    'water',
    'alcohol',
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Set Your Daily Targets</Text>
          <Text style={styles.subtitle}>
            We&apos;ve recommended targets based on your profile. You can adjust them to fit your preferences.
          </Text>

          {targetKeys.map((key) => {
            const targetValue = targets[key];
            const labelText = getLabelForKey(key);
            const iconEmoji = getIconForFoodGroup(key);
            
            return (
              <View key={key} style={styles.row}>
                <View style={styles.labelContainer}>
                  <Text style={styles.icon}>{iconEmoji}</Text>
                  <Text style={styles.rowLabel}>{labelText}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.valueButton}
                  onPress={() => {
                    console.log(`Opening picker for ${key}, current value: ${targetValue}`);
                    setActivePickerKey(key);
                  }}
                >
                  <Text style={styles.valueText}>{targetValue}</Text>
                  <IconSymbol 
                    ios_icon_name="chevron.down" 
                    android_material_icon_name="arrow-drop-down" 
                    size={20} 
                    color={colors.text} 
                  />
                </TouchableOpacity>
              </View>
            );
          })}

          <View style={styles.noteSection}>
            <Text style={styles.noteIcon}>💪</Text>
            <Text style={styles.noteText}>
              Exercise can be tracked daily on the tracking page, but doesn&apos;t have a numeric target.
            </Text>
          </View>

          <View style={styles.noteSection}>
            <Text style={styles.noteIcon}>🍷</Text>
            <Text style={styles.noteText}>
              You can set your alcohol target to 0 if you don&apos;t drink, or adjust it to match your goals. Recommended maximum is 2 servings per day.
            </Text>
          </View>

          <TouchableOpacity style={buttonStyles.primary} onPress={handleSave}>
            <Text style={buttonStyles.primaryText}>Save & Continue</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Picker Modal */}
      {activePickerKey && (
        <PickerModal
          visible={activePickerKey !== null}
          onClose={() => {
            console.log('Closing picker modal');
            setActivePickerKey(null);
          }}
          onSelect={(value) => {
            console.log(`Selected value ${value} for ${activePickerKey}`);
            updateTarget(activePickerKey, value);
            setActivePickerKey(null);
          }}
          selectedValue={targets[activePickerKey]}
          title={getLabelForKey(activePickerKey)}
          maxValue={15}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
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
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
  },
  valueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 70,
    justifyContent: 'space-between',
  },
  valueText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  noteSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  // Picker Modal Styles
  pickerModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  pickerModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerModalContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
  },
  pickerModalContent: {
    backgroundColor: colors.surface,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    minHeight: 56,
  },
  pickerModalButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 70,
  },
  pickerModalButtonText: {
    fontSize: 17,
    color: colors.primary,
  },
  pickerModalDoneButton: {
    fontWeight: '600',
  },
  pickerModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  pickerContainer: {
    height: PICKER_HEIGHT,
    justifyContent: 'center',
  },
  pickerModalPicker: {
    width: '100%',
    height: '100%',
  },
  pickerItem: {
    fontSize: 20,
    height: 120,
    color: colors.text,
  },
  safeAreaBottom: {
    backgroundColor: colors.surface,
  },
});
