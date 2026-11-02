import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ActivityLevel, ACTIVITY_LEVELS } from '@/types';
import { loadProfile, saveProfile } from '@/utils/storage';
import { calculateRecommendedTargets, foodTargetsEqual } from '@/utils/portionCalculator';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { loadWeightUnit } from '@/utils/weightUnit';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const [selectedLevel, setSelectedLevel] = useState<ActivityLevel>('moderate');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCurrentLevel();
  }, []);

  const loadCurrentLevel = async () => {
    try {
      const profile = await loadProfile();
      if (profile?.activityLevel) {
        setSelectedLevel(profile.activityLevel);
      }
    } catch (error) {
      console.error('Error loading activity level:', error);
      Alert.alert(t('common.error'), t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLevel = async (level: ActivityLevel) => {
    try {
      const profile = await loadProfile();
      if (!profile) {
        Alert.alert(t('common.error'), t('profile.noProfileFound'));
        return;
      }

      const weightUnit = await loadWeightUnit();
      const alcoholServings = profile.alcoholServings ?? profile.portionTargets?.alcohol ?? 0;
      const proposed = calculateRecommendedTargets(
        profile.sex,
        profile.currentWeight,
        profile.goal,
        level,
        { weightUnit, alcoholServings }
      );
      proposed.exercise = 0;
      proposed.alcohol = alcoholServings;

      const apply = async (useProposed: boolean) => {
        const updatedProfile = {
          ...profile,
          activityLevel: level,
          portionTargets: useProposed
            ? proposed
            : {
                ...profile.portionTargets,
                alcohol: alcoholServings,
                exercise: 0,
              },
        };
        await saveProfile(updatedProfile);
        setSelectedLevel(level);
        router.back();
      };

      if (
        level !== profile.activityLevel &&
        profile.portionTargets &&
        !foodTargetsEqual(proposed, profile.portionTargets)
      ) {
        Alert.alert(t('setupTargets.recalcTitle'), t('setupTargets.recalcMessage'), [
          {
            text: t('setupTargets.recalcKeep'),
            style: 'cancel',
            onPress: () => apply(false),
          },
          {
            text: t('setupTargets.recalcAccept'),
            onPress: () => apply(true),
          },
        ]);
        return;
      }

      await apply(true);
    } catch (error) {
      console.error('Error updating activity level:', error);
      Alert.alert(t('common.error'), t('common.error'));
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text }}>{t('common.loading')}</Text>
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
            key={level.value}
            style={[
              styles.levelItem,
              selectedLevel === level.value && styles.levelItemSelected,
            ]}
            onPress={() => handleSelectLevel(level.value)}
          >
            <View style={styles.levelContent}>
              <Text style={styles.levelTitle}>{level.label}</Text>
              <Text style={styles.levelDescription}>{level.description}</Text>
            </View>
            {selectedLevel === level.value && (
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
      </ScrollView>
    </View>
  );
}
