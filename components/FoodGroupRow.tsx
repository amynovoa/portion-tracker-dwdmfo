
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
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
  showInfoHint?: boolean;
  isFirstRow?: boolean;
  hideCount?: boolean; // New prop to hide the count display
}

export default function FoodGroupRow({
  icon,
  label,
  foodGroup,
  target,
  completed,
  onTogglePortion,
  showInfoHint = false,
  isFirstRow = false,
  hideCount = false,
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
    
    console.log('Setting infoModalVisible to true');
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

  console.log(`FoodGroupRow ${label}: infoModalVisible = ${infoModalVisible}`);

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.icon}>{icon}</Text>
          <Text style={styles.label}>{label}</Text>
          <View style={styles.infoButtonContainer}>
            <TouchableOpacity 
              onPress={handleInfoPress}
              style={styles.infoButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.infoIcon}>ℹ️</Text>
            </TouchableOpacity>
          </View>
          {/* Hide count if hideCount is true, but keep the space for alignment */}
          <Text style={[styles.count, hideCount && { opacity: 0 }]}>
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
              slotIndex={index}
              target={target}
              foodGroup={foodGroup}
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
          portionSize={foodGroupInfo.portionSize || ''}
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 32,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
    lineHeight: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    lineHeight: 32,
  },
  infoButtonContainer: {
    marginRight: 8,
    height: 32,
    justifyContent: 'center',
  },
  infoButton: {
    padding: 4,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 18,
    opacity: 0.6,
    lineHeight: 18,
  },
  count: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 32,
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginLeft: -4,
  },
});
