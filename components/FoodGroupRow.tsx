
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import FoodGroupInfoModal from './FoodGroupInfoModal';
import PortionSlot from './PortionSlot';
import { FoodGroup } from '../types';
import { colors } from '../styles/commonStyles';
import { FOOD_GROUP_INFO } from '../constants/foodGroupInfo';

interface FoodGroupRowProps {
  icon: string;
  label: string;
  foodGroup: FoodGroup;
  target: number;
  completed: number;
  onTogglePortion: (increment: boolean) => void;
}

export default function FoodGroupRow({
  icon,
  label,
  foodGroup,
  target,
  completed,
  onTogglePortion,
}: FoodGroupRowProps) {
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  
  const foodGroupInfo = FOOD_GROUP_INFO[foodGroup];

  const handleInfoPress = () => {
    console.log(`Opening info modal for ${label}, foodGroup: ${foodGroup}`);
    console.log('Food group info:', foodGroupInfo);
    
    if (!foodGroupInfo) {
      console.error(`No info found for food group: ${foodGroup}`);
      return;
    }
    
    setInfoModalVisible(true);
  };

  const handleCloseModal = () => {
    console.log(`Closing info modal for ${label}`);
    setInfoModalVisible(false);
  };

  // Calculate how many slots to show
  // Show at least target slots, but if user has tracked more, show those too
  // Always show at least 2 extra slots beyond current completion
  const minSlots = Math.max(target, completed + 2);
  const totalSlots = minSlots;
  const slots = Array.from({ length: totalSlots }, (_, i) => i);

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.icon}>{icon}</Text>
          <Text style={styles.label}>{label}</Text>
          <TouchableOpacity 
            onPress={handleInfoPress}
            style={styles.infoButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.infoIcon}>ℹ️</Text>
          </TouchableOpacity>
          <Text style={styles.count}>
            {completed}/{target}
          </Text>
        </View>

        {/* Portion slots */}
        <View style={styles.slotsContainer}>
          {slots.map((index) => (
            <PortionSlot
              key={index}
              completed={index < completed}
              isExtra={index >= target}
              onPress={() => {
                // If clicking on a completed slot, decrement
                // If clicking on an empty slot, increment
                const shouldIncrement = index >= completed;
                onTogglePortion(shouldIncrement);
              }}
            />
          ))}
        </View>
      </View>

      {foodGroupInfo && (
        <FoodGroupInfoModal
          visible={infoModalVisible}
          onClose={handleCloseModal}
          title={label}
          icon={icon}
          benefit={foodGroupInfo.benefit || ''}
          avoid={foodGroupInfo.avoid || ''}
          examples={foodGroupInfo.examples || ''}
        />
      )}
    </>
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
  infoButton: {
    marginRight: 8,
    padding: 4,
  },
  infoIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
  count: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
