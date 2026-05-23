
import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';
import { WeightEntry } from '@/types';
import { saveWeightEntry, loadWeightEntries, loadProfile, deleteWeightEntry } from '@/utils/storage';
import WeightChart from '@/components/WeightChart';
import DaySelector from '@/components/DaySelector';
import { useFocusEffect } from 'expo-router';
import { formatDate } from '@/utils/dateUtils';
import AppLogo from '@/components/AppLogo';
import { useTranslation } from 'react-i18next';
import { loadWeightUnit, WeightUnit } from '@/utils/weightUnit';

type TimeRange = 'week' | '30days' | '90days' | 'all';

export default function WeightTrackingScreen() {
  const { t, i18n } = useTranslation();
  const [weightInput, setWeightInput] = useState('');
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [goalWeight, setGoalWeight] = useState<number | undefined>(undefined);
  const [currentWeight, setCurrentWeight] = useState<number | undefined>(undefined);
  const [startingWeight, setStartingWeight] = useState<number | undefined>(undefined);
  const [timeRange, setTimeRange] = useState<TimeRange>('30days');
  const [filteredEntries, setFilteredEntries] = useState<WeightEntry[]>([]);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lbs');

  const formatEntryDate = useCallback((entry: WeightEntry): string => {
    try {
      const d = new Date(entry.timestamp);
      if (isNaN(d.getTime())) return entry.date;
      const locale = i18n.language === 'es' ? 'es-ES' : 'en-US';
      return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    } catch {
      return entry.date;
    }
  }, [i18n.language]);

  const loadData = useCallback(async () => {
    console.log('[Weight] loadData start');
    setIsLoading(true);
    setLoadError(null);
    try {
      const [profile, unit] = await Promise.all([loadProfile(), loadWeightUnit()]);
      console.log('[Weight] Weight unit loaded:', unit);
      setWeightUnit(unit);

      if (profile) {
        console.log('[Weight] Profile found:', { currentWeight: profile.currentWeight, goalWeight: profile.goalWeight });
        setGoalWeight(profile.goalWeight);
        setCurrentWeight(profile.currentWeight);

        const rawEntries = await loadWeightEntries();
        console.log('[Weight] Raw entries loaded:', rawEntries.length);

        // Deduplicate: keep latest entry per date
        const deduped = Object.values(
          rawEntries.reduce((acc, e) => {
            if (!acc[e.date] || e.timestamp > acc[e.date].timestamp) {
              acc[e.date] = e;
            }
            return acc;
          }, {} as Record<string, WeightEntry>)
        );
        console.log(`[Weight] After dedup: ${rawEntries.length} → ${deduped.length} entries`);

        // Validate entries
        const validEntries = deduped.filter(e => {
          const ok = typeof e.weight === 'number' && isFinite(e.weight) && e.weight > 0
            && typeof e.timestamp === 'number' && isFinite(e.timestamp) && e.timestamp > 0
            && typeof e.date === 'string' && e.date.length === 10;
          if (!ok) console.warn('[Weight] Skipping invalid entry:', e);
          return ok;
        });

        // Determine starting weight (oldest entry or current weight if no entries)
        if (validEntries.length > 0) {
          const sorted = [...validEntries].sort((a, b) => a.timestamp - b.timestamp);
          setStartingWeight(sorted[0].weight);
        } else {
          setStartingWeight(profile.currentWeight);
        }

        // Check if we need to create an initial entry with the profile weight
        const hasProfileWeightEntry = validEntries.some(entry => entry.weight === profile.currentWeight);

        if (validEntries.length === 0 || !hasProfileWeightEntry) {
          console.log('[Weight] Creating/updating initial entry with profile weight:', profile.currentWeight);
          const today = new Date();
          const todayString = today.toISOString().split('T')[0];

          const todayEntry = validEntries.find(entry => entry.date === todayString);

          if (!todayEntry) {
            const initialEntry: WeightEntry = {
              date: todayString,
              weight: profile.currentWeight,
              timestamp: today.getTime(),
            };
            await saveWeightEntry(initialEntry);

            const updatedRaw = await loadWeightEntries();
            const updatedDeduped = Object.values(
              updatedRaw.reduce((acc, e) => {
                if (!acc[e.date] || e.timestamp > acc[e.date].timestamp) {
                  acc[e.date] = e;
                }
                return acc;
              }, {} as Record<string, WeightEntry>)
            );
            const updatedValid = updatedDeduped.filter(e =>
              typeof e.weight === 'number' && isFinite(e.weight) && e.weight > 0
              && typeof e.timestamp === 'number' && isFinite(e.timestamp) && e.timestamp > 0
              && typeof e.date === 'string' && e.date.length === 10
            );
            setEntries(updatedValid);
          } else {
            setEntries(validEntries);
          }
        } else {
          setEntries(validEntries);
        }
      } else {
        console.log('[Weight] No profile found, clearing weight data');
        setGoalWeight(undefined);
        setCurrentWeight(undefined);
        setStartingWeight(undefined);
        setEntries([]);
        setWeightInput('');
      }
    } catch (err) {
      console.error('[Weight] loadData error:', err);
      setLoadError(t('weightScreen.failedLoad'));
    } finally {
      console.log('[Weight] loadData complete');
      setIsLoading(false);
    }
  }, [t]);

  // Reload data whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('[Weight] Weight screen focused, loading data');
      loadData();
    }, [loadData])
  );

  // Filter entries by time range
  useEffect(() => {
    if (entries.length === 0) {
      setFilteredEntries([]);
      return;
    }

    const now = Date.now();
    let cutoffTime = 0;

    switch (timeRange) {
      case 'week':
        cutoffTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case '30days':
        cutoffTime = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case '90days':
        cutoffTime = now - 90 * 24 * 60 * 60 * 1000;
        break;
      case 'all':
        cutoffTime = 0;
        break;
    }

    const filtered = entries.filter(entry => entry.timestamp >= cutoffTime);
    const capped = filtered.slice(-90);
    console.log(`[Weight] Chart entries: ${filtered.length} filtered → ${capped.length} capped`);
    setFilteredEntries(capped);
  }, [entries, timeRange]);

  useEffect(() => {
    // Load weight for selected date
    const entry = entries.find(e => e.date === selectedDate);
    if (entry) {
      setWeightInput(entry.weight.toString());
    } else {
      setWeightInput('');
    }
  }, [selectedDate, entries]);

  const handleAddWeight = async () => {
    const weight = parseFloat(weightInput);

    if (isNaN(weight) || weight <= 0) {
      console.log('[Weight] Invalid weight input:', weightInput);
      Alert.alert(t('weightScreen.invalidInput'), t('weightScreen.invalidInputMessage'));
      return;
    }

    console.log('[Weight] Saving entry:', { date: selectedDate, weight });

    const selectedDateObj = new Date(selectedDate + 'T12:00:00');
    const entry: WeightEntry = {
      date: selectedDate,
      weight,
      timestamp: selectedDateObj.getTime(),
    };

    try {
      await saveWeightEntry(entry);
      const updatedRaw = await loadWeightEntries();
      const updatedDeduped = Object.values(
        updatedRaw.reduce((acc, e) => {
          if (!acc[e.date] || e.timestamp > acc[e.date].timestamp) {
            acc[e.date] = e;
          }
          return acc;
        }, {} as Record<string, WeightEntry>)
      );
      const updatedValid = updatedDeduped.filter(e =>
        typeof e.weight === 'number' && isFinite(e.weight) && e.weight > 0
        && typeof e.timestamp === 'number' && isFinite(e.timestamp) && e.timestamp > 0
        && typeof e.date === 'string' && e.date.length === 10
      );
      setEntries(updatedValid);

      // Update starting weight if this is the oldest entry
      const sorted = [...updatedValid].sort((a, b) => a.timestamp - b.timestamp);
      if (sorted.length > 0) setStartingWeight(sorted[0].weight);

      console.log('[Weight] Entry saved successfully');

      const isTodayDate = selectedDate === formatDate(new Date());
      const dateLabel = isTodayDate ? t('weightScreen.today') : selectedDate;
      Alert.alert(t('weightScreen.success'), t('weightScreen.weightSaved', { date: dateLabel }));
    } catch (error) {
      Alert.alert(t('common.error'), t('weightScreen.failedSave'));
      console.error('[Weight] Error saving weight:', error);
    }
  };

  const handleDeleteEntry = (date: string) => {
    console.log('[Weight] Delete entry pressed for date:', date);
    Alert.alert(
      t('weightScreen.deleteEntry'),
      t('weightScreen.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('weightScreen.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWeightEntry(date);
              const updatedRaw = await loadWeightEntries();
              const updatedDeduped = Object.values(
                updatedRaw.reduce((acc, e) => {
                  if (!acc[e.date] || e.timestamp > acc[e.date].timestamp) {
                    acc[e.date] = e;
                  }
                  return acc;
                }, {} as Record<string, WeightEntry>)
              );
              const updatedValid = updatedDeduped.filter(e =>
                typeof e.weight === 'number' && isFinite(e.weight) && e.weight > 0
                && typeof e.timestamp === 'number' && isFinite(e.timestamp) && e.timestamp > 0
                && typeof e.date === 'string' && e.date.length === 10
              );
              setEntries(updatedValid);

              // Update starting weight after deletion
              if (updatedValid.length > 0) {
                const sorted = [...updatedValid].sort((a, b) => a.timestamp - b.timestamp);
                setStartingWeight(sorted[0].weight);
              }

              if (date === selectedDate) {
                setWeightInput('');
              }
            } catch (error) {
              Alert.alert(t('common.error'), t('weightScreen.failedDelete'));
              console.error('[Weight] Error deleting weight:', error);
            }
          },
        },
      ]
    );
  };

  const latestWeight = entries.length > 0 ? entries[0].weight : currentWeight;
  const displayedHistory = showAllHistory ? entries : entries.slice(0, 3);

  // Calculate change from starting weight
  const changeFromStart = startingWeight && latestWeight ? latestWeight - startingWeight : null;
  const changeFromStartAbs = changeFromStart !== null ? Math.abs(changeFromStart).toFixed(1) : null;

  const hasEntryForSelectedDate = entries.some(e => e.date === selectedDate);
  const isTodaySelected = selectedDate === formatDate(new Date());

  const unitLabel = t(weightUnit === 'kg' ? 'common.kg' : 'common.lbs');
  const titleText = t('weightScreen.title');
  const startingLabel = t('weightScreen.starting');
  const currentLabel = t('weightScreen.current');
  const goalLabel = t('weightScreen.goal');
  const progressChartText = t('weightScreen.progressChart');
  const recentEntriesText = t('weightScreen.recentEntries');
  const retryText = t('weightScreen.retry');
  const errorText = loadError || '';

  const quickAddLabelText = hasEntryForSelectedDate
    ? t('weightScreen.updateWeight')
    : t('weightScreen.logWeight');
  const quickAddDateSuffix = !isTodaySelected
    ? ' ' + t('weightScreen.forDate', { date: selectedDate })
    : '';
  const quickAddLabel = quickAddLabelText + quickAddDateSuffix;

  const addButtonText = hasEntryForSelectedDate ? t('weightScreen.update') : t('weightScreen.add');

  const changeArrow = changeFromStart !== null
    ? (changeFromStart > 0 ? '↑' : changeFromStart < 0 ? '↓' : '=')
    : '';
  const changeColor = changeFromStart !== null
    ? (changeFromStart > 0 ? colors.error : changeFromStart < 0 ? colors.secondary : colors.textSecondary)
    : colors.textSecondary;
  const changeText = changeFromStartAbs !== null
    ? t('weightScreen.fromStartingWeight', { n: changeFromStartAbs, unit: unitLabel })
    : '';

  if (isLoading) {
    return (
      <View style={[commonStyles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={[commonStyles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{errorText}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryButtonText}>{retryText}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header with Logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <AppLogo size={40} />
          </View>
          <Text style={styles.title}>{titleText}</Text>
        </View>

        {/* Main Stats Card with Starting Weight */}
        <View style={styles.mainStatsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{startingWeight ? `${startingWeight}` : '--'}</Text>
              <Text style={styles.statLabel}>{startingLabel}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{latestWeight ? `${latestWeight}` : '--'}</Text>
              <Text style={styles.statLabel}>{currentLabel}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{goalWeight ? `${goalWeight}` : '--'}</Text>
              <Text style={styles.statLabel}>{goalLabel}</Text>
            </View>
          </View>

          {changeFromStart !== null && (
            <View style={styles.changeIndicator}>
              <Text style={[styles.changeText, { color: changeColor }]}>
                {changeArrow}
              </Text>
              <Text style={[styles.changeText, { color: changeColor }]}>
                {' '}{changeText}
              </Text>
            </View>
          )}
        </View>

        {/* Day Selector */}
        <DaySelector selectedDate={selectedDate} onDateSelect={setSelectedDate} />

        {/* Quick Add Weight */}
        <View style={styles.quickAddCard}>
          <Text style={styles.quickAddLabel}>{quickAddLabel}</Text>
          <View style={styles.quickAddRow}>
            <TextInput
              style={styles.quickAddInput}
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="decimal-pad"
              placeholder={unitLabel}
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity style={styles.quickAddButton} onPress={handleAddWeight}>
              <Text style={styles.quickAddButtonText}>{addButtonText}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Chart with integrated time range selector */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>{progressChartText}</Text>
          </View>
          <View style={styles.compactTimeRange}>
            {(['week', '30days', '90days', 'all'] as TimeRange[]).map((range) => {
              const chipLabel = range === 'week'
                ? t('weightScreen.time7D')
                : range === '30days'
                  ? t('weightScreen.time30D')
                  : range === '90days'
                    ? t('weightScreen.time90D')
                    : t('weightScreen.timeAll');
              return (
                <TouchableOpacity
                  key={range}
                  style={[styles.timeChip, timeRange === range && styles.timeChipActive]}
                  onPress={() => {
                    console.log('[Weight] Time range changed to:', range);
                    setTimeRange(range);
                  }}
                >
                  <Text style={[styles.timeChipText, timeRange === range && styles.timeChipTextActive]}>
                    {chipLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <WeightChart entries={filteredEntries} goalWeight={goalWeight} />
        </View>

        {/* Compact History */}
        {entries.length > 0 && (
          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>{recentEntriesText}</Text>
              {entries.length > 3 && (
                <TouchableOpacity onPress={() => {
                  console.log('[Weight] Toggle show all history:', !showAllHistory);
                  setShowAllHistory(!showAllHistory);
                }}>
                  <Text style={styles.showMoreText}>
                    {showAllHistory
                      ? t('weightScreen.showLess')
                      : t('weightScreen.showAll', { n: entries.length })}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {displayedHistory.map((entry, index) => {
              const entryWeightText = entry.weight + ' ' + unitLabel;
              const entryDateText = formatEntryDate(entry);
              return (
                <View key={`${entry.date}-${index}`} style={styles.historyRow}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyWeight}>{entryWeightText}</Text>
                    <Text style={styles.historyDate}>{entryDateText}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteEntry(entry.date)} style={styles.deleteIcon}>
                    <Text style={styles.deleteIconText}>×</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: Platform.OS === 'android' ? 48 : 16,
    paddingBottom: 120,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 32,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
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
  mainStatsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  changeIndicator: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  changeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  quickAddCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: colors.highlight,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.primary + '20',
  },
  quickAddLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAddInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickAddButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickAddButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chartCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  chartHeader: {
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  compactTimeRange: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  timeChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
    minWidth: 60,
    alignItems: 'center',
  },
  timeChipActive: {
    backgroundColor: colors.primary,
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  timeChipTextActive: {
    color: '#FFFFFF',
  },
  historyCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  historyWeight: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    minWidth: 70,
  },
  historyDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  deleteIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIconText: {
    fontSize: 24,
    color: colors.error,
    fontWeight: '400',
    lineHeight: 24,
  },
  bottomPadding: {
    height: 20,
  },
});
