
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
  const [dailyPortions, setDailyPortions] = useState<DailyPortions | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showInfoHint, setShowInfoHint] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

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
      
      // If no portions exist for this date, create default empty portions with ALL required properties
      if (!portions && profile) {
        portions = {
          date: date,
          portions: {
            wholeGrains: 0,
            protein: 0,
            veggies: 0,
            fruits: 0,
            dairy: 0,
            water: 0,
            nutsSeeds: 0,
            exercise: 0,
          },
        };
        await saveDailyPortions(portions);
      }
      
      // Ensure all properties exist even if loaded from storage (for backward compatibility)
      if (portions) {
        portions.portions = {
          wholeGrains: portions.portions.wholeGrains || 0,
          protein: portions.portions.protein || 0,
          veggies: portions.portions.veggies || 0,
          fruits: portions.portions.fruits || 0,
          dairy: portions.portions.dairy || 0,
          water: portions.portions.water || 0,
          nutsSeeds: portions.portions.nutsSeeds || 0,
          exercise: portions.portions.exercise || 0,
        };
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
    console.log(`handleTogglePortion called: foodGroup=${foodGroup}, increment=${increment}`);
    if (!profile || !dailyPortions) {
      console.log('Cannot toggle portion: profile or dailyPortions is null');
      return;
    }

    const currentValue = dailyPortions.portions[foodGroup] || 0;
    console.log(`Current value for ${foodGroup}: ${currentValue}`);
    
    let newValue = currentValue;
    if (increment) {
      newValue = currentValue + 1;
    } else if (!increment && currentValue > 0) {
      newValue = currentValue - 1;
    }

    console.log(`New value for ${foodGroup}: ${newValue}`);

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

  const handleDismissInfoHint = async () => {
    setShowInfoHint(false);
    await saveInfoHintSeen();
  };

  const handleDismissCelebration = () => {
    setShowCelebration(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={commonStyles.bodyText}>Loading...</Text>
      </View>
    );
  }

  if (!profile || !dailyPortions) {
    return (
      <View style={[styles.container, styles.centerContent]}>
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
        
        <View style={styles.dateHeader}>
          <Text style={styles.dateText}>{formatDisplayDate(selectedDate)}</Text>
        </View>
        
        {FOOD_GROUPS.map((fg, index) => {
          const completed = dailyPortions.portions[fg.key] || 0;
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
});
