
import React from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import { colors } from '../styles/commonStyles';

interface PortionSlotProps {
  completed: boolean;
  isExtra?: boolean;
  onPress: () => void;
}

export default function PortionSlot({ completed, isExtra = false, onPress }: PortionSlotProps) {
  return (
    <TouchableOpacity
      style={[
        styles.slot,
        isExtra && styles.slotExtra,
        completed && !isExtra && styles.slotCompleted,
        completed && isExtra && styles.slotExtraCompleted,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.checkmark,
        completed && !isExtra && styles.checkmarkCompleted,
        completed && isExtra && styles.checkmarkExtra,
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
  slotCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotExtraCompleted: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
    opacity: 1,
  },
  checkmark: {
    fontSize: 20,
    color: 'transparent',
    fontWeight: '700',
  },
  checkmarkCompleted: {
    color: colors.card,
  },
  checkmarkExtra: {
    color: colors.text,
  },
});
