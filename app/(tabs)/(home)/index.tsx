
import DaySelector from '@/components/DaySelector';
import { getTodayString, formatDisplayDate } from '@/utils/dateUtils';
import { UserProfile, DailyPortions, PortionTargets, FOOD_GROUPS, FoodGroup } from '@/types';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { ScrollView, StyleSheet, View, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import DailyCompletionCelebration from '@/components/DailyCompletionCelebration';
import { loadProfile, loadDailyPortions, saveDailyPortions, getAllDailyPortions, hasSeenInfoHint, saveInfoHintSeen } from '@/utils/storage';
import FoodGroupRow from '@/components/FoodGroupRow';
import { loadCelebrationEnabled, saveCelebrationShownToday, hasCelebrationBeenShownToday } from '@/utils/celebrationStorage';
import ExerciseRow from '@/components/ExerciseRow';
import React, { useState, useEffect } from 'react';
import InfoHintTooltip from '@/components/InfoHintTooltip';

export default function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dailyPortions, setDailyPortions] = useState<DailyPortions | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showInfoHint, setShowInfoHint] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [selectedDate])
  );

  const loadData = async () => {
    const userProfile = await loadProfile();
    setProfile(userProfile);

    if (!userProfile) {
      router.replace('/welcome');
      return;
    }

    await loadDateData(selectedDate);

    const hintSeen = await hasSeenInfoHint();
    if (!hintSeen && selectedDate === getTodayString()) {
      setShowInfoHint(true);
    }
  };

  const loadDateData = async (date: string) => {
    if (!profile) return;

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
      const target = profile.portionTargets[group.key];
      const completed = updatedPortions[group.key] || 0;
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

    let newValue: number;
    if (increment) {
      newValue = Math.min(currentValue + 1, targetValue + 5);
    } else {
      newValue = Math.max(currentValue - 1, 0);
    }

    const updatedPortions = {
      ...dailyPortions.portions,
      [foodGroup]: newValue,
    };

    const updatedDailyPortions: DailyPortions = {
      ...dailyPortions,
      portions: updatedPortions,
    };

    await saveDailyPortions(updatedDailyPortions);
    setDailyPortions(updatedDailyPortions);

    await checkAndShowCelebration(updatedPortions);
  };

  const handleToggleExercise = async () => {
    if (!dailyPortions) return;

    const updatedDailyPortions: DailyPortions = {
      ...dailyPortions,
      exercise: !dailyPortions.exercise,
    };

    await saveDailyPortions(updatedDailyPortions);
    setDailyPortions(updatedDailyPortions);
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
      <View style={[commonStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={commonStyles.bodyText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <DaySelector selectedDate={selectedDate} onDateSelect={handleDateSelect} />

        <View style={styles.dateHeader}>
          <Text style={styles.dateText}>{formatDisplayDate(selectedDate)}</Text>
        </View>

        <InfoHintTooltip visible={showInfoHint} onDismiss={handleDismissInfoHint} />

        <View style={styles.portionsContainer}>
          {FOOD_GROUPS.map((foodGroupItem, index) => (
            <FoodGroupRow
              key={foodGroupItem.key}
              icon={foodGroupItem.icon}
              label={foodGroupItem.label}
              foodGroup={foodGroupItem.key}
              completed={dailyPortions.portions[foodGroupItem.key] || 0}
              target={profile.portionTargets[foodGroupItem.key]}
              onTogglePortion={(increment) => handleTogglePortion(foodGroupItem.key, increment)}
              showInfoHint={showInfoHint && index === 0}
              isFirstRow={index === 0}
            />
          ))}

          <ExerciseRow
            completed={dailyPortions.exercise || false}
            onToggle={handleToggleExercise}
          />
        </View>
      </ScrollView>

      <DailyCompletionCelebration visible={showCelebration} onDismiss={handleDismissCelebration} />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 100,
  },
  dateHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  portionsContainer: {
    paddingHorizontal: 0,
  },
});
