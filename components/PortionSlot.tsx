
import React from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import { colors } from '../styles/commonStyles';

interface PortionSlotProps {
  completed: boolean;
  onPress: () => void;
}

export default function PortionSlot({ completed, onPress }: PortionSlotProps) {
  return (
    <TouchableOpacity
      style={[styles.slot, completed && styles.slotCompleted]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.checkmark}>{completed ? '✓' : ''}</Text>
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
  },
  slotCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    fontSize: 20,
    color: colors.card,
    fontWeight: '700',
  },
});
