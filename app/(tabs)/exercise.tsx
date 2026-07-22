
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { getTodayString, formatDate } from '@/utils/dateUtils';
import { loadExerciseEntriesForDate, loadExerciseEntries, deleteExerciseEntry } from '@/utils/storage';
import { ExerciseEntry, EXERCISE_CATEGORIES, ExerciseCategory } from '@/types';
import AppLogo from '@/components/AppLogo';
import DaySelector from '@/components/DaySelector';
import { useTranslation } from 'react-i18next';

// Same 7-day window as DaySelector (today + 6 prior days), so the weekly
// summary always matches what's actually selectable above it.
function getLast7DayStrings(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    days.push(formatDate(date));
  }
  return days;
}

interface CategoryTotal {
  category: ExerciseCategory;
  minutes: number;
}

export default function ExerciseScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [entries, setEntries] = useState<ExerciseEntry[]>([]);
  const [weeklyTotals, setWeeklyTotals] = useState<CategoryTotal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async (date: string) => {
    console.log('[ExerciseScreen] Loading exercise entries for', date);
    const dateEntries = await loadExerciseEntriesForDate(date);
    console.log('[ExerciseScreen] Loaded entries:', dateEntries.length);
    setEntries(dateEntries);

    // Weekly summary — total minutes per category across the same 7-day window as DaySelector
    const weekDates = new Set(getLast7DayStrings());
    const allEntries = await loadExerciseEntries();
    const totalsByCategory = new Map<ExerciseCategory, number>();
    for (const entry of allEntries) {
      if (!weekDates.has(entry.date)) continue;
      totalsByCategory.set(entry.category, (totalsByCategory.get(entry.category) ?? 0) + entry.durationMinutes);
    }
    const totals = EXERCISE_CATEGORIES
      .map((c) => ({ category: c.value, minutes: totalsByCategory.get(c.value) ?? 0 }))
      .filter((t) => t.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes);
    setWeeklyTotals(totals);

    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData(selectedDate);
    }, [loadData, selectedDate])
  );

  const handleLogExercise = () => {
    console.log('[ExerciseScreen] Log Exercise pressed for date:', selectedDate);
    router.push({ pathname: '/log-exercise', params: { date: selectedDate } });
  };

  const handleEditExercise = (entry: ExerciseEntry) => {
    console.log('[ExerciseScreen] Edit exercise entry pressed:', entry.id);
    router.push({ pathname: '/log-exercise', params: { date: entry.date, id: entry.id } });
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
            await loadData(selectedDate);
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

        <DaySelector selectedDate={selectedDate} onDateSelect={setSelectedDate} />

        <View style={styles.content}>
          <TouchableOpacity style={styles.logExerciseButton} onPress={handleLogExercise}>
            <Text style={styles.logExerciseButtonText}>+ {t('logExercise.logExerciseButton')}</Text>
          </TouchableOpacity>

          {!isLoading && entries.length === 0 && (
            <Text style={styles.emptyText}>
              {selectedDate === getTodayString() ? t('logExercise.emptyToday') : t('logExercise.emptyDay')}
            </Text>
          )}

          {entries.map((entry) => {
            const categoryInfo = EXERCISE_CATEGORIES.find((c) => c.value === entry.category);
            const categoryLabel = t(`logExercise.categories.${entry.category}`);
            return (
              <TouchableOpacity
                key={entry.id}
                style={styles.activityRow}
                onPress={() => handleEditExercise(entry)}
                activeOpacity={0.7}
              >
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
              </TouchableOpacity>
            );
          })}
        </View>

        {weeklyTotals.length > 0 && (
          <View style={styles.weekSummary}>
            <Text style={styles.weekSummaryTitle}>{t('logExercise.thisWeek')}</Text>
            <View style={styles.weekSummaryCard}>
              {weeklyTotals.map((total, index) => {
                const categoryInfo = EXERCISE_CATEGORIES.find((c) => c.value === total.category);
                const isLast = index === weeklyTotals.length - 1;
                return (
                  <View
                    key={total.category}
                    style={[styles.weekSummaryRow, isLast && styles.weekSummaryRowLast]}
                  >
                    <Text style={styles.weekSummaryIcon}>{categoryInfo?.icon}</Text>
                    <Text style={styles.weekSummaryLabel}>{t(`logExercise.categories.${total.category}`)}</Text>
                    <Text style={styles.weekSummaryMinutes}>
                      {total.minutes} {t('logExercise.minutes')}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
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
  weekSummary: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  weekSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  weekSummaryCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  weekSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 10,
  },
  weekSummaryRowLast: {
    borderBottomWidth: 0,
  },
  weekSummaryIcon: {
    fontSize: 18,
  },
  weekSummaryLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  weekSummaryMinutes: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
});
