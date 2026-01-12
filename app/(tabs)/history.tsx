
import { DailyPortions, UserProfile, FOOD_GROUPS, PortionTargets } from '@/types';
import AppLogo from '@/components/AppLogo';
import React, { useState, useEffect } from 'react';
import AdherenceCard from '@/components/AdherenceCard';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { getAllDailyPortions, loadProfile, loadDailyPortions } from '@/utils/storage';
import { useFocusEffect } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { formatDisplayDate, getTodayString } from '@/utils/dateUtils';
import { calculateDailyAdherence, calculateWeeklyAdherence, calculateMonthlyAdherence } from '@/utils/adherenceCalculator';

export default function HistoryScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [allPortions, setAllPortions] = useState<DailyPortions[]>([]);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    console.log('Loading history data...');
    try {
      const userProfile = await loadProfile();
      const portions = await getAllDailyPortions();
      
      console.log('Profile loaded:', userProfile ? 'Found' : 'Not found');
      console.log('Portions loaded:', portions.length, 'days');
      
      setProfile(userProfile);
      
      // Sort by date descending (most recent first)
      const sortedPortions = portions.sort((a, b) => b.date.localeCompare(a.date));
      setAllPortions(sortedPortions);
    } catch (error) {
      console.error('Error loading history data:', error);
    }
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
      <View style={[commonStyles.container, styles.centerContent]}>
        <Text style={commonStyles.bodyText}>No profile data available</Text>
      </View>
    );
  }

  const todayString = getTodayString();
  const dailyAdherence = calculateDailyAdherence(allPortions, profile.portionTargets, todayString);
  const weeklyAdherence = calculateWeeklyAdherence(allPortions, profile.portionTargets);
  const monthlyAdherence = calculateMonthlyAdherence(allPortions, profile.portionTargets);

  return (
    <View style={commonStyles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <AppLogo size={32} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>History</Text>
            <Text style={styles.subtitle}>Your tracking history</Text>
          </View>
        </View>

        <View style={styles.adherenceSection}>
          <AdherenceCard
            title="Today"
            percentage={dailyAdherence}
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
          {allPortions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No tracking data yet</Text>
              <Text style={styles.emptySubtext}>Start tracking your portions to see your history here</Text>
            </View>
          ) : (
            allPortions.map((dayData) => {
              const isExpanded = expandedDates.has(dayData.date);
              const adherence = calculateDailyAdherence([dayData], profile.portionTargets, dayData.date);
              
              return (
                <View key={dayData.date} style={styles.dayCard}>
                  <TouchableOpacity
                    style={styles.dayHeader}
                    onPress={() => toggleExpand(dayData.date)}
                  >
                    <View style={styles.dayHeaderLeft}>
                      <Text style={styles.dayDate}>{formatDisplayDate(dayData.date)}</Text>
                      <Text style={styles.dayAdherence}>{adherence}% adherence</Text>
                    </View>
                    <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
                  </TouchableOpacity>
                  
                  {isExpanded && (
                    <View style={styles.dayDetails}>
                      {FOOD_GROUPS.map((fg) => {
                        const completed = dayData.portions[fg.key];
                        const target = profile.portionTargets[fg.key];
                        
                        return (
                          <View key={fg.key} style={styles.portionRow}>
                            <Text style={styles.portionIcon}>{fg.icon}</Text>
                            <Text style={styles.portionLabel}>{fg.label}</Text>
                            <Text style={styles.portionCount}>
                              {completed}/{target}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTextContainer: {
    marginLeft: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  adherenceSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  historySection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  dayCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
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
  dayAdherence: {
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
    padding: 16,
    paddingTop: 12,
  },
  portionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  portionIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  portionLabel: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  portionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
