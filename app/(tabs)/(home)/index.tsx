
import { ScrollView, StyleSheet, View, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import React, { useState, useEffect } from 'react';
import DailyCompletionCelebration from '@/components/DailyCompletionCelebration';
import { useRouter, useFocusEffect } from 'expo-router';
import DaySelector from '@/components/DaySelector';
import { loadProfile, loadDailyPortions, saveDailyPortions, getAllDailyPortions, hasSeenInfoHint, saveInfoHintSeen } from '@/utils/storage';
import { loadCelebrationEnabled, saveCelebrationShownToday, hasCelebrationBeenShownToday } from '@/utils/celebrationStorage';
import { UserProfile, DailyPortions, PortionTargets, FOOD_GROUPS, FoodGroup } from '@/types';
import FoodGroupRow from '@/components/FoodGroupRow';
import { getTodayString, formatDisplayDate } from '@/utils/dateUtils';
import InfoHintTooltip from '@/components/InfoHintTooltip';

export default function HomeScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dailyPortions, setDailyPortions] = useState<PortionTargets>({
    wholeGrains: 0,
    protein: 0,
    veggies: 0,
    fruits: 0,
    dairy: 0,
    water: 0,
    nutsSeeds: 0,
    exercise: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [showInfoHint, setShowInfoHint] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    loadDateData(selectedDate);
  }, [selectedDate, profile]);

  const loadData = async () => {
    const prof = await loadProfile();
    if (!prof) {
      router.replace('/setup-profile');
      return;
    }
    setProfile(prof);
    
    const hintSeen = await hasSeenInfoHint();
    if (!hintSeen) {
      setShowInfoHint(true);
    }
    
    await loadDateData(selectedDate);
  };

  const loadDateData = async (date: string) => {
    if (!profile) return;
    
    const portions = await loadDailyPortions(date);
    if (portions && portions.portions) {
      // Ensure all properties exist with fallback to 0
      setDailyPortions({
        wholeGrains: portions.portions.wholeGrains || 0,
        protein: portions.portions.protein || 0,
        veggies: portions.portions.veggies || 0,
        fruits: portions.portions.fruits || 0,
        dairy: portions.portions.dairy || 0,
        water: portions.portions.water || 0,
        nutsSeeds: portions.portions.nutsSeeds || 0,
        exercise: portions.portions.exercise || 0,
      });
    } else {
      // Initialize with all zeros if no data exists
      setDailyPortions({
        wholeGrains: 0,
        protein: 0,
        veggies: 0,
        fruits: 0,
        dairy: 0,
        water: 0,
        nutsSeeds: 0,
        exercise: 0,
      });
    }
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
    
    const alreadyShown = await hasCelebrationBeenShownToday();
    if (alreadyShown) return;
    
    const allComplete = FOOD_GROUPS.every(fg => {
      if (fg.key === 'exercise') return true;
      const target = profile.portionTargets[fg.key] || 0;
      const completed = updatedPortions[fg.key] || 0;
      return completed >= target;
    });
    
    if (allComplete) {
      setShowCelebration(true);
      await saveCelebrationShownToday();
    }
  };

  const handleTogglePortion = async (foodGroup: FoodGroup, increment: boolean) => {
    if (!profile) return;
    
    const newPortions = { ...dailyPortions };
    const currentValue = newPortions[foodGroup] || 0;
    
    if (increment) {
      newPortions[foodGroup] = currentValue + 1;
    } else {
      newPortions[foodGroup] = Math.max(0, currentValue - 1);
    }
    
    setDailyPortions(newPortions);
    
    await saveDailyPortions({
      date: selectedDate,
      portions: newPortions,
    });
    
    await checkAndShowCelebration(newPortions);
  };

  const handleDismissInfoHint = async () => {
    setShowInfoHint(false);
    await saveInfoHintSeen();
  };

  const handleDismissCelebration = () => {
    setShowCelebration(false);
  };

  if (!profile) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <DaySelector
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
        />
        
        {FOOD_GROUPS.map((fg, index) => {
          const completed = dailyPortions[fg.key] || 0;
          const target = profile.portionTargets[fg.key] || 0;
          
          return (
            <FoodGroupRow
              key={fg.key}
              foodGroup={fg.key}
              label={fg.label}
              icon={fg.icon}
              completed={completed}
              target={target}
              onTogglePortion={(increment) => handleTogglePortion(fg.key, increment)}
              hideCount={fg.key === 'exercise'}
              showInfoHint={index === 0 && showInfoHint}
              isFirstRow={index === 0}
            />
          );
        })}
      </ScrollView>
      
      <InfoHintTooltip
        visible={showInfoHint}
        onDismiss={handleDismissInfoHint}
      />
      
      <DailyCompletionCelebration
        visible={showCelebration}
        onDismiss={handleDismissCelebration}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 120,
  },
});
