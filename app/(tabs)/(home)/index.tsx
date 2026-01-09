
import { getTodayString, formatDisplayDate } from '@/utils/dateUtils';
import DaySelector from '@/components/DaySelector';
import { UserProfile, DailyPortions, PortionTargets, FOOD_GROUPS, FoodGroup } from '@/types';
import { ScrollView, StyleSheet, View, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { loadProfile, loadDailyPortions, saveDailyPortions, getAllDailyPortions, hasSeenInfoHint, saveInfoHintSeen } from '@/utils/storage';
import FoodGroupRow from '@/components/FoodGroupRow';
import DailyCompletionCelebration from '@/components/DailyCompletionCelebration';
import { loadCelebrationEnabled, saveCelebrationShownToday, hasCelebrationBeenShownToday } from '@/utils/celebrationStorage';
import ExerciseRow from '@/components/ExerciseRow';
import InfoHintTooltip from '@/components/InfoHintTooltip';

export default function HomeScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [dailyPortions, setDailyPortions] = useState<DailyPortions | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showInfoHint, setShowInfoHint] = useState(false);
  const router = useRouter();

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    loadDateData(selectedDate);
  }, [selectedDate]);

  const loadData = async () => {
    const userProfile = await loadProfile();
    setProfile(userProfile);
    
    if (!userProfile) {
      router.replace('/setup-profile');
      return;
    }

    await loadDateData(selectedDate);
    
    const hintSeen = await hasSeenInfoHint();
    setShowInfoHint(!hintSeen);
  };

  const loadDateData = async (date: string) => {
    const portions = await loadDailyPortions(date);
    setDailyPortions(portions);
  };

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

    const alreadyShown = await hasCelebrationBeenShownToday(selectedDate);
    if (alreadyShown) return;

    const allComplete = FOOD_GROUPS.every(group => {
      const target = profile.portionTargets[group];
      const completed = updatedPortions[group] || 0;
      return completed >= target;
    });

    if (allComplete) {
      setShowCelebration(true);
      await saveCelebrationShownToday(selectedDate);
    }
  };

  const handleTogglePortion = async (foodGroup: FoodGroup, increment: boolean) => {
    if (!profile || !dailyPortions) return;

    const currentValue = dailyPortions.portions[foodGroup] || 0;
    const targetValue = profile.portionTargets[foodGroup];
    
    let newValue = currentValue;
    if (increment && currentValue < targetValue) {
      newValue = currentValue + 1;
    } else if (!increment && currentValue > 0) {
      newValue = currentValue - 1;
    }

    const updatedPortions = {
      ...dailyPortions.portions,
      [foodGroup]: newValue,
    };

    const updatedDailyPortions: DailyPortions = {
      ...dailyPortions,
      portions: updatedPortions,
    };

    setDailyPortions(updatedDailyPortions);
    await saveDailyPortions(updatedDailyPortions);
    await checkAndShowCelebration(updatedPortions);
  };

  const handleToggleExercise = async () => {
    if (!dailyPortions) return;

    const updatedDailyPortions: DailyPortions = {
      ...dailyPortions,
      exerciseCompleted: !dailyPortions.exerciseCompleted,
    };

    setDailyPortions(updatedDailyPortions);
    await saveDailyPortions(updatedDailyPortions);
  };

  const handleDismissInfoHint = async () => {
    setShowInfoHint(false);
    await saveInfoHintSeen();
  };

  const handleDismissCelebration = () => {
    setShowCelebration(false);
  };

  if (!profile) {
    return (
      <View style={[commonStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={commonStyles.title}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={commonStyles.title}>Portion Tracker</Text>
          <Text style={styles.dateText}>{formatDisplayDate(selectedDate)}</Text>
        </View>

        <DaySelector selectedDate={selectedDate} onDateSelect={handleDateSelect} />

        {showInfoHint && (
          <InfoHintTooltip
            message="Tap the ℹ️ icon on any food group to learn more about portion sizes and examples!"
            onDismiss={handleDismissInfoHint}
          />
        )}

        <View style={styles.portionsContainer}>
          {FOOD_GROUPS.map((foodGroup) => (
            <FoodGroupRow
              key={foodGroup}
              foodGroup={foodGroup}
              completed={dailyPortions?.portions[foodGroup] || 0}
              target={profile.portionTargets[foodGroup]}
              onToggle={(increment) => handleTogglePortion(foodGroup, increment)}
            />
          ))}
        </View>

        <ExerciseRow
          completed={dailyPortions?.exerciseCompleted || false}
          onToggle={handleToggleExercise}
        />
      </ScrollView>

      <DailyCompletionCelebration
        visible={showCelebration}
        onDismiss={handleDismissCelebration}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  portionsContainer: {
    marginTop: 20,
  },
});
