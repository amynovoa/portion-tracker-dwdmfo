
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { PortionTargets } from '@/types';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AppLogo from '@/components/AppLogo';

export default function SetupTargetsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Initialize with default values or passed values
  const [targets, setTargets] = useState<PortionTargets>({
    protein: 3,
    veggies: 4,
    fruit: 2,
    wholeGrains: 2,
    legumes: 2,
    nutsSeeds: 2,
    fats: 2,
    dairy: 2,
    water: 8,
    alcohol: 0,
  });

  useEffect(() => {
    // If targets were passed as params, parse and use them
    if (params.targets) {
      try {
        const parsedTargets = JSON.parse(params.targets as string);
        setTargets(parsedTargets);
      } catch (error) {
        console.error('Error parsing targets:', error);
      }
    }
  }, [params.targets]);

  const handleUpdateTargets = (key: keyof PortionTargets, value: string) => {
    const numValue = parseInt(value) || 0;
    setTargets({
      ...targets,
      [key]: Math.max(0, numValue),
    });
  };

  const handleSaveTargets = () => {
    // Validate that at least some targets are set
    const hasTargets = Object.values(targets).some(val => val > 0);
    
    if (!hasTargets) {
      Alert.alert('Invalid Targets', 'Please set at least one portion target greater than 0.');
      return;
    }

    // Navigate back to profile with the targets
    router.back();
    // Pass the targets back via router state
    if (router.canGoBack()) {
      // Use a timeout to ensure navigation completes before passing data
      setTimeout(() => {
        router.setParams({ customTargets: JSON.stringify(targets) });
      }, 100);
    }
  };

  const foodGroupLabels: { key: keyof PortionTargets; label: string; icon: string }[] = [
    { key: 'protein', label: 'Protein', icon: '🥩' },
    { key: 'veggies', label: 'Veggies', icon: '🥦' },
    { key: 'fruit', label: 'Fruit', icon: '🍎' },
    { key: 'wholeGrains', label: 'Whole Grains', icon: '🌾' },
    { key: 'legumes', label: 'Legumes', icon: '🫘' },
    { key: 'nutsSeeds', label: 'Nuts & Seeds', icon: '🥜' },
    { key: 'fats', label: 'Fats', icon: '🥑' },
    { key: 'dairy', label: 'Dairy', icon: '🥛' },
    { key: 'water', label: 'Water', icon: '💧' },
    { key: 'alcohol', label: 'Alcohol', icon: '🍷' },
  ];

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <AppLogo size={60} />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Set Your Portion Targets</Text>
          <Text style={styles.subtitle}>Customize your daily goals for each food group</Text>
        </View>

        <View style={styles.targetsSection}>
          {foodGroupLabels.map((group) => (
            <View key={group.key} style={styles.targetRow}>
              <View style={styles.targetLabelContainer}>
                <Text style={styles.targetIcon}>{group.icon}</Text>
                <Text style={styles.targetLabel}>{group.label}</Text>
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.targetInput}
                  value={targets[group.key].toString()}
                  onChangeText={(text) => handleUpdateTargets(group.key, text)}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={styles.portionsText}>portions</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Tip: Start with moderate targets and adjust as you track your progress. You can always update these later in your profile.
          </Text>
        </View>

        <TouchableOpacity style={[buttonStyles.primary, styles.button]} onPress={handleSaveTargets}>
          <Text style={commonStyles.buttonText}>Save Targets</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[buttonStyles.outline, styles.button]}
          onPress={() => router.back()}
        >
          <Text style={commonStyles.buttonTextOutline}>Cancel</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 48,
    paddingBottom: 120,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  targetsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  targetLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  targetIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  targetLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  targetInput: {
    width: 60,
    height: 44,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    backgroundColor: colors.card,
  },
  portionsText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoBox: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: colors.highlight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  button: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  bottomPadding: {
    height: 20,
  },
});
