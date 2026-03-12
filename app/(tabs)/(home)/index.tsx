
import DailyCompletionCelebration from '@/components/DailyCompletionCelebration';
import DailyPlateProgress from '@/components/DailyPlateProgress';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { getTodayString, formatDisplayDate } from '@/utils/dateUtils';
import { loadProfile, loadDailyPortions, saveDailyPortions, getAllDailyPortions, hasSeenInfoHint, saveInfoHintSeen } from '@/utils/storage';
import { recordAppOpen, recordTrackingAction, requestReviewIfEligible } from '@/utils/reviewManager';
import InfoHintTooltip from '@/components/InfoHintTooltip';
import { ScrollView, StyleSheet, View, Text, RefreshControl, TouchableOpacity } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { UserProfile, DailyPortions, PortionTargets, FOOD_GROUPS, FoodGroup } from '@/types';
import { loadCelebrationEnabled, saveCelebrationShownToday, hasCelebrationBeenShownToday } from '@/utils/celebrationStorage';
import DaySelector from '@/components/DaySelector';
import FoodGroupRow from '@/components/FoodGroupRow';
import AppLogo from '@/components/AppLogo';

export default function HomeScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dailyPortions, setDailyPortions] = useState<DailyPortions | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [refreshing, setRefreshing] = useState(false);
  const [showInfoHint, setShowInfoHint] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const router = useRouter();

  const loadDateData = useCallback(async (date: string) => {
    console.log('Loading portions for date:', date);
    const portions = await loadDailyPortions(date);
    console.log('Portions loaded:', portions);
    setDailyPortions(portions);
  }, []);

  const loadData = useCallback(async () => {
    console.log('Loading profile...');
    const userProfile = await loadProfile();
    console.log('Profile loaded:', userProfile ? 'exists' : 'null');
    
    if (!userProfile) {
      console.log('No profile found, redirecting to welcome');
      router.replace('/welcome');
      return;
    }
    setProfile(userProfile);
    await loadDateData(selectedDate);

    const hasSeenHint = await hasSeenInfoHint();
    if (!hasSeenHint) {
      setShowInfoHint(true);
    }

    // Record app open for review metrics
    await recordAppOpen();
  }, [router, selectedDate, loadDateData]);

  useFocusEffect(
    useCallback(() => {
      console.log('HomeScreen focused, loading data...');
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    loadDateData(selectedDate);
  }, [selectedDate, loadDateData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const checkAndShowCelebration = async (updatedPortions: PortionTargets) => {
    if (!profile || selectedDate !== getTodayString()) return;

    const celebrationEnabled = await loadCelebrationEnabled();
    if (!celebrationEnabled) return;

    const alreadyShown = await hasCelebrationBeenShownToday();
    if (alreadyShown) return;

    const allComplete = FOOD_GROUPS.every(fg => {
      const target = profile.portionTargets[fg.key];
      const completed = updatedPortions[fg.key] || 0;
      return completed >= target;
    });

    if (allComplete) {
      setShowCelebration(true);
      await saveCelebrationShownToday();
    }
  };

  const handleTogglePortion = async (foodGroup: FoodGroup, increment: boolean) => {
    if (!dailyPortions || !profile) return;

    const currentValue = dailyPortions.portions[foodGroup] || 0;
    const newValue = increment ? currentValue + 1 : Math.max(0, currentValue - 1);

    const updatedPortions = {
      ...dailyPortions.portions,
      [foodGroup]: newValue,
    };

    const updatedDailyPortions = {
      ...dailyPortions,
      portions: updatedPortions,
    };

    setDailyPortions(updatedDailyPortions);
    await saveDailyPortions(updatedDailyPortions);

    if (increment) {
      // Record tracking action for review metrics
      await recordTrackingAction();
      
      // Check if we should request a review
      await requestReviewIfEligible();
      
      await checkAndShowCelebration(updatedPortions);
    }
  };

  const handleDismissInfoHint = async () => {
    setShowInfoHint(false);
    await saveInfoHintSeen();
  };

  const handleDismissCelebration = () => {
    setShowCelebration(false);
  };

  if (!profile || !dailyPortions) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const isToday = selectedDate === getTodayString();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Logo at top */}
        <View style={styles.logoContainer}>
          <AppLogo size={50} />
        </View>

        <DaySelector selectedDate={selectedDate} onDateSelect={handleDateSelect} />

        <View style={styles.dateHeader}>
          <Text style={styles.dateText}>{formatDisplayDate(selectedDate)}</Text>
          {!isToday && <Text style={styles.pastDateLabel}>Past Day</Text>}
        </View>

        {/* Daily Plate Progress - Visual Summary */}
        <DailyPlateProgress 
          completed={dailyPortions.portions} 
          targets={profile.portionTargets} 
        />

        {/* Divider */}
        <View style={styles.divider} />

        <View style={styles.portionsContainer}>
          {FOOD_GROUPS.map((foodGroupItem, index) => (
            <FoodGroupRow
              key={foodGroupItem.key}
              foodGroup={foodGroupItem.key}
              label={foodGroupItem.label}
              icon={foodGroupItem.icon}
              completed={dailyPortions.portions[foodGroupItem.key] || 0}
              target={profile.portionTargets[foodGroupItem.key]}
              onTogglePortion={(increment) => handleTogglePortion(foodGroupItem.key, increment)}
              hideCount={foodGroupItem.key === 'exercise'}
              isFirstRow={index === 0}
              showInfoHint={index === 0 && showInfoHint}
            />
          ))}
        </View>
      </ScrollView>

      <InfoHintTooltip visible={showInfoHint} onDismiss={handleDismissInfoHint} />
      <DailyCompletionCelebration visible={showCelebration} onDismiss={handleDismissCelebration} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  dateText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  pastDateLabel: {
    fontSize: 15,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
    marginVertical: 20,
  },
  portionsContainer: {
    paddingHorizontal: 16,
  },
  loadingText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
});
