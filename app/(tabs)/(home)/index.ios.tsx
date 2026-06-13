
import DailyCompletionCelebration from '@/components/DailyCompletionCelebration';
import DailyPlateProgress from '@/components/DailyPlateProgress';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { getTodayString, formatDisplayDate } from '@/utils/dateUtils';
import { loadProfile, loadDailyPortions, saveDailyPortions, getAllDailyPortions, hasSeenInfoHint, saveInfoHintSeen } from '@/utils/storage';
import { recordAppOpen, recordTrackingAction, requestReviewIfEligible } from '@/utils/reviewManager';
import InfoHintTooltip from '@/components/InfoHintTooltip.ios';
import { ScrollView, StyleSheet, View, Text, RefreshControl, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { UserProfile, DailyPortions, PortionTargets, FOOD_GROUPS, FoodGroup } from '@/types';
import { loadCelebrationEnabled, saveCelebrationShownToday, hasCelebrationBeenShownToday } from '@/utils/celebrationStorage';
import DaySelector from '@/components/DaySelector.ios';
import FoodGroupRow from '@/components/FoodGroupRow';
import AppLogo from '@/components/AppLogo';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { analyzeMealPhoto, MealPortionSuggestions } from '@/utils/analyzeMealPhoto';

export default function HomeScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dailyPortions, setDailyPortions] = useState<DailyPortions | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [refreshing, setRefreshing] = useState(false);
  const [showInfoHint, setShowInfoHint] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<MealPortionSuggestions | null>(null);
  const [aiPortionEdits, setAiPortionEdits] = useState<Record<string, number>>({});
  const router = useRouter();
  const { t, i18n } = useTranslation();

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

  const handleScanMeal = async () => {
    console.log('[HomeScreen] Scan a Meal pressed');
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera Access Required', 'Please enable camera access in Settings to use meal scanning.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (result.canceled || !result.assets.length) return;
    const uri = result.assets[0].uri;
    setAiLoading(true);
    setAiResult(null);
    try {
      const analysis = await analyzeMealPhoto(uri);
      console.log('[HomeScreen] AI analysis result:', analysis);
      setAiResult(analysis);
      setAiPortionEdits({ ...analysis.portions });
    } catch (err) {
      console.error('[HomeScreen] AI analysis error:', err);
      Alert.alert('Analysis Failed', 'Could not analyse the photo. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleLogAiPortions = async () => {
    if (!dailyPortions || !aiPortionEdits) return;
    const merged = { ...dailyPortions.portions };
    (Object.keys(aiPortionEdits) as (keyof typeof aiPortionEdits)[]).forEach((key) => {
      merged[key as keyof typeof merged] = (merged[key as keyof typeof merged] || 0) + (aiPortionEdits[key] || 0);
    });
    const updated = { ...dailyPortions, portions: merged };
    setDailyPortions(updated);
    await saveDailyPortions(updated);
    setAiResult(null);
    setAiPortionEdits({});
    console.log('[HomeScreen] AI portions logged:', aiPortionEdits);
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
        <Text style={styles.loadingText}>{t('home.loading')}</Text>
      </View>
    );
  }

  const isToday = selectedDate === getTodayString();
  const pastDayLabel = t('common.pastDay');

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
          <Text style={styles.dateText}>{formatDisplayDate(selectedDate, i18n.language)}</Text>
          {!isToday && <Text style={styles.pastDateLabel}>{pastDayLabel}</Text>}
        </View>

        {/* Daily Plate Progress - Visual Summary */}
        <DailyPlateProgress 
          completed={dailyPortions.portions} 
          targets={profile.portionTargets} 
        />

        {/* Divider */}
        <View style={styles.divider} />

        {/* Scan a Meal */}
        <View style={styles.scanContainer}>
          <TouchableOpacity
            onPress={handleScanMeal}
            style={[styles.scanButton, aiLoading && styles.scanButtonDisabled]}
            disabled={aiLoading}
          >
            {aiLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="camera-outline" size={20} color="#fff" />
            )}
            <Text style={styles.scanButtonText}>
              {aiLoading ? 'Analysing…' : '📷 Scan a Meal'}
            </Text>
          </TouchableOpacity>

          {aiResult && (
            <View style={styles.aiCard}>
              <Text style={styles.aiDescription}>{aiResult.description}</Text>
              <Text style={styles.aiSubtitle}>Adjust portions if needed:</Text>
              {FOOD_GROUPS.filter(fg => fg.key !== 'exercise' && fg.key !== 'alcohol').map(fg => {
                const iconValue = typeof fg.icon === 'string' ? fg.icon : '🌰';
                const labelText = t(`foodGroups.${fg.key}`);
                const portionCount = aiPortionEdits[fg.key] ?? 0;
                return (
                  <View key={fg.key} style={styles.aiRow}>
                    <Text style={styles.aiRowIcon}>{iconValue}</Text>
                    <Text style={styles.aiRowLabel}>{labelText}</Text>
                    <View style={styles.aiStepper}>
                      <TouchableOpacity
                        onPress={() => {
                          console.log(`[HomeScreen] AI stepper decrement: ${fg.key}`);
                          setAiPortionEdits(prev => ({ ...prev, [fg.key]: Math.max(0, (prev[fg.key] || 0) - 1) }));
                        }}
                        style={styles.stepperBtn}
                      >
                        <Text style={styles.stepperBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepperValue}>{portionCount}</Text>
                      <TouchableOpacity
                        onPress={() => {
                          console.log(`[HomeScreen] AI stepper increment: ${fg.key}`);
                          setAiPortionEdits(prev => ({ ...prev, [fg.key]: (prev[fg.key] || 0) + 1 }));
                        }}
                        style={styles.stepperBtn}
                      >
                        <Text style={styles.stepperBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
              <View style={styles.aiActions}>
                <TouchableOpacity
                  onPress={() => {
                    console.log('[HomeScreen] AI card cancelled');
                    setAiResult(null);
                    setAiPortionEdits({});
                  }}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleLogAiPortions} style={styles.logBtn}>
                  <Text style={styles.logBtnText}>Log Portions</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Portions */}
        <View style={styles.portionsContainer}>
          {FOOD_GROUPS.map((foodGroupItem, index) => (
            <FoodGroupRow
              key={foodGroupItem.key}
              foodGroup={foodGroupItem.key}
              label={t(`foodGroups.${foodGroupItem.key}`)}
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
  scanContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  aiCard: {
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aiDescription: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  aiSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  aiRowIcon: {
    fontSize: 18,
    width: 28,
  },
  aiRowLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  aiStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 22,
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  aiActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  logBtn: {
    flex: 2,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  logBtnText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  portionsContainer: {
    paddingHorizontal: 16,
  },
  loadingText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
});
