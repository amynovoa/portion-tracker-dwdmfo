
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import FoodGroupInfoModal from './FoodGroupInfoModal';
import ServingSizeModal from './ServingSizeModal';
import { FoodGroup, ServingEntry, ServingSize } from '../types';
import { colors } from '../styles/commonStyles';
import { FOOD_GROUP_INFO } from '../constants/foodGroupInfo';

interface FoodGroupRowProps {
  icon: string;
  label: string;
  foodGroup: FoodGroup;
  target: number;
  servings: ServingEntry[];
  waterCount?: number; // For water, which doesn't use S/M/L
  onAddServing: (size: ServingSize) => void;
  onRemoveServing: (index: number) => void;
  onToggleWater?: () => void; // For water
}

export default function FoodGroupRow({
  icon,
  label,
  foodGroup,
  target,
  servings,
  waterCount,
  onAddServing,
  onRemoveServing,
  onToggleWater,
}: FoodGroupRowProps) {
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [sizeModalVisible, setSizeModalVisible] = useState(false);
  
  const foodGroupInfo = FOOD_GROUP_INFO[foodGroup];
  const isWater = foodGroup === 'water';

  // Calculate total portion units
  const totalPortionUnits = isWater 
    ? waterCount || 0 
    : servings.reduce((sum, s) => sum + s.portionUnits, 0);

  const handleInfoPress = () => {
    console.log(`Opening info modal for ${label}`);
    setInfoModalVisible(true);
  };

  const handleAddPress = () => {
    if (isWater && onToggleWater) {
      onToggleWater();
    } else {
      console.log(`Opening size modal for ${label}`);
      setSizeModalVisible(true);
    }
  };

  const handleSelectSize = (size: ServingSize) => {
    console.log(`Selected size ${size} for ${label}`);
    onAddServing(size);
  };

  const handleRemoveServing = (index: number) => {
    console.log(`Removing serving ${index} from ${label}`);
    onRemoveServing(index);
  };

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
            {totalPortionUnits.toFixed(1)}/{target}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${Math.min(100, (totalPortionUnits / target) * 100)}%` }
            ]} 
          />
        </View>

        {/* Servings display */}
        {!isWater && servings.length > 0 && (
          <View style={styles.servingsContainer}>
            {servings.map((serving, index) => (
              <TouchableOpacity
                key={index}
                style={styles.servingChip}
                onPress={() => handleRemoveServing(index)}
                activeOpacity={0.7}
              >
                <Text style={styles.servingSize}>{serving.size}</Text>
                <Text style={styles.servingUnits}>({serving.portionUnits})</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Add button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddPress}
          activeOpacity={0.7}
        >
          <Text style={styles.addButtonText}>
            {isWater ? '+ Add Glass' : '+ Add Serving'}
          </Text>
        </TouchableOpacity>
      </View>

      <FoodGroupInfoModal
        visible={infoModalVisible}
        onClose={() => setInfoModalVisible(false)}
        title={label}
        icon={icon}
        benefit={foodGroupInfo.benefit}
        avoid={foodGroupInfo.avoid}
        examples={foodGroupInfo.examples}
      />

      {!isWater && (
        <ServingSizeModal
          visible={sizeModalVisible}
          onClose={() => setSizeModalVisible(false)}
          onSelectSize={handleSelectSize}
          foodGroupLabel={label}
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
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  servingsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  servingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  servingSize: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 4,
  },
  servingUnits: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
