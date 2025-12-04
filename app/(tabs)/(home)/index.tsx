
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { loadProfile, loadDailyPortions, saveDailyPortions, getAllDailyPortions } from '@/utils/storage';
import { getTodayString } from '@/utils/dateUtils';
import { UserProfile, DailyPortions, PortionTargets, FOOD_GROUPS, FoodGroup } from '@/types';
import FoodGroupRow from '@/components/FoodGroupRow';
import AdherenceCard from '@/components/AdherenceCard';
import { calculateDailyAdherence, calculateWeeklyAdherence, calculateMonthlyAdherence } from '@/utils/adherenceCalculator';
import AppLogo from '@/components/AppLogo';

export default function HomeScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todayPortions, setTodayPortions] = useState<PortionTargets | null>(null);
  const [allRecords, setAllRecords] = useState<DailyPortions[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    console.log('Loading data...');
    const userProfile = await loadProfile();
    
    if (!userProfile) {
      console.log('No profile found, redirecting to profile setup');
      router.replace('/(tabs)/profile');
      return;
    }

    setProfile(userProfile);

    const today = getTodayString();
    const dailyData = await loadDailyPortions(today);

    if (dailyData) {
      setTodayPortions(dailyData.portions);
    } else {
      // Initialize with zeros
      const emptyPortions: PortionTargets = {
        protein: 0,
        veggies: 0,
        fruit: 0,
        wholeGrains: 0,
        legumes: 0,
        nutsSeeds: 0,
        fats: 0,
        water: 0,
        alcohol: 0,
      };
      setTodayPortions(emptyPortions);
    }

    const records = await getAllDailyPortions();
    setAllRecords(records);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleTogglePortion = async (foodGroup: FoodGroup, index: number) => {
    if (!profile || !todayPortions) return;

    const target = profile.targets[foodGroup];
    const current = todayPortions[foodGroup];

    let newValue: number;
    if (index < current) {
      // Tapping a completed slot - decrease count
      newValue = index;
    } else {
      // Tapping an empty slot - increase count to that position
      newValue = index + 1;
    }

    const updatedPortions = {
      ...todayPortions,
      [foodGroup]: newValue,
    };

    setTodayPortions(updatedPortions);

    const today = getTodayString();
    const dailyData: DailyPortions = {
      date: today,
      portions: updatedPortions,
    };

    await saveDailyPortions(dailyData);

    // Reload all records for adherence calculation
    const records = await getAllDailyPortions();
    setAllRecords(records);
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, styles.centerContent]}>
        <Text style={commonStyles.text}>Loading...</Text>
      </View>
    );
  }

  if (!profile || !todayPortions) {
    return null;
  }

  const todayAdherence = calculateDailyAdherence(todayPortions, profile.targets);
  const weekAdherence = calculateWeeklyAdherence(allRecords, profile.targets);
  const monthAdherence = calculateMonthlyAdherence(allRecords, profile.targets);

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
          <Text style={styles.title}>Today&apos;s Portions</Text>
          <Text style={styles.subtitle}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        </View>

        <View style={styles.adherenceSection}>
          <AdherenceCard title="Today" percentage={todayAdherence} />
          <AdherenceCard title="This Week" percentage={weekAdherence} />
          <AdherenceCard title="This Month" percentage={monthAdherence} />
        </View>

        <View style={styles.portionsSection}>
          {FOOD_GROUPS.map((group) => (
            <FoodGroupRow
              key={group.key}
              icon={group.icon}
              label={group.label}
              foodGroup={group.key}
              target={profile.targets[group.key]}
              completed={todayPortions[group.key]}
              onToggle={(index) => handleTogglePortion(group.key, index)}
            />
          ))}
        </View>

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
  portionsSection: {
    marginBottom: 16,
  },
  bottomPadding: {
    height: 20,
  },
});
