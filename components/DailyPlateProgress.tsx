
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { PortionTargets } from '@/types';

interface DailyPlateProgressProps {
  completed: PortionTargets;
  targets: PortionTargets;
}

// Food groups to display on the plate (excluding water and alcohol)
const PLATE_SECTIONS = [
  { key: 'protein' as keyof PortionTargets, label: 'Protein', color: '#E57373', icon: '🍗' },
  { key: 'veggies' as keyof PortionTargets, label: 'Vegetables', color: '#81C784', icon: '🥦' },
  { key: 'fruits' as keyof PortionTargets, label: 'Fruit', color: '#FFB74D', icon: '🍎' },
  { key: 'wholeGrains' as keyof PortionTargets, label: 'Whole Grains', color: '#FFD54F', icon: '🌾' },
  { key: 'nutsSeeds' as keyof PortionTargets, label: 'Nuts & Seeds', color: '#A1887F', icon: '🥜' },
  { key: 'fats' as keyof PortionTargets, label: 'Fats', color: '#AED581', icon: '🥑' },
];

export default function DailyPlateProgress({ completed, targets }: DailyPlateProgressProps) {
  // Calculate progress for each section
  const getSectionProgress = (key: keyof PortionTargets): number => {
    const target = targets[key];
    const done = completed[key] || 0;
    if (target === 0) return 0;
    return Math.min(done / target, 1); // Cap at 100%
  };

  const isSectionComplete = (key: keyof PortionTargets): boolean => {
    const target = targets[key];
    const done = completed[key] || 0;
    return done >= target && target > 0;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today's Balance</Text>
      
      {/* Circular plate visualization */}
      <View style={styles.plateContainer}>
        <View style={styles.plate}>
          {PLATE_SECTIONS.map((section, index) => {
            const progress = getSectionProgress(section.key);
            const isComplete = isSectionComplete(section.key);
            const angle = (360 / PLATE_SECTIONS.length) * index;
            
            return (
              <View
                key={section.key}
                style={[
                  styles.plateSection,
                  {
                    transform: [{ rotate: `${angle}deg` }],
                  },
                ]}
              >
                <View
                  style={[
                    styles.plateSectionFill,
                    {
                      backgroundColor: section.color,
                      opacity: 0.2 + (progress * 0.8), // Gradually fill from 20% to 100% opacity
                    },
                  ]}
                />
                {isComplete && (
                  <View style={styles.completionIconContainer}>
                    <Text style={styles.completionIcon}>{section.icon}</Text>
                  </View>
                )}
              </View>
            );
          })}
          
          {/* Center circle */}
          <View style={styles.plateCenter}>
            <Text style={styles.plateCenterEmoji}>🍽️</Text>
          </View>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {PLATE_SECTIONS.map((section) => {
          const progress = getSectionProgress(section.key);
          const progressPercent = Math.round(progress * 100);
          const completedCount = completed[section.key] || 0;
          const targetCount = targets[section.key];
          
          return (
            <View key={section.key} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: section.color }]} />
              <Text style={styles.legendLabel}>{section.label}</Text>
              <Text style={styles.legendProgress}>
                {completedCount}/{targetCount}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const PLATE_SIZE = 280;
const PLATE_CENTER_SIZE = 80;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  plateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  plate: {
    width: PLATE_SIZE,
    height: PLATE_SIZE,
    borderRadius: PLATE_SIZE / 2,
    backgroundColor: colors.cardBackground,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  plateSection: {
    position: 'absolute',
    width: PLATE_SIZE,
    height: PLATE_SIZE / 2,
    top: 0,
    left: 0,
    transformOrigin: 'center bottom',
  },
  plateSectionFill: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: PLATE_SIZE / 2,
    borderTopRightRadius: PLATE_SIZE / 2,
  },
  completionIconContainer: {
    position: 'absolute',
    top: 40,
    left: '50%',
    transform: [{ translateX: -15 }],
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionIcon: {
    fontSize: 24,
  },
  plateCenter: {
    width: PLATE_CENTER_SIZE,
    height: PLATE_CENTER_SIZE,
    borderRadius: PLATE_CENTER_SIZE / 2,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    zIndex: 10,
  },
  plateCenterEmoji: {
    fontSize: 32,
  },
  legend: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 10,
  },
  legendLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  legendProgress: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
