
import { saveProfile } from '@/utils/storage';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useRouter, useLocalSearchParams } from 'expo-router';
import PortionDropdown from '@/components/PortionDropdown';
import React, { useState, useEffect } from 'react';
import { PortionTargets, Sex, Goal, ActivityLevel, UserProfile } from '@/types';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'left',
  },
  portionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  portionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  portionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  portionsText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  calloutBox: {
    backgroundColor: '#FFE8E8',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  calloutText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  checkmark: {
    fontSize: 20,
    marginRight: 4,
  },
  saveButton: {
    ...buttonStyles.primary,
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  saveButtonText: {
    ...buttonStyles.primaryText,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default function SetupTargetsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  const [targets, setTargets] = useState<PortionTargets>({
    protein: 0,
    vegetables: 0,
    fruit: 0,
    wholeGrains: 0,
    fats: 0,
    nutsAndSeeds: 0,
    water: 0,
    alcohol: 0,
  });

  useEffect(() => {
    if (params.recommendedTargets) {
      try {
        const recommended = JSON.parse(params.recommendedTargets as string);
        setTargets(recommended);
      } catch (error) {
        console.error('Error parsing recommended targets:', error);
      }
    }
  }, [params]);

  const handleUpdateTargets = (key: keyof PortionTargets, value: number) => {
    setTargets(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveTargets = async () => {
    try {
      const profile: UserProfile = {
        sex: params.sex as Sex,
        currentWeight: parseFloat(params.currentWeight as string),
        goalWeight: parseFloat(params.goalWeight as string),
        goal: params.goal as Goal,
        activityLevel: params.activityLevel as ActivityLevel,
        includeAlcohol: params.includeAlcohol === 'true',
        alcoholServings: parseInt(params.alcoholServings as string) || 0,
        targets,
      };

      await saveProfile(profile);
      
      // Navigate to Track tab (home)
      router.replace('/(tabs)/(home)');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent}>
        <Text style={styles.header}>👍 You Can Customize These:</Text>
        
        <View style={styles.portionRow}>
          <Text style={styles.portionLabel}>Protein</Text>
          <View style={styles.portionRight}>
            <PortionDropdown
              value={targets.protein}
              onValueChange={(value) => handleUpdateTargets('protein', value)}
              maxValue={10}
            />
            <Text style={styles.portionsText}>portions</Text>
          </View>
        </View>

        <View style={styles.portionRow}>
          <Text style={styles.portionLabel}>Vegetables</Text>
          <View style={styles.portionRight}>
            <PortionDropdown
              value={targets.vegetables}
              onValueChange={(value) => handleUpdateTargets('vegetables', value)}
              maxValue={10}
            />
            <Text style={styles.portionsText}>portions</Text>
          </View>
        </View>

        <View style={styles.portionRow}>
          <Text style={styles.portionLabel}>Fruit</Text>
          <View style={styles.portionRight}>
            <PortionDropdown
              value={targets.fruit}
              onValueChange={(value) => handleUpdateTargets('fruit', value)}
              maxValue={10}
            />
            <Text style={styles.portionsText}>portions</Text>
          </View>
        </View>

        <View style={styles.portionRow}>
          <Text style={styles.portionLabel}>Healthy Carbs</Text>
          <View style={styles.portionRight}>
            <PortionDropdown
              value={targets.wholeGrains}
              onValueChange={(value) => handleUpdateTargets('wholeGrains', value)}
              maxValue={10}
            />
            <Text style={styles.portionsText}>portions</Text>
          </View>
        </View>

        <View style={styles.portionRow}>
          <Text style={styles.portionLabel}>Fats</Text>
          <View style={styles.portionRight}>
            <PortionDropdown
              value={targets.fats}
              onValueChange={(value) => handleUpdateTargets('fats', value)}
              maxValue={10}
            />
            <Text style={styles.portionsText}>portions</Text>
          </View>
        </View>

        <View style={styles.portionRow}>
          <Text style={styles.portionLabel}>Nuts</Text>
          <View style={styles.portionRight}>
            <PortionDropdown
              value={targets.nutsAndSeeds}
              onValueChange={(value) => handleUpdateTargets('nutsAndSeeds', value)}
              maxValue={10}
            />
            <Text style={styles.portionsText}>portions</Text>
          </View>
        </View>

        <View style={styles.portionRow}>
          <Text style={styles.portionLabel}>Water</Text>
          <View style={styles.portionRight}>
            <PortionDropdown
              value={targets.water}
              onValueChange={(value) => handleUpdateTargets('water', value)}
              maxValue={15}
            />
            <Text style={styles.portionsText}>portions</Text>
          </View>
        </View>

        {targets.alcohol > 0 && (
          <View style={styles.portionRow}>
            <Text style={styles.portionLabel}>Alcohol</Text>
            <View style={styles.portionRight}>
              <PortionDropdown
                value={targets.alcohol}
                onValueChange={(value) => handleUpdateTargets('alcohol', value)}
                maxValue={5}
              />
              <Text style={styles.portionsText}>portions</Text>
            </View>
          </View>
        )}

        <View style={styles.calloutBox}>
          <Text style={styles.calloutText}>
            <Text style={styles.checkmark}>✅</Text> Happy with your targets? Save your profile below to start tracking!
          </Text>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveTargets}>
        <Text style={styles.saveButtonText}>Save Profile & Go to Track</Text>
      </TouchableOpacity>
    </View>
  );
}
