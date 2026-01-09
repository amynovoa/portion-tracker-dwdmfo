import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/styles/commonStyles';

interface PortionSlotProps {
  filled: boolean;
  onPress: () => void;
}

export default function PortionSlot({ filled, onPress }: PortionSlotProps) {
  return (
    <TouchableOpacity
      style={[styles.slot, filled && styles.slotFilled]}
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  slot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  slotFilled: {
    backgroundColor: colors.primary,
  },
});
