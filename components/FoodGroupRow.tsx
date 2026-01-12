
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/styles/commonStyles';
import FoodGroupInfoModal from './FoodGroupInfoModal';
import { foodGroupInfo } from '@/constants/foodGroupInfo';
import { FoodGroup } from '@/types';

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
  hideCount = false,
  showInfoHint = false,
  isFirstRow = false,
}: FoodGroupRowProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const info = foodGroupInfo[foodGroup];

  const getSlotColor = (index: number, isFilled: boolean) => {
    // Only show color if the slot is filled
    if (!isFilled) {
      return 'transparent';
    }

    // Water, veggies, and exercise are always green (no yellow/red)
    if (foodGroup === 'water' || foodGroup === 'veggies' || foodGroup === 'exercise') {
      return '#4CAF50'; // Bright green
    }

    // For other food groups:
    if (index < target) {
      // Within target: green
      return '#4CAF50'; // Bright green
    } else if (index === target) {
      // One over target (the portion at index === target is the first one over): yellow
      return '#FFFF00'; // Yellow
    } else {
      // Two or more over target: red
      return '#FF4444'; // Bright red
    }
  };

  // For exercise, always show only 1 circle
  // For other food groups, show enough slots to accommodate completed portions, with extra slots for adding more
  const maxSlots = foodGroup === 'exercise' ? 1 : Math.max(target, completed + 3);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelContainer}>
          <Text style={styles.icon}>{icon}</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
        <View style={styles.rightContainer}>
          {!hideCount && (
            <Text style={styles.count}>
              {completed}/{target}
            </Text>
          )}
          {hideCount && <View style={styles.hiddenCount} />}
          {info && (
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={styles.infoButton}
            >
              <Text style={styles.infoIcon}>ℹ️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.slotsContainer}>
        {Array.from({ length: maxSlots }).map((_, index) => {
          const isFilled = index < completed;
          const slotColor = getSlotColor(index, isFilled);

          return (
            <TouchableOpacity
              key={index}
              onPress={() => onTogglePortion(index >= completed)}
              style={[
                styles.slot,
                isFilled && { backgroundColor: slotColor, borderColor: slotColor },
              ]}
            />
          );
        })}
      </View>

      {info && (
        <FoodGroupInfoModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          title={label}
          icon={icon}
          benefit={info.benefit}
          avoid={info.avoid}
          examples={info.examples}
          portionSize={info.portionSize}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 28,
    marginRight: 8,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  count: {
    fontSize: 16,
    color: colors.textSecondary,
    marginRight: 8,
  },
  hiddenCount: {
    width: 40,
    marginRight: 8,
  },
  infoButton: {
    padding: 4,
  },
  infoIcon: {
    fontSize: 20,
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
});
