
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { getTodayString } from '@/utils/dateUtils';
import { loadExerciseEntriesForDate, deleteExerciseEntry } from '@/utils/storage';
import { ExerciseEntry, EXERCISE_CATEGORIES } from '@/types';
import AppLogo from '@/components/AppLogo';
import { useTranslation } from 'react-i18next';

export default function ExerciseScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [entries, setEntries] = useState<ExerciseEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    console.log('[ExerciseScreen] Loading today\'s exercise entries...');
    const today = getTodayString();
    const todayEntries = await loadExerciseEntriesForDate(today);
    console.log('[ExerciseScreen] Loaded entries:', todayEntries.length);
    setEntries(todayEntries);
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleLogExercise = () => {
    console.log('[ExerciseScreen] Log Exercise pressed');
    router.push('/log-exercise');
  };

  const handleDeleteExercise = (entry: ExerciseEntry) => {
    Alert.alert(
      t('logExercise.deleteConfirmTitle'),
      t('logExercise.deleteConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            console.log('[ExerciseScreen] Deleting exercise entry:', entry.id);
            await deleteExerciseEntry(entry.id);
            await loadData();
          },
        },
      ]
    );
  };

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <AppLogo size={40} />
          </View>
          <Text style={styles.title}>{t('logExercise.yourActivity')}</Text>
        </View>

        <View style={styles.content}>
          <TouchableOpacity style={styles.logExerciseButton} onPress={handleLogExercise}>
            <Text style={styles.logExerciseButtonText}>+ {t('logExercise.logExerciseButton')}</Text>
          </TouchableOpacity>

          {!isLoading && entries.length === 0 && (
            <Text style={styles.emptyText}>{t('logExercise.emptyToday')}</Text>
          )}

          {entries.map((entry) => {
            const categoryInfo = EXERCISE_CATEGORIES.find((c) => c.value === entry.category);
            const categoryLabel = t(`logExercise.categories.${entry.category}`);
            return (
              <View key={entry.id} style={styles.activityRow}>
                <Text style={styles.activityRowIcon}>{categoryInfo?.icon}</Text>
                <View style={styles.activityRowContent}>
                  <Text style={styles.activityRowLabel}>{categoryLabel}</Text>
                  <Text style={styles.activityRowDuration}>
                    {entry.durationMinutes} {t('logExercise.minutes')}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteExercise(entry)} style={styles.deleteIcon}>
                  <Text style={styles.deleteIconText}>×</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: Platform.OS === 'android' ? 48 : 16,
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    paddingHorizontal: 20,
  },
  logExerciseButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  logExerciseButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 24,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  activityRowIcon: {
    fontSize: 22,
  },
  activityRowContent: {
    flex: 1,
  },
  activityRowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  activityRowDuration: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deleteIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIconText: {
    fontSize: 22,
    color: colors.textSecondary,
    lineHeight: 24,
  },
});
