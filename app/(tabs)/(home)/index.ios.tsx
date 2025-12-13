
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { loadProfile, loadDailyPortions, saveDailyPortions, getAllDailyPortions } from '@/utils/storage';
import { getTodayString } from '@/utils/dateUtils';
import { UserProfile, DailyPortions, PortionTargets, FOOD_GROUPS, FoodGroup } from '@/types';
import FoodGroupRow from '@/components/FoodGroupRow';
import ExerciseRow from '@/components/ExerciseRow';
import AppLogo from '@/components/AppLogo';

export default function HomeScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todayPortions, setTodayPortions] = useState<PortionTargets | null>(null);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [allRecords, setAllRecords] = useState<DailyPortions[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      console.log('Home: Loading data...');
      const userProfile = await loadProfile();
      
      if (!userProfile) {
        console.log('Home: No profile found');
        setLoading(false);
        setProfile(null);
        setTodayPortions(null);
        setExerciseCompleted(false);
        return;
      }

      console.log('Home: Profile found, loading portions');
      
      // Ensure profile has all required fields with defaults
      if (!userProfile.targets) {
        console.error('Profile has no targets!');
        setLoading(false);
        return;
      }

      // Ensure all food groups exist with defaults
      const safeTargets: PortionTargets = {
        protein: userProfile.targets.protein || 0,
        veggies: userProfile.targets.veggies || 0,
        fruit: userProfile.targets.fruit || 0,
        wholeGrains: userProfile.targets.wholeGrains || 0,
        nutsSeeds: userProfile.targets.nutsSeeds || 0,
        fats: userProfile.targets.fats || 0,
        dairy: userProfile.targets.dairy || 0,
        water: userProfile.targets.water || 0,
        alcohol: userProfile.targets.alcohol || 0,
      };

      userProfile.targets = safeTargets;
      setProfile(userProfile);

      const today = getTodayString();
      console.log('Today date:', today);
      
      const dailyData = await loadDailyPortions(today);

      if (dailyData && dailyData.portions) {
        console.log('Daily data found:', dailyData);
        
        // Ensure all fields exist with defaults
        const portions: PortionTargets = {
          protein: dailyData.portions.protein || 0,
          veggies: dailyData.portions.veggies || 0,
          fruit: dailyData.portions.fruit || 0,
          wholeGrains: dailyData.portions.wholeGrains || 0,
          nutsSeeds: dailyData.portions.nutsSeeds || 0,
          fats: dailyData.portions.fats || 0,
          dairy: dailyData.portions.dairy || 0,
          water: dailyData.portions.water || 0,
          alcohol: dailyData.portions.alcohol || 0,
        };
        
        setTodayPortions(portions);
        setExerciseCompleted(dailyData.exercise || false);
      } else {
        console.log('No daily data, creating empty portions');
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
        setExerciseCompleted(false);
      }

      const records = await getAllDailyPortions();
      console.log('All records loaded:', records ? records.length : 0);
      setAllRecords(Array.isArray(records) ? records : []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
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

  const handleTogglePortion = async (foodGroup: FoodGroup, increment: boolean) => {
    if (!profile || !todayPortions) {
      console.log('Cannot toggle portion: missing profile or todayPortions');
      return;
    }

    const current = todayPortions[foodGroup] || 0;

    // Allow unlimited tracking - increment or decrement
    let newValue: number;
    if (increment) {
      newValue = current + 1;
    } else {
      newValue = Math.max(0, current - 1); // Don't go below 0
    }

    console.log(`Toggling ${foodGroup}: ${current} -> ${newValue}`);

    const updatedPortions = {
      ...todayPortions,
      [foodGroup]: newValue,
    };

    setTodayPortions(updatedPortions);

    const today = getTodayString();
    const dailyData: DailyPortions = {
      date: today,
      portions: updatedPortions,
      exercise: exerciseCompleted,
    };

    try {
      await saveDailyPortions(dailyData);
      const records = await getAllDailyPortions();
      setAllRecords(Array.isArray(records) ? records : []);
    } catch (error) {
      console.error('Error saving portion toggle:', error);
    }
  };

  const handleToggleExercise = async () => {
    if (!todayPortions) {
      console.log('Cannot toggle exercise: missing todayPortions');
      return;
    }

    const newExerciseState = !exerciseCompleted;
    setExerciseCompleted(newExerciseState);

    const today = getTodayString();
    const dailyData: DailyPortions = {
      date: today,
      portions: todayPortions,
      exercise: newExerciseState,
    };

    try {
      await saveDailyPortions(dailyData);
      console.log('Exercise toggled:', newExerciseState);
    } catch (error) {
      console.error('Error saving exercise toggle:', error);
    }
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
  if (!profile || !todayPortions) {
    return (
      <View style={commonStyles.container}>
        <View style={styles.emptyContainer}>
          <AppLogo size={80} />
          <Text style={styles.emptyTitle}>Welcome to Portion Track!</Text>
          <Text style={styles.emptyMessage}>
            Please create your profile in the Profile tab to get started.
          </Text>
        </View>
      </View>
    );
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
          <Text style={styles.title}>Today&apos;s Portions</Text>
          <Text style={styles.subtitle}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        </View>

        <View style={styles.portionsSection}>
          {FOOD_GROUPS && Array.isArray(FOOD_GROUPS) && FOOD_GROUPS.map((group) => (
            <FoodGroupRow
              key={group.key}
              icon={group.icon}
              label={group.label}
              foodGroup={group.key}
              target={profile.targets[group.key] || 0}
              completed={todayPortions[group.key] || 0}
              onTogglePortion={(increment) => handleTogglePortion(group.key, increment)}
            />
          ))}
          
          <ExerciseRow 
            completed={exerciseCompleted}
            onToggle={handleToggleExercise}
          />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
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
