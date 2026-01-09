
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { loadProfile } from '@/utils/storage';
import { UserProfile } from '@/types';
import { useRouter, useFocusEffect } from 'expo-router';
import AppLogo from '@/components/AppLogo';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const router = useRouter();

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    console.log('Loading profile data...');
    const loadedProfile = await loadProfile();
    console.log('Profile loaded:', loadedProfile);
    setProfile(loadedProfile);
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <Text style={styles.loadingText}>Loading profile...</Text>
          <TouchableOpacity
            style={[buttonStyles.primary, { marginTop: 20 }]}
            onPress={() => router.push('/setup-profile')}
          >
            <Text style={buttonStyles.primaryText}>Set Up Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <AppLogo size={60} />
          <Text style={styles.title}>My Profile</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Sex:</Text>
            <Text style={styles.value}>{profile.sex === 'prefer-not-to-say' ? 'Prefer not to say' : profile.sex.charAt(0).toUpperCase() + profile.sex.slice(1)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Current Weight:</Text>
            <Text style={styles.value}>{profile.currentWeight} lbs</Text>
          </View>
          {profile.goalWeight && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Goal Weight:</Text>
              <Text style={styles.value}>{profile.goalWeight} lbs</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Goal:</Text>
            <Text style={styles.value}>
              {profile.goal === 'lose' ? 'Lose Weight' : profile.goal === 'maintain' ? 'Maintain Weight' : 'Build Muscle'}
            </Text>
          </View>
          {profile.activityLevel && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Activity Level:</Text>
              <Text style={styles.value}>
                {profile.activityLevel.charAt(0).toUpperCase() + profile.activityLevel.slice(1).replace(/([A-Z])/g, ' $1')}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Portion Targets</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Protein:</Text>
            <Text style={styles.value}>{profile.portionTargets.protein}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Vegetables:</Text>
            <Text style={styles.value}>{profile.portionTargets.veggies}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Fruit:</Text>
            <Text style={styles.value}>{profile.portionTargets.fruits}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Whole Grains:</Text>
            <Text style={styles.value}>{profile.portionTargets.wholeGrains}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Dairy:</Text>
            <Text style={styles.value}>{profile.portionTargets.dairy}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Nuts & Seeds:</Text>
            <Text style={styles.value}>{profile.portionTargets.nutsSeeds}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Water:</Text>
            <Text style={styles.value}>{profile.portionTargets.water}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Exercise:</Text>
            <Text style={styles.value}>{profile.portionTargets.exercise}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[buttonStyles.primary, styles.editButton]}
          onPress={() => router.push('/setup-profile')}
        >
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
    paddingBottom: 140, // Extra padding for tab bar
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...commonStyles.shadow,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  editButton: {
    marginTop: 20,
    marginBottom: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
});
