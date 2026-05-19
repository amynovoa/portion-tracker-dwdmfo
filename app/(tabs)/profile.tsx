
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, buttonStyles } from '@/styles/commonStyles';
import { useRouter, useFocusEffect } from 'expo-router';
import { loadProfile } from '@/utils/storage';
import { UserProfile, Sex, Goal } from '@/types';
import AppLogo from '@/components/AppLogo';
import { useTranslation } from 'react-i18next';

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadProfileData();
    }, [])
  );

  const loadProfileData = async () => {
    try {
      const data = await loadProfile();
      console.log('Profile loaded:', data);
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    console.log('Edit Profile button pressed');
    router.push('/setup-profile');
  };

  const handleEditTargets = () => {
    console.log('Edit Targets button pressed');
    router.push('/setup-targets');
  };

  const getSexLabel = (sex: Sex) => {
    switch (sex) {
      case 'male':
        return t('profile.sexMale');
      case 'female':
        return t('profile.sexFemale');
      case 'prefer-not-to-say':
        return t('profile.sexPreferNot');
      default:
        return t('profile.sexNotSet');
    }
  };

  const getGoalLabel = (goal: Goal) => {
    switch (goal) {
      case 'lose':
        return t('profile.goalLose');
      case 'maintain':
        return t('profile.goalMaintain');
      case 'build':
        return t('profile.goalBuild');
      case 'eat-healthier':
        return t('profile.goalEatHealthier');
      case 'have-more-energy':
        return t('profile.goalMoreEnergy');
      default:
        return t('profile.goalNotSet');
    }
  };

  if (loading) {
    const loadingText = t('profile.loadingProfile');
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{loadingText}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    const noProfileText = t('profile.noProfileFound');
    const createProfileText = t('profile.createProfile');
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.emptyContainer}>
          <AppLogo size={80} />
          <Text style={styles.emptyText}>{noProfileText}</Text>
          <TouchableOpacity style={buttonStyles.primary} onPress={handleEditProfile}>
            <Text style={buttonStyles.primaryText}>{createProfileText}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const headerText = t('profile.title');
  const personalInfoText = t('profile.personalInformation');
  const sexLabel = t('profile.sex');
  const sexValue = getSexLabel(profile.sex);
  const startingWeightLabel = t('profile.startingWeight');
  const startingWeightValue = profile.currentWeight + ' ' + t('common.lbs');
  const goalWeightLabel = t('profile.goalWeight');
  const goalWeightValue = profile.goalWeight + ' ' + t('common.lbs');
  const goalLabel = t('profile.goal');
  const goalValue = getGoalLabel(profile.goal);
  const editProfileText = t('profile.editProfile');
  const dailyTargetsText = t('profile.dailyPortionTargets');
  const proteinLabel = t('profile.protein');
  const veggiesLabel = t('profile.veggies');
  const fruitsLabel = t('profile.fruits');
  const wholeGrainsLabel = t('profile.wholeGrains');
  const nutsSeedsLabel = t('profile.nutsSeeds');
  const fatsLabel = t('profile.fats');
  const waterLabel = t('profile.water');
  const alcoholLabel = t('profile.alcohol');
  const portionsUnit = t('common.portions');
  const glassesUnit = t('common.glasses');
  const servingsUnit = t('common.servings');
  const editTargetsText = t('profile.editTargets');
  const exerciseNoteText = t('profile.exerciseNote');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          Platform.OS !== 'ios' && styles.contentContainerWithTabBar
        ]}
      >
        <View style={styles.logoContainer}>
          <AppLogo size={60} />
        </View>

        <Text style={styles.header}>{headerText}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{personalInfoText}</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{sexLabel}</Text>
            <Text style={styles.infoValue}>{sexValue}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{startingWeightLabel}</Text>
            <Text style={styles.infoValue}>{startingWeightValue}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{goalWeightLabel}</Text>
            <Text style={styles.infoValue}>{goalWeightValue}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{goalLabel}</Text>
            <Text style={styles.infoValue}>{goalValue}</Text>
          </View>

          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Text style={styles.editButtonText}>{editProfileText}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{dailyTargetsText}</Text>
          
          {profile.portionTargets && (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{proteinLabel}</Text>
                <Text style={styles.infoValue}>{profile.portionTargets.protein} {portionsUnit}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{veggiesLabel}</Text>
                <Text style={styles.infoValue}>{profile.portionTargets.veggies} {portionsUnit}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{fruitsLabel}</Text>
                <Text style={styles.infoValue}>{profile.portionTargets.fruits} {portionsUnit}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{wholeGrainsLabel}</Text>
                <Text style={styles.infoValue}>{profile.portionTargets.wholeGrains} {portionsUnit}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{nutsSeedsLabel}</Text>
                <Text style={styles.infoValue}>{profile.portionTargets.nutsSeeds} {portionsUnit}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{fatsLabel}</Text>
                <Text style={styles.infoValue}>{profile.portionTargets.fats} {portionsUnit}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{waterLabel}</Text>
                <Text style={styles.infoValue}>{profile.portionTargets.water} {glassesUnit}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{alcoholLabel}</Text>
                <Text style={styles.infoValue}>
                  {profile.portionTargets.alcohol || 0} {servingsUnit}
                </Text>
              </View>
            </>
          )}

          <TouchableOpacity style={styles.editButton} onPress={handleEditTargets}>
            <Text style={styles.editButtonText}>{editTargetsText}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.noteSection}>
          <Text style={styles.noteIcon}>💪</Text>
          <Text style={styles.noteText}>{exerciseNoteText}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  contentContainerWithTabBar: {
    paddingBottom: 100,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 16,
    color: colors.text,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  editButton: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noteSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  noteIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 24,
  },
});
