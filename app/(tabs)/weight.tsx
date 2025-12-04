
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { WeightEntry } from '@/types';
import { saveWeightEntry, loadWeightEntries, loadProfile, deleteWeightEntry } from '@/utils/storage';
import WeightChart from '@/components/WeightChart';
import AppLogo from '@/components/AppLogo';

type TimeRange = 'week' | '30days' | '60days' | '90days' | 'all';

export default function WeightTrackingScreen() {
  const [weightInput, setWeightInput] = useState('');
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [goalWeight, setGoalWeight] = useState<number | undefined>(undefined);
  const [currentWeight, setCurrentWeight] = useState<number | undefined>(undefined);
  const [timeRange, setTimeRange] = useState<TimeRange>('30days');
  const [filteredEntries, setFilteredEntries] = useState<WeightEntry[]>([]);

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
      case '60days':
        cutoffTime = now - 60 * 24 * 60 * 60 * 1000;
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

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <AppLogo size={60} />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Weight Tracking</Text>
          <Text style={styles.subtitle}>Track your progress over time</Text>
        </View>

        {/* Current Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Current Weight</Text>
            <Text style={styles.statValue}>{latestWeight ? `${latestWeight} lbs` : '--'}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Goal Weight</Text>
            <Text style={styles.statValue}>{goalWeight ? `${goalWeight} lbs` : '--'}</Text>
          </View>
          {goalWeight && latestWeight && (
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>To Goal</Text>
              <Text style={[styles.statValue, { color: colors.secondary }]}>
                {Math.abs(latestWeight - goalWeight).toFixed(1)} lbs
              </Text>
            </View>
          )}
        </View>

        {/* Weight Change Summary */}
        {weightChange && (
          <View style={[styles.changeCard, weightChange.change < 0 ? styles.changeCardPositive : styles.changeCardNeutral]}>
            <Text style={styles.changeLabel}>Change in selected period</Text>
            <Text style={styles.changeValue}>
              {weightChange.change > 0 ? '+' : ''}{weightChange.change.toFixed(1)} lbs ({weightChange.change > 0 ? '+' : ''}{weightChange.percentage}%)
            </Text>
          </View>
        )}

        {/* Add Weight Entry */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Log Today&apos;s Weight</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[commonStyles.input, styles.weightInput]}
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="decimal-pad"
              placeholder="Enter weight"
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity style={[buttonStyles.primary, styles.addButton]} onPress={handleAddWeight}>
              <Text style={commonStyles.buttonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeSection}>
          <Text style={styles.sectionTitle}>Time Range</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeRangeButtons}>
            <TouchableOpacity
              style={[styles.timeRangeButton, timeRange === 'week' && styles.timeRangeButtonActive]}
              onPress={() => setTimeRange('week')}
            >
              <Text style={[styles.timeRangeText, timeRange === 'week' && styles.timeRangeTextActive]}>Week</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timeRangeButton, timeRange === '30days' && styles.timeRangeButtonActive]}
              onPress={() => setTimeRange('30days')}
            >
              <Text style={[styles.timeRangeText, timeRange === '30days' && styles.timeRangeTextActive]}>30 Days</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timeRangeButton, timeRange === '60days' && styles.timeRangeButtonActive]}
              onPress={() => setTimeRange('60days')}
            >
              <Text style={[styles.timeRangeText, timeRange === '60days' && styles.timeRangeTextActive]}>60 Days</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timeRangeButton, timeRange === '90days' && styles.timeRangeButtonActive]}
              onPress={() => setTimeRange('90days')}
            >
              <Text style={[styles.timeRangeText, timeRange === '90days' && styles.timeRangeTextActive]}>90 Days</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timeRangeButton, timeRange === 'all' && styles.timeRangeButtonActive]}
              onPress={() => setTimeRange('all')}
            >
              <Text style={[styles.timeRangeText, timeRange === 'all' && styles.timeRangeTextActive]}>All</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Chart */}
        <View style={styles.chartSection}>
          <WeightChart entries={filteredEntries} goalWeight={goalWeight} />
        </View>

        {/* Weight History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Weight History</Text>
          {entries.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryText}>No weight entries yet</Text>
            </View>
          ) : (
            entries.map((entry, index) => (
              <View key={`${entry.date}-${index}`} style={styles.historyItem}>
                <View style={styles.historyItemLeft}>
                  <Text style={styles.historyDate}>
                    {new Date(entry.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.historyWeight}>{entry.weight} lbs</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteEntry(entry.date)} style={styles.deleteButton}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  changeCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.card,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  changeCardPositive: {
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  changeCardNeutral: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  changeLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  changeValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  inputSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  weightInput: {
    flex: 1,
    marginVertical: 0,
  },
  addButton: {
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  timeRangeSection: {
    marginBottom: 16,
  },
  timeRangeButtons: {
    paddingHorizontal: 16,
    gap: 8,
  },
  timeRangeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  timeRangeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.highlight,
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  timeRangeTextActive: {
    color: colors.primary,
  },
  chartSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  historySection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
    elevation: 1,
  },
  historyItemLeft: {
    flex: 1,
  },
  historyDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  historyWeight: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: colors.error + '20',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
  },
  emptyHistory: {
    padding: 32,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  bottomPadding: {
    height: 20,
  },
});
