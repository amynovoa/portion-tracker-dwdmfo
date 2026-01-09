
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ActivityLevel, ACTIVITY_LEVELS, ACTIVITY_LEVEL_INFO } from '@/types';
import { loadProfile, saveProfile } from '@/utils/storage';
import { calculateRecommendedTargets } from '@/utils/portionCalculator';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    gap: 16,
  },
  levelItemSelected: {
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  levelContent: {
    flex: 1,
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
  checkIcon: {
    width: 24,
    height: 24,
  },
});

export default function ActivityLevelScreen() {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<ActivityLevel>('moderate');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCurrentLevel();
  }, []);

  const loadCurrentLevel = async () => {
    try {
      const profile = await loadProfile();
      if (profile) {
        setSelectedLevel(profile.activityLevel);
      }
    } catch (error) {
      console.error('Error loading activity level:', error);
      Alert.alert('Error', 'Failed to load current activity level');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLevel = async (level: ActivityLevel) => {
    try {
      const profile = await loadProfile();
      if (!profile) {
        Alert.alert('Error', 'Profile not found. Please complete setup first.');
        return;
      }

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
      setSelectedLevel(level);
      Alert.alert('Success', 'Activity level updated and portion targets recalculated.');
      router.back();
    } catch (error) {
      console.error('Error updating activity level:', error);
      Alert.alert('Error', 'Failed to update activity level. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text }}>Loading...</Text>
      </View>
    );
  }

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
            <View style={styles.levelContent}>
              <Text style={styles.levelTitle}>{ACTIVITY_LEVEL_INFO[level].label}</Text>
              <Text style={styles.levelDescription}>{ACTIVITY_LEVEL_INFO[level].description}</Text>
            </View>
            {selectedLevel === level && (
              <View style={styles.checkIcon}>
                <IconSymbol 
                  ios_icon_name="checkmark.circle.fill" 
                  android_material_icon_name="check-circle" 
                  size={24} 
                  color={colors.primary} 
                />
              </View>
            )}
          </TouchableOpacity>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}
