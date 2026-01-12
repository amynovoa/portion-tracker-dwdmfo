
import React, { useState, useEffect } from 'react';
import { getAllDailyPortions, loadProfile, loadDailyPortions } from '@/utils/storage';
import AdherenceCard from '@/components/AdherenceCard';
import { formatDisplayDate, getTodayString } from '@/utils/dateUtils';
import { calculateDailyAdherence, calculateWeeklyAdherence, calculateMonthlyAdherence } from '@/utils/adherenceCalculator';
import { colors, commonStyles } from '@/styles/commonStyles';
import { useFocusEffect } from 'expo-router';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { DailyPortions, UserProfile, FOOD_GROUPS, PortionTargets } from '@/types';
import { IconSymbol } from '@/components/IconSymbol';
import AppLogo from '@/components/AppLogo';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  adherenceSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  historySection: {
    marginBottom: 32,
  },
  dayCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayDate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  dayAdherence: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  dayDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  foodGroupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  foodGroupName: {
    fontSize: 14,
    color: colors.text,
  },
  foodGroupValue: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default function HistoryScreen() {
  const [allPortions, setAllPortions] = useState<Record<string, DailyPortions>>({});
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const portions = await getAllDailyPortions();
    const userProfile = await loadProfile();
    setAllPortions(portions);
    setProfile(userProfile);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleExpand = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  const todayAdherence = calculateDailyAdherence(allPortions, profile, getTodayString());
  const weeklyAdherence = calculateWeeklyAdherence(allPortions, profile);
  const monthlyAdherence = calculateMonthlyAdherence(allPortions, profile);

  const sortedDates = Object.keys(allPortions).sort((a, b) => b.localeCompare(a));

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.logoContainer}>
          <AppLogo size={60} />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>Your tracking history</Text>
        </View>

        <View style={styles.adherenceSection}>
          <Text style={styles.sectionTitle}>Adherence</Text>
          <AdherenceCard
            todayAdherence={todayAdherence}
            weeklyAdherence={weeklyAdherence}
            monthlyAdherence={monthlyAdherence}
          />
        </View>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Daily History</Text>
          {sortedDates.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No tracking history yet</Text>
            </View>
          ) : (
            sortedDates.map((date) => {
              const portions = allPortions[date];
              const dayAdherence = calculateDailyAdherence(allPortions, profile, date);
              const isExpanded = expandedDates.has(date);

              return (
                <TouchableOpacity
                  key={date}
                  style={styles.dayCard}
                  onPress={() => toggleExpand(date)}
                >
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayDate}>{formatDisplayDate(date)}</Text>
                    <Text style={styles.dayAdherence}>{dayAdherence}% adherence</Text>
                  </View>
                  {isExpanded && (
                    <View style={styles.dayDetails}>
                      {FOOD_GROUPS.map((group) => (
                        <View key={group} style={styles.foodGroupRow}>
                          <Text style={styles.foodGroupName}>{group}</Text>
                          <Text style={styles.foodGroupValue}>
                            {portions.completed[group] || 0} / {profile?.targets[group] || 0}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
