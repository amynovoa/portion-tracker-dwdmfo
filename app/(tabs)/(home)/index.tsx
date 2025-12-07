
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { loadProfile, loadDailyServings, saveDailyServings, getAllDailyServings } from '@/utils/storage';
import { getTodayString } from '@/utils/dateUtils';
import { UserProfile, DailyPortionsWithServings, ServingEntry, FOOD_GROUPS, FoodGroup, ServingSize } from '@/types';
import FoodGroupRow from '@/components/FoodGroupRow';
import AdherenceCard from '@/components/AdherenceCard';
import { calculateDailyAdherenceWithServings, calculateWeeklyAdherenceWithServings, calculateMonthlyAdherenceWithServings } from '@/utils/adherenceCalculator';
import { convertServingToPortionUnits } from '@/utils/portionCalculator';
import AppLogo from '@/components/AppLogo';

export default function HomeScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todayServings, setTodayServings] = useState<DailyPortionsWithServings | null>(null);
  const [allRecords, setAllRecords] = useState<DailyPortionsWithServings[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    console.log('Home: Loading data...');
    const userProfile = await loadProfile();
    
    if (!userProfile) {
      console.log('Home: No profile found');
      setLoading(false);
      setProfile(null);
      setTodayServings(null);
      return;
    }

    console.log('Home: Profile found, loading servings');
    setProfile(userProfile);

    const today = getTodayString();
    const dailyData = await loadDailyServings(today);

    if (dailyData) {
      setTodayServings(dailyData);
    } else {
      // Initialize with empty servings
      const emptyServings: DailyPortionsWithServings = {
        date: today,
        servings: {
          protein: [],
          veggies: [],
          fruit: [],
          wholeGrains: [],
          legumes: [],
          nutsSeeds: [],
          fats: [],
          dairy: [],
          water: 0,
          alcohol: [],
        },
      };
      setTodayServings(emptyServings);
    }

    const records = await getAllDailyServings();
    setAllRecords(records);
    setLoading(false);
  };

  // Load data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Home screen focused, loading data');
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddServing = async (foodGroup: FoodGroup, size: ServingSize) => {
    if (!profile || !todayServings) return;

    // Calculate portion units for this serving
    const portionUnits = convertServingToPortionUnits(profile.sex, profile.currentWeight, size);

    const newServing: ServingEntry = {
      size,
      portionUnits,
      timestamp: Date.now(),
    };

    const updatedServings = {
      ...todayServings.servings,
      [foodGroup]: [...todayServings.servings[foodGroup], newServing],
    };

    const updatedData: DailyPortionsWithServings = {
      ...todayServings,
      servings: updatedServings,
    };

    setTodayServings(updatedData);
    await saveDailyServings(updatedData);

    // Reload all records for adherence calculation
    const records = await getAllDailyServings();
    setAllRecords(records);
  };

  const handleRemoveServing = async (foodGroup: FoodGroup, index: number) => {
    if (!profile || !todayServings) return;

    const servingsList = [...todayServings.servings[foodGroup]];
    servingsList.splice(index, 1);

    const updatedServings = {
      ...todayServings.servings,
      [foodGroup]: servingsList,
    };

    const updatedData: DailyPortionsWithServings = {
      ...todayServings,
      servings: updatedServings,
    };

    setTodayServings(updatedData);
    await saveDailyServings(updatedData);

    // Reload all records for adherence calculation
    const records = await getAllDailyServings();
    setAllRecords(records);
  };

  const handleToggleWater = async () => {
    if (!profile || !todayServings) return;

    const currentWater = todayServings.servings.water;
    const target = profile.targets.water;

    // Toggle water: if at target, reset to 0, otherwise increment
    const newWater = currentWater >= target ? 0 : currentWater + 1;

    const updatedData: DailyPortionsWithServings = {
      ...todayServings,
      servings: {
        ...todayServings.servings,
        water: newWater,
      },
    };

    setTodayServings(updatedData);
    await saveDailyServings(updatedData);

    // Reload all records for adherence calculation
    const records = await getAllDailyServings();
    setAllRecords(records);
  };

  // Show loading state
  if (loading) {
    return (
      <View style={commonStyles.container}>
        <View style={styles.loadingContainer}>
          <AppLogo size={80} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  // Show message if no profile
  if (!profile || !todayServings) {
    return (
      <View style={commonStyles.container}>
        <View style={styles.emptyContainer}>
          <AppLogo size={80} />
          <Text style={styles.emptyTitle}>Welcome to Portion Tracker!</Text>
          <Text style={styles.emptyMessage}>
            Please create your profile in the Profile tab to get started.
          </Text>
        </View>
      </View>
    );
  }

  const todayAdherence = calculateDailyAdherenceWithServings(todayServings, profile.targets);
  const weekAdherence = calculateWeeklyAdherenceWithServings(allRecords, profile.targets);
  const monthAdherence = calculateMonthlyAdherenceWithServings(allRecords, profile.targets);

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
              servings={group.key === 'water' ? [] : todayServings.servings[group.key]}
              waterCount={group.key === 'water' ? todayServings.servings.water : undefined}
              onAddServing={(size) => handleAddServing(group.key, size)}
              onRemoveServing={(index) => handleRemoveServing(group.key, index)}
              onToggleWater={group.key === 'water' ? handleToggleWater : undefined}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 24,
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  emptyMessage: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
