
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { loadProfile } from '@/utils/storage';
import { UserProfile } from '@/types';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const savedProfile = await loadProfile();
    setProfile(savedProfile);
  };

  const handleEditProfile = () => {
    if (!profile) return;
    
    router.push({
      pathname: '/setup-targets',
      params: {
        sex: profile.sex,
        weight: profile.currentWeight.toString(),
        goalWeight: profile.goalWeight?.toString() || profile.currentWeight.toString(),
        goal: profile.goal,
        activityLevel: profile.activityLevel || 'moderate',
        includeAlcohol: (profile.includeAlcohol || false).toString(),
        alcoholServings: (profile.alcoholServings || 0).toString(),
      },
    });
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.noProfileText}>No profile found</Text>
        </View>
      </SafeAreaView>
    );
  }

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Sex</Text>
            <Text style={styles.value}>{profile.sex === 'prefer-not-to-say' ? 'Prefer not to say' : profile.sex.charAt(0).toUpperCase() + profile.sex.slice(1)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Current Weight</Text>
            <Text style={styles.value}>{profile.currentWeight} lbs</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Goal Weight</Text>
            <Text style={styles.value}>{profile.goalWeight || profile.currentWeight} lbs</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Goal</Text>
            <Text style={styles.value}>{getGoalLabel(profile.goal)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Activity Level</Text>
            <Text style={styles.value}>{getActivityLabel(profile.activityLevel || 'moderate')}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Alcohol in Plan</Text>
            <Text style={styles.value}>{profile.includeAlcohol ? `Yes (${profile.alcoholServings} servings)` : 'No'}</Text>
          </View>
        </View>

        <View style={styles.targetsSection}>
          <Text style={styles.sectionTitle}>Daily Portion Targets</Text>
          <View style={styles.targetRow}>
            <Text style={styles.targetLabel}>🥩 Protein</Text>
            <Text style={styles.targetValue}>{profile.portionTargets.protein}</Text>
          </View>
          <View style={styles.targetRow}>
            <Text style={styles.targetLabel}>🥦 Veggies</Text>
            <Text style={styles.targetValue}>{profile.portionTargets.veggies}</Text>
          </View>
          <View style={styles.targetRow}>
            <Text style={styles.targetLabel}>🍎 Fruit</Text>
            <Text style={styles.targetValue}>{profile.portionTargets.fruit}</Text>
          </View>
          <View style={styles.targetRow}>
            <Text style={styles.targetLabel}>🌾 Whole Grains</Text>
            <Text style={styles.targetValue}>{profile.portionTargets.wholeGrains}</Text>
          </View>
          <View style={styles.targetRow}>
            <Text style={styles.targetLabel}>🥑 Fats</Text>
            <Text style={styles.targetValue}>{profile.portionTargets.fats}</Text>
          </View>
          <View style={styles.targetRow}>
            <Text style={styles.targetLabel}>🥜 Nuts & Seeds</Text>
            <Text style={styles.targetValue}>{profile.portionTargets.nutsSeeds}</Text>
          </View>
          <View style={styles.targetRow}>
            <Text style={styles.targetLabel}>💧 Water</Text>
            <Text style={styles.targetValue}>{profile.portionTargets.water}</Text>
          </View>
          {profile.includeAlcohol && (
            <View style={styles.targetRow}>
              <Text style={styles.targetLabel}>🍷 Alcohol</Text>
              <Text style={styles.targetValue}>{profile.portionTargets.alcohol}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={[buttonStyles.primary, styles.editButton]} onPress={handleEditProfile}>
          <Text style={buttonStyles.primaryText}>Edit Profile</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
  },
  section: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontWeight: '600',
    color: colors.text,
  },
  targetsSection: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  targetLabel: {
    fontSize: 16,
    color: colors.text,
  },
  targetValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  editButton: {
    marginTop: 10,
  },
  noProfileText: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
});
