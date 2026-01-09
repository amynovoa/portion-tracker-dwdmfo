
import { saveProfile, loadProfile } from '@/utils/storage';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useRouter, useLocalSearchParams } from 'expo-router';
import PortionDropdown from '@/components/PortionDropdown';
import React, { useState, useEffect } from 'react';
import { PortionTargets, Sex, Goal, ActivityLevel, UserProfile, FOOD_GROUPS } from '@/types';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  portionsHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  customizeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  hintText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  dropdownsContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
});

function SetupTargetsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [targets, setTargets] = useState<PortionTargets>({
    protein: 0,
    veggies: 0,
    fruit: 0,
    wholeGrains: 0,
    nutsSeeds: 0,
    fats: 0,
    water: 0,
    alcohol: 0,
  });

  const [profileData, setProfileData] = useState<{
    sex: Sex;
    currentWeight: number;
    goalWeight?: number;
    goal: Goal;
    includeAlcohol: boolean;
    alcoholServings: number;
    activityLevel: ActivityLevel;
  } | null>(null);

  useEffect(() => {
    // Load targets from params
    if (params.targets) {
      try {
        const parsedTargets = JSON.parse(params.targets as string);
        setTargets(parsedTargets);
      } catch (error) {
        console.log('Error parsing targets:', error);
      }
    }

    // Load profile data from params
    if (params.sex && params.currentWeight && params.goal) {
      setProfileData({
        sex: params.sex as Sex,
        currentWeight: Number(params.currentWeight),
        goalWeight: params.goalWeight ? Number(params.goalWeight) : undefined,
        goal: params.goal as Goal,
        includeAlcohol: params.includeAlcohol === 'true',
        alcoholServings: params.alcoholServings ? Number(params.alcoholServings) : 0,
        activityLevel: (params.activityLevel as ActivityLevel) || 'moderate',
      });
    }
  }, [params]);

  const handleUpdateTargets = (key: keyof PortionTargets, value: number) => {
    setTargets(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveTargets = async () => {
    if (!profileData) {
      Alert.alert('Error', 'Profile data is missing');
      return;
    }

    try {
      const profile: UserProfile = {
        sex: profileData.sex,
        currentWeight: profileData.currentWeight,
        goalWeight: profileData.goalWeight,
        goal: profileData.goal,
        includeAlcohol: profileData.includeAlcohol,
        alcoholServings: profileData.alcoholServings,
        activityLevel: profileData.activityLevel,
        portionTargets: targets,
      };

      await saveProfile(profile);
      
      // Navigate to home with reload param
      if (Platform.OS === 'ios') {
        router.replace('/(tabs)/(home)/?reload=true');
      } else {
        router.replace('/(tabs)/(home)/');
      }
    } catch (error) {
      console.log('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  // Filter out alcohol if not included
  const visibleFoodGroups = FOOD_GROUPS.filter(group => {
    if (group.key === 'alcohol' && profileData && !profileData.includeAlcohol) {
      return false;
    }
    return true;
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Review & Customize Targets</Text>
        <Text style={styles.subtitle}>
          These are your recommended daily portion targets. You can adjust them to fit your needs.
        </Text>

        <Text style={styles.portionsHeader}>Portions</Text>
        <View style={styles.customizeHint}>
          <IconSymbol 
            ios_icon_name="pencil" 
            android_material_icon_name="edit" 
            size={16} 
            color={colors.textSecondary} 
          />
          <Text style={styles.hintText}>You can customize these</Text>
        </View>

        <View style={styles.dropdownsContainer}>
          {visibleFoodGroups.map((group, index) => (
            <PortionDropdown
              key={group.key}
              label={`${group.icon} ${group.label}`}
              value={targets[group.key]}
              onValueChange={(value) => handleUpdateTargets(group.key, value)}
              maxValue={group.key === 'water' ? 15 : 10}
            />
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[buttonStyles.primary, commonStyles.button]}
            onPress={handleSaveTargets}
          >
            <Text style={buttonStyles.primaryText}>Save Profile & Targets</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

export default SetupTargetsScreen;
