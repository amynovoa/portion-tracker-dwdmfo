
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { FoodGroup, FOOD_GROUPS } from '@/types';
import { FOOD_GROUP_INFO } from '@/constants/foodGroupInfo';
import FoodGroupInfoModal from './FoodGroupInfoModal';
import PortionSlot from './PortionSlot';

interface FoodGroupRowProps {
  foodGroup: FoodGroup;
  label: string;
  icon: string;
  completed: number;
  target: number;
  onTogglePortion: (increment: boolean) => void;
  hideCount?: boolean;
  showInfoHint?: boolean;
  isFirstRow?: boolean;
}

export default function FoodGroupRow({ 
  foodGroup, 
  label, 
  icon, 
  completed, 
  target, 
  onTogglePortion, 
  hideCount 
}: FoodGroupRowProps) {
  const [showInfo, setShowInfo] = useState(false);
  const info = FOOD_GROUP_INFO[foodGroup];

  return (
    <>
      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <Text style={styles.icon}>{icon}</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
        
        <View style={styles.portionsContainer}>
          {Array.from({ length: target }).map((_, index) => (
            <PortionSlot
              key={index}
              filled={index < completed}
              onPress={() => onTogglePortion(index >= completed)}
            />
          ))}
        </View>

        <View style={styles.countInfoContainer}>
          <Text style={[styles.count, hideCount && styles.hiddenCount]}>
            {completed}/{target}
          </Text>
          <TouchableOpacity onPress={() => setShowInfo(true)} style={styles.infoButton}>
            <Text style={styles.infoIcon}>ℹ️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FoodGroupInfoModal
        visible={showInfo}
        onClose={() => setShowInfo(false)}
        title={label}
        icon={icon}
        benefit={info.benefit}
        avoid={info.avoid}
        examples={info.examples}
        portionSize={info.portionSize}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 140,
  },
  icon: {
    fontSize: 24,
    marginRight: 8,
  },
  label: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  portionsContainer: {
    flexDirection: 'row',
    flex: 1,
    flexWrap: 'wrap',
    gap: 8,
  },
  countInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  count: {
    fontSize: 14,
    color: colors.textSecondary,
    width: 40,
    textAlign: 'right',
  },
  hiddenCount: {
    opacity: 0,
  },
  infoButton: {
    marginLeft: 8,
    padding: 4,
  },
  infoIcon: {
    fontSize: 18,
  },
});
