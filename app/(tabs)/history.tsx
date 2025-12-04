
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';
import { getAllDailyPortions, loadProfile } from '@/utils/storage';
import { DailyPortions, UserProfile, FOOD_GROUPS } from '@/types';
import { formatDisplayDate } from '@/utils/dateUtils';
import { calculateDailyAdherence } from '@/utils/adherenceCalculator';

export default function HistoryScreen() {
  const [records, setRecords] = useState<DailyPortions[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const allRecords = await getAllDailyPortions();
    setRecords(allRecords);
    
    const userProfile = await loadProfile();
    setProfile(userProfile);
  };

  const toggleExpand = (date: string) => {
    setExpandedDate(expandedDate === date ? null : date);
  };

  if (!profile) {
    return (
      <View style={[commonStyles.container, styles.centerContent]}>
        <Text style={commonStyles.text}>No profile found</Text>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>Your tracking history</Text>
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
