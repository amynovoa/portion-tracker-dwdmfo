
import React from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import { colors } from '../styles/commonStyles';

interface PortionSlotProps {
  completed: boolean;
  isExtra?: boolean;
  onPress: () => void;
  slotIndex?: number;
  target?: number;
  foodGroup?: string;
}

export default function PortionSlot({ 
  completed, 
  isExtra = false, 
  onPress,
  slotIndex = 0,
  target = 0,
  foodGroup = '',
}: PortionSlotProps) {
  
  // Determine the color based on position relative to target
  const getSlotColor = () => {
    if (!completed) {
      return null; // Empty slot
    }
    
    console.log(`PortionSlot: foodGroup=${foodGroup}, slotIndex=${slotIndex}, target=${target}, completed=${completed}`);
    
    // For vegetables, water, and exercise, always show green when completed
    if (foodGroup === 'veggies' || foodGroup === 'water' || foodGroup === 'exercise') {
      console.log(`PortionSlot: ${foodGroup} - returning green`);
      return '#4CAF50'; // Always green
    }
    
    if (slotIndex < target) {
      // On track - Green
      console.log(`PortionSlot: ${foodGroup} - on track (green)`);
      return '#4CAF50';
    } else if (slotIndex === target) {
      // Going over by 1 - Yellow
      console.log(`PortionSlot: ${foodGroup} - going over (yellow)`);
      return '#FFC107';
    } else {
      // Past the target - Red
      console.log(`PortionSlot: ${foodGroup} - past target (red)`);
      return '#F44336';
    }
  };

  const slotColor = getSlotColor();

  return (
    <TouchableOpacity
      style={[
        styles.slot,
        isExtra && !completed && styles.slotExtra,
        completed && slotColor && { backgroundColor: slotColor, borderColor: slotColor },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.checkmark,
        completed && styles.checkmarkCompleted,
      ]}>
        {completed ? '✓' : ''}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  slot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    marginVertical: 4,
  },
  slotExtra: {
    borderStyle: 'dashed',
    borderColor: colors.textSecondary,
    opacity: 0.6,
  },
  checkmark: {
    fontSize: 20,
    color: 'transparent',
    fontWeight: '700',
  },
  checkmarkCompleted: {
    color: '#FFFFFF',
  },
});
