
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ActivityLevel, ACTIVITY_LEVELS, ACTIVITY_LEVEL_INFO } from '@/types';
import { loadProfile, saveProfile } from '@/utils/storage';
import { calculateRecommendedTargets } from '@/utils/portionCalculator';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  levelItem: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  levelItemSelected: {
    backgroundColor: colors.primaryLight,
  },
  levelTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  levelDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default function ActivityLevelScreen() {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<ActivityLevel>('moderate');

  useEffect(() => {
    loadCurrentLevel();
  }, []);

  const loadCurrentLevel = async () => {
    const profile = await loadProfile();
    if (profile) {
      setSelectedLevel(profile.activityLevel);
    }
  };

  const handleSelectLevel = async (level: ActivityLevel) => {
    const profile = await loadProfile();
    if (!profile) return;

    const newTargets = calculateRecommendedTargets(
      profile.sex,
      profile.currentWeight,
      profile.goal,
      profile.includeAlcohol,
      profile.alcoholServings,
      level
    );

    const updatedProfile = {
      ...profile,
      activityLevel: level,
      targets: newTargets,
    };

    await saveProfile(updatedProfile);
    Alert.alert('Success', 'Activity level updated and portion targets recalculated.');
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activity Level</Text>
      </View>

      <ScrollView>
        {ACTIVITY_LEVELS.map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.levelItem,
              selectedLevel === level && styles.levelItemSelected,
            ]}
            onPress={() => handleSelectLevel(level)}
          >
            <Text style={styles.levelTitle}>{ACTIVITY_LEVEL_INFO[level].label}</Text>
            <Text style={styles.levelDescription}>{ACTIVITY_LEVEL_INFO[level].description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
