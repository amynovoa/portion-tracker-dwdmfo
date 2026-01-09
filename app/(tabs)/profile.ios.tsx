
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadProfile, saveProfile } from '@/utils/storage';
import { UserProfile } from '@/types';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const router = useRouter();

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const loadedProfile = await loadProfile();
    setProfile(loadedProfile);
  };

  const handleEditProfile = () => {
    router.push('/setup-profile');
  };

  const handleEditTargets = () => {
    router.push('/setup-targets');
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Profile & Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Profile</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Sex:</Text>
            <Text style={styles.value}>{profile.sex}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Current Weight:</Text>
            <Text style={styles.value}>{profile.currentWeight} lbs</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Goal Weight:</Text>
            <Text style={styles.value}>{profile.goalWeight} lbs</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Goal:</Text>
            <Text style={styles.value}>{profile.goal}</Text>
          </View>
          <TouchableOpacity style={buttonStyles.primary} onPress={handleEditProfile}>
            <Text style={buttonStyles.primaryText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Targets</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>🍗 Protein:</Text>
            <Text style={styles.value}>{profile.targets.protein}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>🥦 Veggies:</Text>
            <Text style={styles.value}>{profile.targets.veggies}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>🍎 Fruit:</Text>
            <Text style={styles.value}>{profile.targets.fruits}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>🌾 Whole Grains:</Text>
            <Text style={styles.value}>{profile.targets.wholeGrains}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>🫘 Legumes:</Text>
            <Text style={styles.value}>{profile.targets.legumes}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>🥜 Nuts & Seeds:</Text>
            <Text style={styles.value}>{profile.targets.nutsSeeds}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>🥑 Fats:</Text>
            <Text style={styles.value}>{profile.targets.fats}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>💧 Water:</Text>
            <Text style={styles.value}>{profile.targets.water}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>🍷 Alcohol:</Text>
            <Text style={styles.value}>{profile.targets.alcohol}</Text>
          </View>
          <TouchableOpacity style={buttonStyles.primary} onPress={handleEditTargets}>
            <Text style={buttonStyles.primaryText}>Edit Targets</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
  },
  section: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: 16,
    color: colors.secondaryText,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
