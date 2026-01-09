
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

  const getSlotColor = (index: number) => {
    // Water and veggies are always green
    if (foodGroup === 'water' || foodGroup === 'veggies') {
      return colors.success;
    }

    if (index < target) {
      return colors.success; // Green for assigned portions
    } else if (index === target) {
      return '#FFA500'; // Yellow for one over
    } else {
      return '#FF4444'; // Red for two or more over
    }
  };

  // For exercise, show only 1 slot. For others, show at least target slots, or more if user has logged more
  const maxSlots = foodGroup === 'exercise' ? 1 : Math.max(target, completed, target + 2);

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
          const slotColor = getSlotColor(index);

          return (
            <TouchableOpacity
              key={index}
              onPress={() => onTogglePortion(index >= completed)}
              style={[
                styles.slot,
                isFilled && { backgroundColor: slotColor },
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
    fontSize: 24,
    marginRight: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  count: {
    fontSize: 14,
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
    fontSize: 18,
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
