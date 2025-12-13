
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { WeightEntry } from '@/types';
import { saveWeightEntry, loadWeightEntries, loadProfile, deleteWeightEntry } from '@/utils/storage';
import WeightChart from '@/components/WeightChart';

type TimeRange = 'week' | '30days' | '90days' | 'all';

export default function WeightTrackingScreen() {
  const [weightInput, setWeightInput] = useState('');
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [goalWeight, setGoalWeight] = useState<number | undefined>(undefined);
  const [currentWeight, setCurrentWeight] = useState<number | undefined>(undefined);
  const [timeRange, setTimeRange] = useState<TimeRange>('30days');
  const [filteredEntries, setFilteredEntries] = useState<WeightEntry[]>([]);
  const [showAllHistory, setShowAllHistory] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterEntriesByTimeRange();
  }, [entries, timeRange]);

  const loadData = async () => {
    const profile = await loadProfile();
    if (profile) {
      setGoalWeight(profile.goalWeight);
      setCurrentWeight(profile.currentWeight);
    }

    const weightEntries = await loadWeightEntries();
    setEntries(weightEntries);

    // If no entries exist and we have a profile, create initial entry
    if (weightEntries.length === 0 && profile) {
      const today = new Date();
      const initialEntry: WeightEntry = {
        date: today.toISOString().split('T')[0],
        weight: profile.currentWeight,
        timestamp: today.getTime(),
      };
      await saveWeightEntry(initialEntry);
      setEntries([initialEntry]);
    }
  };

  const filterEntriesByTimeRange = () => {
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
    setFilteredEntries(filtered);
  };

  const handleAddWeight = async () => {
    const weight = parseFloat(weightInput);

    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid weight.');
      return;
    }

    const today = new Date();
    const entry: WeightEntry = {
      date: today.toISOString().split('T')[0],
      weight,
      timestamp: today.getTime(),
    };

    try {
      await saveWeightEntry(entry);
      const updatedEntries = await loadWeightEntries();
      setEntries(updatedEntries);
      setWeightInput('');
      Alert.alert('Success', 'Weight entry saved!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save weight entry.');
      console.error('Error saving weight:', error);
    }
  };

  const handleDeleteEntry = (date: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this weight entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWeightEntry(date);
              const updatedEntries = await loadWeightEntries();
              setEntries(updatedEntries);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete weight entry.');
              console.error('Error deleting weight:', error);
            }
          },
        },
      ]
    );
  };

  const getWeightChange = () => {
    if (filteredEntries.length < 2) return null;

    const sorted = [...filteredEntries].sort((a, b) => a.timestamp - b.timestamp);
    const firstWeight = sorted[0].weight;
    const lastWeight = sorted[sorted.length - 1].weight;
    const change = lastWeight - firstWeight;

    return {
      change,
      percentage: ((change / firstWeight) * 100).toFixed(1),
    };
  };

  const weightChange = getWeightChange();
  const latestWeight = entries.length > 0 ? entries[0].weight : currentWeight;
  const displayedHistory = showAllHistory ? entries : entries.slice(0, 3);

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Compact Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Weight Progress</Text>
        </View>

        {/* Main Stats Card */}
        <View style={styles.mainStatsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{latestWeight ? `${latestWeight}` : '--'}</Text>
              <Text style={styles.statLabel}>Current</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{goalWeight ? `${goalWeight}` : '--'}</Text>
              <Text style={styles.statLabel}>Goal</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.secondary, fontSize: 20 }]}>
                {goalWeight && latestWeight ? Math.abs(latestWeight - goalWeight).toFixed(1) : '--'}
              </Text>
              <Text style={styles.statLabel}>To Go</Text>
            </View>
          </View>
          
          {weightChange && (
            <View style={styles.changeIndicator}>
              <Text style={styles.changeText}>
                {weightChange.change > 0 ? '↑' : '↓'} {Math.abs(weightChange.change).toFixed(1)} lbs ({weightChange.change > 0 ? '+' : ''}{weightChange.percentage}%) this period
              </Text>
            </View>
          )}
        </View>

        {/* Quick Add Weight */}
        <View style={styles.quickAddCard}>
          <Text style={styles.quickAddLabel}>Log Weight</Text>
          <View style={styles.quickAddRow}>
            <TextInput
              style={styles.quickAddInput}
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="decimal-pad"
              placeholder="lbs"
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity style={styles.quickAddButton} onPress={handleAddWeight}>
              <Text style={styles.quickAddButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Chart with integrated time range selector */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Progress Chart</Text>
            <View style={styles.compactTimeRange}>
              {(['week', '30days', '90days', 'all'] as TimeRange[]).map((range) => (
                <TouchableOpacity
                  key={range}
                  style={[styles.timeChip, timeRange === range && styles.timeChipActive]}
                  onPress={() => setTimeRange(range)}
                >
                  <Text style={[styles.timeChipText, timeRange === range && styles.timeChipTextActive]}>
                    {range === 'week' ? '7D' : range === '30days' ? '30D' : range === '90days' ? '90D' : 'All'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <WeightChart entries={filteredEntries} goalWeight={goalWeight} />
        </View>

        {/* Compact History */}
        {entries.length > 0 && (
          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Recent Entries</Text>
              {entries.length > 3 && (
                <TouchableOpacity onPress={() => setShowAllHistory(!showAllHistory)}>
                  <Text style={styles.showMoreText}>
                    {showAllHistory ? 'Show Less' : `Show All (${entries.length})`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {displayedHistory.map((entry, index) => (
              <View key={`${entry.date}-${index}`} style={styles.historyRow}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyWeight}>{entry.weight} lbs</Text>
                  <Text style={styles.historyDate}>
                    {new Date(entry.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteEntry(entry.date)} style={styles.deleteIcon}>
                  <Text style={styles.deleteIconText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
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
  },
  changeText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  compactTimeRange: {
    flexDirection: 'row',
    gap: 6,
  },
  timeChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
  },
  timeChipActive: {
    backgroundColor: colors.primary,
  },
  timeChipText: {
    fontSize: 12,
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
