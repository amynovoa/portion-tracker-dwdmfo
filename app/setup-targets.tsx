
import { saveProfile } from '@/utils/storage';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useRouter, useLocalSearchParams } from 'expo-router';
import PortionDropdown from '@/components/PortionDropdown';
import React, { useState, useEffect } from 'react';
import { PortionTargets, Sex, Goal, ActivityLevel, UserProfile } from '@/types';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';

const styles = StyleSheet.create({
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

  useEffect(() => {
    // Load targets from params
  }, [params]);

  const handleUpdateTargets = (key: keyof PortionTargets, value: number) => {
    setTargets(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveTargets = async () => {
    // Save logic
  };

  return (
    <ScrollView>
      <Text style={styles.portionsHeader}>Portions</Text>
      <View style={styles.customizeHint}>
        <IconSymbol ios_icon_name="pencil" android_material_icon_name="edit" size={16} color={colors.textSecondary} />
        <Text>You can customize these</Text>
      </View>
      {/* Dropdowns */}
    </ScrollView>
  );
}

export default SetupTargetsScreen;
