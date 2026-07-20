
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { EXERCISE_CATEGORIES, ExerciseCategory, ExerciseEntry } from '@/types';
import { saveExerciseEntry, loadDailyPortions, saveDailyPortions } from '@/utils/storage';
import { getTodayString } from '@/utils/dateUtils';
import { useTranslation } from 'react-i18next';

const DURATION_STEP = 5;
const DURATION_MIN = 5;
const DURATION_MAX = 180;
const DURATION_DEFAULT = 30;

export default function LogExerciseScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | null>(null);
  const [duration, setDuration] = useState(DURATION_DEFAULT);
  const [saving, setSaving] = useState(false);

  const handleDecrement = () => {
    setDuration((d) => Math.max(DURATION_MIN, d - DURATION_STEP));
  };

  const handleIncrement = () => {
    setDuration((d) => Math.min(DURATION_MAX, d + DURATION_STEP));
  };

  const handleSave = async () => {
    if (!selectedCategory || saving) return;
    setSaving(true);
    try {
      const date = getTodayString();
      const entry: ExerciseEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        date,
        category: selectedCategory,
        durationMinutes: duration,
        timestamp: Date.now(),
      };
      console.log('[LogExercise] Saving entry:', entry);
      await saveExerciseEntry(entry);

      // Reflect "logged something today" in the existing exercise portion counter
      // (feeds onboarding targets/adherence elsewhere) without touching that logic itself.
      const dailyPortions = await loadDailyPortions(date);
      await saveDailyPortions({
        ...dailyPortions,
        portions: {
          ...dailyPortions.portions,
          exercise: dailyPortions.portions.exercise + 1,
        },
      });

      router.back();
    } catch (error) {
      console.error('[LogExercise] Error saving entry:', error);
      Alert.alert(t('common.error'), t('logExercise.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('logExercise.title'),
          headerBackTitle: t('common.back'),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>{t('logExercise.whatDidYouDo')}</Text>
        {EXERCISE_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.value;
          return (
            <TouchableOpacity
              key={cat.value}
              style={[styles.categoryItem, isSelected && styles.categoryItemSelected]}
              onPress={() => {
                console.log('[LogExercise] Category selected:', cat.value);
                setSelectedCategory(cat.value);
              }}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={styles.categoryLabel}>{t(`logExercise.categories.${cat.value}`)}</Text>
              {isSelected && (
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={22}
                  color={colors.primary}
                />
              )}
            </TouchableOpacity>
          );
        })}

        <Text style={[styles.sectionTitle, styles.durationSectionTitle]}>{t('logExercise.howLong')}</Text>
        <View style={styles.durationRow}>
          <TouchableOpacity style={styles.stepperBtn} onPress={handleDecrement}>
            <Text style={styles.stepperBtnText}>−</Text>
          </TouchableOpacity>
          <View style={styles.durationValueContainer}>
            <Text style={styles.durationValue}>{duration}</Text>
            <Text style={styles.durationUnit}>{t('logExercise.minutes')}</Text>
          </View>
          <TouchableOpacity style={styles.stepperBtn} onPress={handleIncrement}>
            <Text style={styles.stepperBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, (!selectedCategory || saving) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!selectedCategory || saving}
        >
          <Text style={styles.saveButtonText}>{t('logExercise.saveActivity')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 14,
  },
  durationSectionTitle: {
    marginTop: 28,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    marginBottom: 10,
    borderRadius: 14,
    gap: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryItemSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  categoryIcon: {
    fontSize: 22,
  },
  categoryLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 8,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 24,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  durationValueContainer: {
    alignItems: 'center',
    minWidth: 90,
  },
  durationValue: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  durationUnit: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  saveButton: {
    marginTop: 32,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
