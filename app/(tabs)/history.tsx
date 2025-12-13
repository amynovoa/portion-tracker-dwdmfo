
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { getAllDailyPortions, loadProfile, loadDailyPortions } from '@/utils/storage';
import { DailyPortions, UserProfile, FOOD_GROUPS, PortionTargets } from '@/types';
import { formatDisplayDate, getTodayString } from '@/utils/dateUtils';
import { calculateDailyAdherence, calculateWeeklyAdherence, calculateMonthlyAdherence } from '@/utils/adherenceCalculator';
import AppLogo from '@/components/AppLogo';
import AdherenceCard from '@/components/AdherenceCard';

export default function HistoryScreen() {
  const [records, setRecords] = useState<DailyPortions[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [todayPortions, setTodayPortions] = useState<PortionTargets | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      console.log('History: Loading data...');
      const allRecords = await getAllDailyPortions();
      setRecords(allRecords);
      
      const userProfile = await loadProfile();
      setProfile(userProfile);

      // Load today's portions for adherence calculation
      const today = getTodayString();
      const dailyData = await loadDailyPortions(today);
      
      if (dailyData && dailyData.portions) {
        setTodayPortions(dailyData.portions);
      } else {
        // Create empty portions if no data exists
        const emptyPortions: PortionTargets = {
          protein: 0,
          veggies: 0,
          fruit: 0,
          wholeGrains: 0,
          nutsSeeds: 0,
          fats: 0,
          dairy: 0,
          water: 0,
          alcohol: 0,
        };
        setTodayPortions(emptyPortions);
      }
    } catch (error) {
      console.error('Error loading history data:', error);
    }
  };

  // Load data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('History screen focused, loading data');
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleExpand = (date: string) => {
    setExpandedDate(expandedDate === date ? null : date);
  };

  if (!profile) {
    return (
      <View style={[commonStyles.container, styles.centerContent]}>
        <AppLogo size={80} />
        <Text style={styles.emptyTitle}>No profile found</Text>
        <Text style={styles.emptySubtext}>Please create your profile in the Profile tab</Text>
      </View>
    );
  }

  // Calculate adherence with error handling
  let todayAdherence = 0;
  let weekAdherence = 0;
  let monthAdherence = 0;

  try {
    if (profile && profile.targets && todayPortions) {
      todayAdherence = calculateDailyAdherence(todayPortions, profile.targets);
      weekAdherence = calculateWeeklyAdherence(records, profile.targets);
      monthAdherence = calculateMonthlyAdherence(records, profile.targets);
      
      console.log('History adherence calculated:', { todayAdherence, weekAdherence, monthAdherence });
    }
  } catch (error) {
    console.error('Error calculating adherence in history:', error);
  }

  return (
    <View style={commonStyles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
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
          <AdherenceCard title="Today" percentage={todayAdherence} />
          <AdherenceCard title="This Week" percentage={weekAdherence} />
          <AdherenceCard title="This Month" percentage={monthAdherence} />
        </View>

        {records.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No history yet</Text>
            <Text style={styles.emptySubtext}>Start tracking your portions to see your history here</Text>
          </View>
        ) : (
          records.map((record) => {
            const adherence = calculateDailyAdherence(record.portions, profile.targets);
            const isExpanded = expandedDate === record.date;

            return (
              <TouchableOpacity
                key={record.date}
                style={styles.recordCard}
                onPress={() => toggleExpand(record.date)}
                activeOpacity={0.7}
              >
                <View style={styles.recordHeader}>
                  <View>
                    <Text style={styles.recordDate}>{formatDisplayDate(record.date)}</Text>
                    <Text style={styles.recordSubtext}>{record.date}</Text>
                  </View>
                  <View style={styles.adherenceBadge}>
                    <Text style={styles.adherenceText}>{adherence}%</Text>
                  </View>
                </View>

                {isExpanded && (
                  <View style={styles.recordDetails}>
                    {FOOD_GROUPS.map((group) => {
                      const completed = record.portions[group.key];
                      const target = profile.targets[group.key];
                      
                      return (
                        <View key={group.key} style={styles.detailRow}>
                          <Text style={styles.detailIcon}>{group.icon}</Text>
                          <Text style={styles.detailLabel}>{group.label}</Text>
                          <Text style={styles.detailValue}>
                            {completed}/{target}
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

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 48,
    paddingBottom: 120,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 16,
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
  adherenceSection: {
    marginBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyTitle: {
    marginTop: 24,
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  recordCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
    elevation: 1,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordDate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  recordSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  adherenceBadge: {
    backgroundColor: colors.highlight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  adherenceText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  recordDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  bottomPadding: {
    height: 20,
  },
});
