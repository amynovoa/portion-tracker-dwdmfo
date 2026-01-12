
import React, { useState, useEffect } from 'react';
import { getAllDailyPortions, loadProfile, loadDailyPortions } from '@/utils/storage';
import AdherenceCard from '@/components/AdherenceCard';
import { formatDisplayDate, getTodayString } from '@/utils/dateUtils';
import { calculateDailyAdherence, calculateDailyAdherenceForDate, calculateWeeklyAdherence, calculateMonthlyAdherence } from '@/utils/adherenceCalculator';
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
  const [allPortions, setAllPortions] = useState<DailyPortions[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    console.log('Loading history data (iOS)...');
    const portions = await getAllDailyPortions();
    const userProfile = await loadProfile();
    
    console.log('iOS - Portions loaded:', portions.length);
    console.log('iOS - Profile loaded:', userProfile ? 'Found' : 'Not found');
    
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

  if (!profile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text }}>No profile data available</Text>
      </View>
    );
  }

  const todayString = getTodayString();
  const todayAdherence = calculateDailyAdherenceForDate(allPortions, profile.portionTargets, todayString);
  const weeklyAdherence = calculateWeeklyAdherence(allPortions, profile.portionTargets);
  const monthlyAdherence = calculateMonthlyAdherence(allPortions, profile.portionTargets);

  console.log('iOS History screen adherence values:', {
    today: todayAdherence,
    week: weeklyAdherence,
    month: monthlyAdherence,
    todayString,
    allPortionsCount: allPortions.length
  });

  const sortedDates = allPortions.sort((a, b) => b.date.localeCompare(a.date));

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
          <AdherenceCard
            title="Today"
            percentage={todayAdherence}
            subtitle={formatDisplayDate(todayString)}
          />
          <AdherenceCard
            title="This Week"
            percentage={weeklyAdherence}
            subtitle="Last 7 days"
          />
          <AdherenceCard
            title="This Month"
            percentage={monthlyAdherence}
            subtitle="Last 30 days"
          />
        </View>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Daily History</Text>
          {sortedDates.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No tracking history yet</Text>
            </View>
          ) : (
            sortedDates.map((dayData) => {
              const dayAdherence = calculateDailyAdherence(dayData.portions, profile.portionTargets);
              const isExpanded = expandedDates.has(dayData.date);

              return (
                <TouchableOpacity
                  key={dayData.date}
                  style={styles.dayCard}
                  onPress={() => toggleExpand(dayData.date)}
                >
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayDate}>{formatDisplayDate(dayData.date)}</Text>
                    <Text style={styles.dayAdherence}>{dayAdherence}% complete</Text>
                  </View>
                  {isExpanded && (
                    <View style={styles.dayDetails}>
                      {FOOD_GROUPS.map((fg) => {
                        const completed = dayData.portions[fg.key] || 0;
                        const target = profile.portionTargets[fg.key] || 0;
                        
                        return (
                          <View key={fg.key} style={styles.foodGroupRow}>
                            <Text style={styles.foodGroupName}>{fg.icon} {fg.label}</Text>
                            <Text style={styles.foodGroupValue}>
                              {completed} / {target}
                            </Text>
                          </View>
                        );
                      })}
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
