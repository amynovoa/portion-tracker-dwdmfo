
import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { loadProfile, loadDailyPortions, saveDailyPortions, getAllDailyPortions, hasSeenInfoHint, saveInfoHintSeen } from '@/utils/storage';
import { getTodayString, formatDisplayDate } from '@/utils/dateUtils';
import { UserProfile, DailyPortions, PortionTargets, FOOD_GROUPS, FoodGroup } from '@/types';
import { loadCelebrationEnabled, saveCelebrationShownToday, hasCelebrationBeenShownToday } from '@/utils/celebrationStorage';
import FoodGroupRow from '@/components/FoodGroupRow';
import ExerciseRow from '@/components/ExerciseRow';
import AppLogo from '@/components/AppLogo';
import InfoHintTooltip from '@/components/InfoHintTooltip';
import DaySelector from '@/components/DaySelector';
import DailyCompletionCelebration from '@/components/DailyCompletionCelebration';
import { useSubscription } from '@/contexts/SubscriptionContext';

export default function HomeScreen() {
  const router = useRouter();
  const { isSubscribed } = useSubscription();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [datePortions, setDatePortions] = useState<PortionTargets | null>(null);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [allRecords, setAllRecords] = useState<DailyPortions[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showInfoHint, setShowInfoHint] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Use ref to prevent multiple simultaneous loads
  const isLoadingRef = useRef(false);

  const loadData = async () => {
    if (isLoadingRef.current) {
      console.log('Load already in progress, skipping...');
      return;
    }

    isLoadingRef.current = true;

    try {
      console.log('Home: Loading data...');
      
      const userProfile = await loadProfile();
      
      if (!userProfile) {
        console.log('Home: No profile found');
        setLoading(false);
        setProfile(null);
        setDatePortions(null);
        setExerciseCompleted(false);
        isLoadingRef.current = false;
        return;
      }

      console.log('Home: Profile found, loading portions');
      
      if (!userProfile.targets) {
        console.error('Profile has no targets!');
        setLoading(false);
        isLoadingRef.current = false;
        return;
      }

      const safeTargets: PortionTargets = {
        protein: userProfile.targets.protein || 0,
        veggies: userProfile.targets.veggies || 0,
        fruit: userProfile.targets.fruit || 0,
        healthyCarbs: userProfile.targets.healthyCarbs || 0,
        fats: userProfile.targets.fats || 0,
        nuts: userProfile.targets.nuts || 0,
        water: userProfile.targets.water || 8,
        alcohol: userProfile.targets.alcohol || 0,
      };

      userProfile.targets = safeTargets;
      setProfile(userProfile);

      await loadDateData(selectedDate);

      const records = await getAllDailyPortions();
      console.log('All records loaded:', records ? records.length : 0);
      setAllRecords(Array.isArray(records) ? records : []);
      
      if (selectedDate === getTodayString()) {
        const seenHint = await hasSeenInfoHint();
        console.log('Has seen info hint:', seenHint);
        setShowInfoHint(!seenHint);
      } else {
        setShowInfoHint(false);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    } finally {
      isLoadingRef.current = false;
    }
  };

  const loadDateData = async (date: string) => {
    try {
      console.log('Loading data for date:', date);
      
      const dailyData = await loadDailyPortions(date);

      if (dailyData && dailyData.portions) {
        console.log('Daily data found:', dailyData);
        
        const portions: PortionTargets = {
          protein: dailyData.portions.protein || 0,
          veggies: dailyData.portions.veggies || 0,
          fruit: dailyData.portions.fruit || 0,
          healthyCarbs: dailyData.portions.healthyCarbs || 0,
          fats: dailyData.portions.fats || 0,
          nuts: dailyData.portions.nuts || 0,
          water: dailyData.portions.water || 0,
          alcohol: dailyData.portions.alcohol || 0,
        };
        
        setDatePortions(portions);
        setExerciseCompleted(dailyData.exercise || false);
      } else {
        console.log('No daily data, creating empty portions');
        const emptyPortions: PortionTargets = {
          protein: 0,
          veggies: 0,
          fruit: 0,
          healthyCarbs: 0,
          fats: 0,
          nuts: 0,
          water: 0,
          alcohol: 0,
        };
        setDatePortions(emptyPortions);
        setExerciseCompleted(false);
      }
    } catch (error) {
      console.error('Error loading date data:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      console.log('Home screen focused, loading data');
      loadData();
    }, [])
  );

  useEffect(() => {
    if (profile) {
      loadDateData(selectedDate);
      
      if (selectedDate === getTodayString()) {
        hasSeenInfoHint().then(seenHint => {
          setShowInfoHint(!seenHint);
        });
      } else {
        setShowInfoHint(false);
      }
    }
  }, [selectedDate]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDateSelect = (date: string) => {
    console.log('Date selected:', date);
    setSelectedDate(date);
  };

  const checkAndShowCelebration = async (updatedPortions: PortionTargets) => {
    if (!profile) return;

    // Only check for today
    if (selectedDate !== getTodayString()) return;

    // Check if celebration is enabled
    const celebrationEnabled = await loadCelebrationEnabled();
    if (!celebrationEnabled) {
      console.log('Celebration is disabled');
      return;
    }

    // Check if celebration was already shown today
    const alreadyShown = await hasCelebrationBeenShownToday(selectedDate);
    if (alreadyShown) {
      console.log('Celebration already shown today');
      return;
    }

    // Check if all targets are met (100% completion)
    const targets = profile.targets;
    let allComplete = true;

    // Check each food group
    for (const group of FOOD_GROUPS) {
      const target = targets[group.key] || 0;
      const completed = updatedPortions[group.key] || 0;
      
      // Skip if target is 0 (not tracking this food group)
      if (target === 0) continue;
      
      if (completed < target) {
        allComplete = false;
        break;
      }
    }

    if (allComplete) {
      console.log('All targets met! Showing celebration...');
      // Small delay to ensure the UI has updated
      setTimeout(() => {
        setShowCelebration(true);
        saveCelebrationShownToday(selectedDate);
      }, 300);
    }
  };

  const handleTogglePortion = async (foodGroup: FoodGroup, increment: boolean) => {
    if (!profile || !datePortions) {
      console.log('Cannot toggle portion: missing profile or datePortions');
      return;
    }

    const current = datePortions[foodGroup] || 0;

    let newValue: number;
    if (increment) {
      newValue = current + 1;
    } else {
      newValue = Math.max(0, current - 1);
    }

    console.log(`Toggling ${foodGroup} for ${selectedDate}: ${current} -> ${newValue}`);

    const updatedPortions = {
      ...datePortions,
      [foodGroup]: newValue,
    };

    setDatePortions(updatedPortions);

    const dailyData: DailyPortions = {
      date: selectedDate,
      portions: updatedPortions,
      exercise: exerciseCompleted,
    };

    try {
      await saveDailyPortions(dailyData);
      const records = await getAllDailyPortions();
      setAllRecords(Array.isArray(records) ? records : []);
      
      // Check if we should show celebration
      await checkAndShowCelebration(updatedPortions);
    } catch (error) {
      console.error('Error saving portion toggle:', error);
    }
  };

  const handleToggleExercise = async () => {
    if (!datePortions) {
      console.log('Cannot toggle exercise: missing datePortions');
      return;
    }

    const newExerciseState = !exerciseCompleted;
    setExerciseCompleted(newExerciseState);

    const dailyData: DailyPortions = {
      date: selectedDate,
      portions: datePortions,
      exercise: newExerciseState,
    };

    try {
      await saveDailyPortions(dailyData);
      console.log('Exercise toggled for', selectedDate, ':', newExerciseState);
    } catch (error) {
      console.error('Error saving exercise toggle:', error);
    }
  };

  const handleDismissInfoHint = async () => {
    console.log('Dismissing info hint');
    setShowInfoHint(false);
    await saveInfoHintSeen();
  };

  const handleDismissCelebration = () => {
    console.log('Dismissing celebration');
    setShowCelebration(false);
  };

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

  if (!profile || !datePortions) {
    return (
      <View style={commonStyles.container}>
        <ScrollView contentContainerStyle={styles.welcomeScrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.emptyContainer}>
            <AppLogo size={80} />
            <Text style={styles.emptyTitle}>Welcome to Portion Track</Text>
            <Text style={styles.emptyTagline}>Simple portions. Real-life flexibility.</Text>
            <Text style={styles.emptyMessage}>
              Track what you eat using portions instead of calories—and adjust them to fit your goals with ease.
            </Text>
            <TouchableOpacity 
              style={[buttonStyles.primary, styles.setupButton]} 
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Text style={commonStyles.buttonText}>Set Up My Profile</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  const isToday = selectedDate === getTodayString();

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
          <Text style={styles.title}>Track</Text>
          <Text style={styles.subtitle}>
            {isToday ? 'Today' : formatDisplayDate(selectedDate)}
          </Text>
        </View>

        {isSubscribed && (
          <View style={styles.subscribedBanner}>
            <Text style={styles.subscribedText}>
              ✨ Premium Active
            </Text>
          </View>
        )}

        <DaySelector 
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
        />

        {!isToday && (
          <View style={styles.pastDayNotice}>
            <Text style={styles.pastDayNoticeText}>
              📅 Editing {formatDisplayDate(selectedDate)}
            </Text>
          </View>
        )}

        <View style={styles.portionsSection}>
          {FOOD_GROUPS && Array.isArray(FOOD_GROUPS) && FOOD_GROUPS.map((group, index) => (
            <FoodGroupRow
              key={group.key}
              icon={group.icon}
              label={group.label}
              foodGroup={group.key}
              target={profile.targets[group.key] || 0}
              completed={datePortions[group.key] || 0}
              onTogglePortion={(increment) => handleTogglePortion(group.key, increment)}
              showInfoHint={false}
              isFirstRow={index === 0}
            />
          ))}
          
          <ExerciseRow 
            completed={exerciseCompleted}
            onToggle={handleToggleExercise}
          />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {showInfoHint && (
        <InfoHintTooltip 
          visible={showInfoHint} 
          onDismiss={handleDismissInfoHint}
        />
      )}

      <DailyCompletionCelebration
        visible={showCelebration}
        onDismiss={handleDismissCelebration}
      />
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
  subscribedBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.highlight,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  subscribedText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  pastDayNotice: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.highlight,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  pastDayNoticeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
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
  welcomeScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 120,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyTitle: {
    marginTop: 24,
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  emptyTagline: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 26,
  },
  emptyMessage: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 400,
  },
  setupButton: {
    marginTop: 32,
    paddingHorizontal: 32,
  },
});
