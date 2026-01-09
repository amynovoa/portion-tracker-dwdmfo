
import { getTodayString, formatDisplayDate } from '@/utils/dateUtils';
import DaySelector from '@/components/DaySelector';
import { UserProfile, DailyPortions, PortionTargets, FOOD_GROUPS, FoodGroup } from '@/types';
import { ScrollView, StyleSheet, View, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useRouter, useFocusEffect } from 'expo-router';
import DailyCompletionCelebration from '@/components/DailyCompletionCelebration';
import { loadProfile, loadDailyPortions, saveDailyPortions, getAllDailyPortions, hasSeenInfoHint, saveInfoHintSeen } from '@/utils/storage';
import FoodGroupRow from '@/components/FoodGroupRow';
import { loadCelebrationEnabled, saveCelebrationShownToday, hasCelebrationBeenShownToday } from '@/utils/celebrationStorage';
import ExerciseRow from '@/components/ExerciseRow';
import React, { useState, useEffect } from 'react';
import InfoHintTooltip from '@/components/InfoHintTooltip';

export default function HomeScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dailyPortions, setDailyPortions] = useState<DailyPortions | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showInfoHint, setShowInfoHint] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    if (profile) {
      loadDateData(selectedDate);
    }
  }, [selectedDate, profile]);

  const loadData = async () => {
    console.log('Loading track screen data...');
    try {
      setLoading(true);
      const userProfile = await loadProfile();
      console.log('Profile loaded:', userProfile ? 'Found' : 'Not found');
      
      if (!userProfile) {
        console.log('No profile found, redirecting to setup...');
        router.replace('/setup-profile');
        return;
      }
      
      setProfile(userProfile);
      await loadDateData(selectedDate);
      
      const hasSeenHint = await hasSeenInfoHint();
      if (!hasSeenHint) {
        setShowInfoHint(true);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDateData = async (date: string) => {
    console.log('Loading date data for:', date);
    try {
      let portions = await loadDailyPortions(date);
      console.log('Portions loaded:', portions ? 'Found' : 'Creating new');
      
      // If no portions exist for this date, create default empty portions
      if (!portions && profile) {
        portions = {
          date: date,
          portions: {
            protein: 0,
            veggies: 0,
            fruit: 0,
            wholeGrains: 0,
            nutsSeeds: 0,
            fats: 0,
            water: 0,
            alcohol: 0,
          },
          exercise: false,
        };
        await saveDailyPortions(portions);
      }
      
      setDailyPortions(portions);
    } catch (error) {
      console.error('Error loading date data:', error);
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
    if (!profile) return;

    const celebrationEnabled = await loadCelebrationEnabled();
    if (!celebrationEnabled) return;

    const alreadyShown = await hasCelebrationBeenShownToday(selectedDate);
    if (alreadyShown) return;

    const isToday = selectedDate === getTodayString();
    if (!isToday) return;

    const allComplete = FOOD_GROUPS.every(fg => {
      const target = profile.portionTargets[fg.key];
      const completed = updatedPortions[fg.key];
      return completed >= target;
    });

    if (allComplete) {
      setShowCelebration(true);
      await saveCelebrationShownToday(selectedDate);
    }
  };

  const handleTogglePortion = async (foodGroup: FoodGroup, increment: boolean) => {
    console.log(`handleTogglePortion called: foodGroup=${foodGroup}, increment=${increment}`);
    if (!profile || !dailyPortions) {
      console.log('Cannot toggle portion: profile or dailyPortions is null');
      return;
    }

    const currentValue = dailyPortions.portions[foodGroup];
    const targetValue = profile.portionTargets[foodGroup];
    
    console.log(`Current value: ${currentValue}, Target value: ${targetValue}`);
    
    let newValue = currentValue;
    if (increment) {
      // Allow going beyond target
      newValue = currentValue + 1;
    } else if (!increment && currentValue > 0) {
      newValue = currentValue - 1;
    }

    console.log(`New value: ${newValue}`);

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
      exercise: !dailyPortions.exercise,
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

  if (loading) {
    return (
      <View style={[commonStyles.container, styles.centerContent]}>
        <Text style={commonStyles.bodyText}>Loading...</Text>
      </View>
    );
  }

  if (!profile || !dailyPortions) {
    return (
      <View style={[commonStyles.container, styles.centerContent]}>
        <Text style={commonStyles.bodyText}>No data available</Text>
        <TouchableOpacity 
          style={[buttonStyles.primary, { marginTop: 20 }]}
          onPress={() => router.push('/setup-profile')}
        >
          <Text style={buttonStyles.primaryText}>Set Up Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <DaySelector
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
        />

        <View style={styles.dateHeader}>
          <Text style={styles.dateText}>{formatDisplayDate(selectedDate)}</Text>
        </View>

        <View style={styles.portionsContainer}>
          {FOOD_GROUPS.map((foodGroupItem, index) => (
            <FoodGroupRow
              key={foodGroupItem.key}
              foodGroup={foodGroupItem.key}
              label={foodGroupItem.label}
              icon={foodGroupItem.icon}
              completed={dailyPortions.portions[foodGroupItem.key]}
              target={profile.portionTargets[foodGroupItem.key]}
              onTogglePortion={(increment) => handleTogglePortion(foodGroupItem.key, increment)}
              showInfoHint={showInfoHint && index === 0}
              isFirstRow={index === 0}
            />
          ))}
        </View>

        <ExerciseRow
          completed={dailyPortions.exercise || false}
          onToggle={handleToggleExercise}
        />
      </ScrollView>

      <InfoHintTooltip visible={showInfoHint} onDismiss={handleDismissInfoHint} />
      
      <DailyCompletionCelebration
        visible={showCelebration}
        onDismiss={handleDismissCelebration}
      />
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
    paddingHorizontal: 20,
  },
});
