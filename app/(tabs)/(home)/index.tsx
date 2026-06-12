
import DailyCompletionCelebration from '@/components/DailyCompletionCelebration';
import DailyPlateProgress from '@/components/DailyPlateProgress';
import PhotoViewerModal from '@/components/PhotoViewerModal';
import { colors } from '@/styles/commonStyles';
import { getTodayString, formatDisplayDate } from '@/utils/dateUtils';
import { loadProfile, loadDailyPortions, saveDailyPortions, hasSeenInfoHint, saveInfoHintSeen } from '@/utils/storage';
import { recordAppOpen, recordTrackingAction, requestReviewIfEligible } from '@/utils/reviewManager';
import InfoHintTooltip from '@/components/InfoHintTooltip';
import { ScrollView, StyleSheet, View, Text, RefreshControl, TouchableOpacity, Image, Alert } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { UserProfile, DailyPortions, PortionTargets, FOOD_GROUPS, FoodGroup } from '@/types';
import { loadCelebrationEnabled, saveCelebrationShownToday, hasCelebrationBeenShownToday } from '@/utils/celebrationStorage';
import DaySelector from '@/components/DaySelector';
import FoodGroupRow from '@/components/FoodGroupRow';
import AppLogo from '@/components/AppLogo';
import { useTranslation } from 'react-i18next';
import { saveDailyPhoto, loadDailyPhoto, deleteDailyPhoto } from '@/utils/photoStorage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dailyPortions, setDailyPortions] = useState<DailyPortions | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [refreshing, setRefreshing] = useState(false);
  const [showInfoHint, setShowInfoHint] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [dailyPhotoUri, setDailyPhotoUri] = useState<string | null>(null);
  const [photoViewerVisible, setPhotoViewerVisible] = useState(false);
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const loadDateData = useCallback(async (date: string) => {
    console.log('Loading portions for date:', date);
    const portions = await loadDailyPortions(date);
    console.log('Portions loaded:', portions);
    setDailyPortions(portions);

    console.log('Loading daily photo for date:', date);
    const uri = await loadDailyPhoto(date);
    console.log('Daily photo loaded:', { date, found: !!uri });
    setDailyPhotoUri(uri);
  }, []);

  const loadData = useCallback(async () => {
    console.log('Loading profile...');
    const userProfile = await loadProfile();
    console.log('Profile loaded:', userProfile ? 'exists' : 'null');
    
    if (!userProfile) {
      console.log('No profile found, redirecting to setup-profile');
      router.replace('/setup-profile');
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

  const handleCameraPress = async () => {
    console.log('HomeScreen: daily photo camera button pressed');
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    console.log('HomeScreen: camera permission status', status);
    if (status !== 'granted') {
      Alert.alert('Camera Access Required', 'Please enable camera access in Settings to log photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    console.log('HomeScreen: camera result', { cancelled: result.canceled });
    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      console.log('HomeScreen: daily photo taken, saving for date', selectedDate);
      await saveDailyPhoto(selectedDate, uri);
      setDailyPhotoUri(uri);
    }
  };

  const handlePhotoDelete = async () => {
    console.log('HomeScreen: deleting daily photo for date', selectedDate);
    await deleteDailyPhoto(selectedDate);
    setDailyPhotoUri(null);
    setPhotoViewerVisible(false);
  };

  const handleDismissInfoHint = async () => {
    setShowInfoHint(false);
    await saveInfoHintSeen();
  };

  const handleDismissCelebration = () => {
    setShowCelebration(false);
  };

  if (!profile || !dailyPortions) {
    const loadingText = t('home.loading');
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.loadingText}>{loadingText}</Text>
      </View>
    );
  }

  const isToday = selectedDate === getTodayString();
  const pastDayLabel = t('common.pastDay');
  const photoLogTitle = isToday ? '📷 Today\'s Meal Photo' : '📷 Meal Photo';

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

        {/* Daily Photo Log */}
        <View style={styles.photoLogContainer}>
          <Text style={styles.photoLogTitle}>{photoLogTitle}</Text>
          {dailyPhotoUri ? (
            <TouchableOpacity
              onPress={() => {
                console.log('HomeScreen: photo thumbnail pressed, opening viewer');
                setPhotoViewerVisible(true);
              }}
              style={styles.photoThumbnailWrapper}
            >
              <Image source={{ uri: dailyPhotoUri }} style={styles.photoThumbnail} resizeMode="cover" />
              <Text style={styles.photoTapHint}>Tap to view or delete</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleCameraPress} style={styles.addPhotoButton}>
              <Ionicons name="camera-outline" size={22} color="#fff" />
              <Text style={styles.addPhotoButtonText}>Log a Photo</Text>
            </TouchableOpacity>
          )}
        </View>

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
      <PhotoViewerModal
        visible={photoViewerVisible}
        uri={dailyPhotoUri}
        onClose={() => {
          console.log('HomeScreen: photo viewer closed');
          setPhotoViewerVisible(false);
        }}
        onDelete={handlePhotoDelete}
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
  photoLogContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  photoLogTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  addPhotoButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  photoThumbnailWrapper: {
    alignItems: 'center',
  },
  photoThumbnail: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  photoTapHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
  },
  portionsContainer: {
    paddingHorizontal: 16,
  },
  loadingText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
});
