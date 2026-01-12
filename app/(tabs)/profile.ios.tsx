
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useRouter, useFocusEffect } from 'expo-router';
import { loadProfile, saveProfile } from '@/utils/storage';
import { UserProfile, Sex, Goal } from '@/types';
import AppLogo from '@/components/AppLogo';

export default function ProfileScreen() {
  const router = useRouter();
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
    router.push('/setup-profile');
  };

  const handleEditTargets = () => {
    router.push('/setup-targets');
  };

  const getSexLabel = (sex: Sex) => {
    switch (sex) {
      case 'male':
        return 'Male';
      case 'female':
        return 'Female';
      case 'prefer-not-to-say':
        return 'Prefer not to say';
      default:
        return 'Not set';
    }
  };

  const getGoalLabel = (goal: Goal) => {
    switch (goal) {
      case 'lose':
        return 'Lose Weight';
      case 'maintain':
        return 'Maintain Weight';
      case 'build':
        return 'Build Muscle';
      default:
        return 'Not set';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.emptyContainer}>
          <AppLogo size={80} />
          <Text style={styles.emptyText}>No profile found</Text>
          <TouchableOpacity style={buttonStyles.primary} onPress={handleEditProfile}>
            <Text style={buttonStyles.primaryText}>Create Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.logoContainer}>
          <AppLogo size={60} />
        </View>

        <Text style={styles.header}>Profile</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Sex</Text>
            <Text style={styles.infoValue}>{getSexLabel(profile.sex)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Starting Weight</Text>
            <Text style={styles.infoValue}>{profile.currentWeight} lbs</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Goal Weight</Text>
            <Text style={styles.infoValue}>{profile.goalWeight} lbs</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Goal</Text>
            <Text style={styles.infoValue}>{getGoalLabel(profile.goal)}</Text>
          </View>

          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Portion Targets</Text>
          
          {profile.portionTargets && (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Protein</Text>
                <Text style={styles.infoValue}>{profile.portionTargets.protein} portions</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Veggies</Text>
                <Text style={styles.infoValue}>{profile.portionTargets.veggies} portions</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Fruits</Text>
                <Text style={styles.infoValue}>{profile.portionTargets.fruits} portions</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Whole Grains</Text>
                <Text style={styles.infoValue}>{profile.portionTargets.wholeGrains} portions</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nuts & Seeds</Text>
                <Text style={styles.infoValue}>{profile.portionTargets.nutsSeeds} portions</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Fats</Text>
                <Text style={styles.infoValue}>{profile.portionTargets.fats} portions</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Water</Text>
                <Text style={styles.infoValue}>{profile.portionTargets.water} glasses</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Alcohol</Text>
                <Text style={styles.infoValue}>
                  {profile.portionTargets.alcohol || 0} servings
                </Text>
              </View>
            </>
          )}

          <TouchableOpacity style={styles.editButton} onPress={handleEditTargets}>
            <Text style={styles.editButtonText}>Edit Targets</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.noteSection}>
          <Text style={styles.noteIcon}>💪</Text>
          <Text style={styles.noteText}>
            Exercise can be tracked daily by checking it off, but doesn&apos;t have a numeric target.
          </Text>
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
