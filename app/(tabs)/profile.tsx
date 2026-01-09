
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useRouter, useFocusEffect } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { loadProfile } from '@/utils/storage';
import { UserProfile } from '@/types';
import React, { useState } from 'react';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const router = useRouter();

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const userProfile = await loadProfile();
    setProfile(userProfile);
  };

  const handleEditProfile = () => {
    router.push('/setup-profile');
  };

  const getGoalLabel = (goal: string) => {
    switch (goal) {
      case 'lose': return 'Lose Weight';
      case 'maintain': return 'Maintain Weight';
      case 'build': return 'Build Muscle';
      default: return goal;
    }
  };

  const getActivityLabel = (level: string) => {
    switch (level) {
      case 'sedentary': return 'Sedentary';
      case 'light': return 'Light';
      case 'moderate': return 'Moderate';
      case 'active': return 'Active';
      case 'veryActive': return 'Very Active';
      default: return level;
    }
  };

  if (!profile) {
    return (
      <SafeAreaView style={commonStyles.container} edges={['top']}>
        <View style={[commonStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={commonStyles.title}>No Profile Found</Text>
          <TouchableOpacity style={[buttonStyles.primaryButton, { marginTop: 20 }]} onPress={handleEditProfile}>
            <Text style={buttonStyles.primaryButtonText}>Set Up My Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={commonStyles.title}>My Profile</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Sex</Text>
            <Text style={styles.value}>{profile.sex === 'female' ? 'Female' : profile.sex === 'male' ? 'Male' : 'Prefer not to say'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Current Weight</Text>
            <Text style={styles.value}>{profile.currentWeight} lbs</Text>
          </View>

          {profile.goalWeight && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Goal Weight</Text>
              <Text style={styles.value}>{profile.goalWeight} lbs</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.label}>Goal</Text>
            <Text style={styles.value}>{getGoalLabel(profile.goal)}</Text>
          </View>

          {profile.activityLevel && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Activity Level</Text>
              <Text style={styles.value}>{getActivityLabel(profile.activityLevel)}</Text>
            </View>
          )}

          {profile.includeAlcohol && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Alcohol Goal</Text>
              <Text style={styles.value}>{profile.alcoholServings} servings/day</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Portion Targets</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>🥩 Protein</Text>
            <Text style={styles.value}>{profile.portionTargets.protein}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>🥦 Vegetables</Text>
            <Text style={styles.value}>{profile.portionTargets.veggies}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>🍎 Fruit</Text>
            <Text style={styles.value}>{profile.portionTargets.fruit}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>🌾 Whole Grains</Text>
            <Text style={styles.value}>{profile.portionTargets.wholeGrains}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>🥑 Fats</Text>
            <Text style={styles.value}>{profile.portionTargets.fats}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>🥜 Nuts & Seeds</Text>
            <Text style={styles.value}>{profile.portionTargets.nutsSeeds}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>💧 Water</Text>
            <Text style={styles.value}>{profile.portionTargets.water}</Text>
          </View>

          {profile.includeAlcohol && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>🍷 Alcohol</Text>
              <Text style={styles.value}>{profile.portionTargets.alcohol}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={buttonStyles.primaryButton} onPress={handleEditProfile}>
          <Text style={buttonStyles.primaryButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginTop: 24,
    marginBottom: 24,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
});
