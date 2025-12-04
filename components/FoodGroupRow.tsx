
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PortionSlot from './PortionSlot';
import { FoodGroup } from '../types';
import { colors } from '../styles/commonStyles';

interface FoodGroupRowProps {
  icon: string;
  label: string;
  foodGroup: FoodGroup;
  target: number;
  completed: number;
  onToggle: (index: number) => void;
}

export default function FoodGroupRow({
  icon,
  label,
  target,
  completed,
  onToggle,
}: FoodGroupRowProps) {
  // Calculate how many extra slots to show beyond target
  const extraSlots = 3; // Always show 3 extra slots beyond target
  const totalSlots = target + extraSlots;
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.count}>
          {completed}/{target}
        </Text>
      </View>
      <View style={styles.slots}>
        {Array.from({ length: totalSlots }).map((_, index) => (
          <PortionSlot
            key={index}
            completed={index < completed}
            isExtra={index >= target}
            onPress={() => onToggle(index)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  count: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  slots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
});
