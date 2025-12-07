
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import PortionSlot from './PortionSlot';
import FoodGroupInfoModal from './FoodGroupInfoModal';
import { FoodGroup } from '../types';
import { colors } from '../styles/commonStyles';
import { FOOD_GROUP_INFO } from '../constants/foodGroupInfo';

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
  foodGroup,
  target,
  completed,
  onToggle,
}: FoodGroupRowProps) {
  const [modalVisible, setModalVisible] = useState(false);
  
  // Calculate how many extra slots to show beyond target
  // For alcohol, show 6 extra slots to allow tracking up to 6 portions
  // For other food groups, show 3 extra slots
  const extraSlots = foodGroup === 'alcohol' ? 6 : 3;
  const totalSlots = target + extraSlots;
  
  const foodGroupInfo = FOOD_GROUP_INFO[foodGroup];

  const handleInfoPress = () => {
    console.log(`Opening modal for ${label}`);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    console.log(`Closing modal for ${label}`);
    setModalVisible(false);
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

      <FoodGroupInfoModal
        visible={modalVisible}
        onClose={handleCloseModal}
        title={label}
        icon={icon}
        benefit={foodGroupInfo.benefit}
        avoid={foodGroupInfo.avoid}
        examples={foodGroupInfo.examples}
      />
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
  slots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
});
