
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { getTodayString, formatDate, formatDisplayDate } from '@/utils/dateUtils';
import { loadExerciseEntriesForDate, loadExerciseEntries, deleteExerciseEntry } from '@/utils/storage';
import { ExerciseEntry, EXERCISE_CATEGORIES } from '@/types';
import AppLogo from '@/components/AppLogo';
import DaySelector from '@/components/DaySelector';
import ExerciseChart from '@/components/ExerciseChart';
import { useTranslation } from 'react-i18next';

const CHART_DAYS = 14;
const HISTORY_PREVIEW_COUNT = 5;

interface DayGroup {
  date: string;
  entries: ExerciseEntry[];
  totalMinutes: number;
}

function getLastNDayStrings(n: number): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    days.push(formatDate(date));
  }
  return days;
}

export default function ExerciseScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [entries, setEntries] = useState<ExerciseEntry[]>([]);
  const [chartData, setChartData] = useState<{ date: string; minutes: number }[]>([]);
  const [dayGroups, setDayGroups] = useState<DayGroup[]>([]);
  const [expandedHistoryDates, setExpandedHistoryDates] = useState<Set<string>>(new Set());
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async (date: string) => {
    console.log('[ExerciseScreen] Loading exercise entries for', date);
    const dateEntries = await loadExerciseEntriesForDate(date);
    console.log('[ExerciseScreen] Loaded entries:', dateEntries.length);
    setEntries(dateEntries);

    const allEntries = await loadExerciseEntries();

    // Chart — total minutes per day for the last CHART_DAYS days, oldest to newest
    const chartDates = getLastNDayStrings(CHART_DAYS).reverse();
    const minutesByDate = new Map<string, number>();
    for (const entry of allEntries) {
      minutesByDate.set(entry.date, (minutesByDate.get(entry.date) ?? 0) + entry.durationMinutes);
    }
    setChartData(chartDates.map((d) => ({ date: d, minutes: minutesByDate.get(d) ?? 0 })));

    // Full history — every entry ever logged, grouped by date, most recent first
    const groupsByDate = new Map<string, ExerciseEntry[]>();
    for (const entry of allEntries) {
      const group = groupsByDate.get(entry.date) ?? [];
      group.push(entry);
      groupsByDate.set(entry.date, group);
    }
    const groups: DayGroup[] = Array.from(groupsByDate.entries())
      .map(([groupDate, groupEntries]) => ({
        date: groupDate,
        entries: groupEntries,
        totalMinutes: groupEntries.reduce((sum, e) => sum + e.durationMinutes, 0),
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
    setDayGroups(groups);

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

  const toggleHistoryDate = (date: string) => {
    setExpandedHistoryDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const displayedGroups = showAllHistory ? dayGroups : dayGroups.slice(0, HISTORY_PREVIEW_COUNT);

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

        {/* Chart — total minutes per day, last CHART_DAYS days */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('logExercise.activityOverTime')}</Text>
          <View style={styles.chartCard}>
            <ExerciseChart dailyTotals={chartData} />
          </View>
        </View>

        {/* Full history — every entry ever logged, grouped by date, unlimited */}
        <View style={styles.section}>
          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>{t('logExercise.allActivity')}</Text>
            {dayGroups.length > HISTORY_PREVIEW_COUNT && (
              <TouchableOpacity onPress={() => setShowAllHistory((v) => !v)}>
                <Text style={styles.showMoreText}>
                  {showAllHistory ? t('weightScreen.showLess') : t('weightScreen.showAll', { n: dayGroups.length })}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {!isLoading && dayGroups.length === 0 && (
            <Text style={styles.emptyText}>{t('logExercise.noHistory')}</Text>
          )}

          {displayedGroups.map((group) => {
            const isExpanded = expandedHistoryDates.has(group.date);
            return (
              <View key={group.date} style={styles.dayCard}>
                <TouchableOpacity style={styles.dayHeader} onPress={() => toggleHistoryDate(group.date)}>
                  <View style={styles.dayHeaderLeft}>
                    <Text style={styles.dayDate}>{formatDisplayDate(group.date, i18n.language)}</Text>
                    <Text style={styles.dayTotal}>
                      {t('logExercise.dailyTotal', { minutes: group.totalMinutes })}
                    </Text>
                  </View>
                  <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.dayDetails}>
                    {group.entries.map((entry) => {
                      const categoryInfo = EXERCISE_CATEGORIES.find((c) => c.value === entry.category);
                      return (
                        <TouchableOpacity
                          key={entry.id}
                          style={styles.historyEntryRow}
                          onPress={() => handleEditExercise(entry)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.activityRowIcon}>{categoryInfo?.icon}</Text>
                          <View style={styles.activityRowContent}>
                            <Text style={styles.activityRowLabel}>
                              {t(`logExercise.categories.${entry.category}`)}
                            </Text>
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
                )}
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
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  chartCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    overflow: 'hidden',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  dayCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    marginTop: 10,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  dayHeaderLeft: {
    flex: 1,
  },
  dayDate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  dayTotal: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  expandIcon: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 12,
  },
  dayDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 12,
    paddingTop: 8,
    gap: 8,
  },
  historyEntryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 12,
    gap: 12,
  },
});
