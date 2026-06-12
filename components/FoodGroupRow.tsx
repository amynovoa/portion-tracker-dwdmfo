
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
import { colors } from '@/styles/commonStyles';
import FoodGroupInfoModal from './FoodGroupInfoModal';
import { getFoodGroupInfo } from '@/constants/foodGroupInfo';
import { FoodGroup } from '@/types';
import { FOOD_GROUP_COLORS } from './DailyPlateProgress';
import { useTranslation } from 'react-i18next';

interface FoodGroupRowProps {
  foodGroup: FoodGroup;
  label: string;
  icon: string | number;
  completed: number;
  target: number;
  onTogglePortion: (increment: boolean) => void;
  hideCount?: boolean;
  showInfoHint?: boolean;
  isFirstRow?: boolean;
}

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
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
  const { t } = useTranslation();
  const info = getFoodGroupInfo(t)[foodGroup];

  // Get the color indicator for this food group (only for plate food groups)
  const categoryColor = FOOD_GROUP_COLORS[foodGroup];

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

  // Calculate slot size based on target
  const getSlotSize = () => {
    if (target <= 2) return 40;
    if (target <= 4) return 36;
    if (target <= 6) return 32;
    if (target <= 8) return 28;
    return 24;
  };

  const slotSize = getSlotSize();

  // For exercise, always show only 1 circle
  const maxSlots = foodGroup === 'exercise' ? 1 : Math.max(target, completed + 3);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelContainer}>
          {typeof icon === 'number' ? (
            <Image source={resolveImageSource(icon)} style={styles.iconImage} resizeMode="contain" />
          ) : (
            <Text style={styles.icon}>{icon}</Text>
          )}
          {/* Add small color indicator next to label for plate food groups */}
          {categoryColor && (
            <View style={[styles.colorIndicator, { backgroundColor: categoryColor }]} />
          )}
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
              onPress={() => {
                console.log('FoodGroupRow: info button pressed for', foodGroup);
                setModalVisible(true);
              }}
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
              onPress={() => {
                const increment = index >= completed;
                console.log('FoodGroupRow: slot pressed for', foodGroup, increment ? 'increment' : 'decrement');
                onTogglePortion(increment);
              }}
              style={[
                styles.slot,
                {
                  width: slotSize,
                  height: slotSize,
                  borderRadius: slotSize / 2,
                },
                isFilled && { backgroundColor: slotColor, borderColor: slotColor },
              ]}
            />
          );
        })}
      </View>

      {info && (
        <FoodGroupInfoModal
          visible={modalVisible}
          onClose={() => {
            console.log('FoodGroupRow: info modal closed for', foodGroup);
            setModalVisible(false);
          }}
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
  iconImage: {
    width: 28,
    height: 28,
    marginRight: 8,
  },
  colorIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
    fontSize: 16,
    fontWeight: '600',
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
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
});
