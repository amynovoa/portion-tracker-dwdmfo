
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { colors } from '@/styles/commonStyles';
import { PortionTargets } from '@/types';

interface DailyPlateProgressProps {
  completed: PortionTargets;
  targets: PortionTargets;
}

// Fixed color palette for the plate (muted, calm colors)
// These colors are ONLY for the plate segments and the small indicator in the tracking list
const PLATE_SECTIONS = [
  { key: 'protein' as keyof PortionTargets, label: 'Protein', color: '#E76F51', icon: '🍗' },
  { key: 'veggies' as keyof PortionTargets, label: 'Vegetables', color: '#4CAF50', icon: '🥦' },
  { key: 'fruits' as keyof PortionTargets, label: 'Fruit', color: '#F4A261', icon: '🍎' },
  { key: 'wholeGrains' as keyof PortionTargets, label: 'Whole Grains', color: '#E9C46A', icon: '🌾' },
  { key: 'nutsSeeds' as keyof PortionTargets, label: 'Nuts & Seeds', color: '#C8A97E', icon: '🥜' },
  { key: 'fats' as keyof PortionTargets, label: 'Fats', color: '#9B5DE5', icon: '🥑' },
];

// Export the color mapping so FoodGroupRow can use it for the indicator dots
export const FOOD_GROUP_COLORS: Record<string, string> = {
  protein: '#E76F51',
  veggies: '#4CAF50',
  fruits: '#F4A261',
  wholeGrains: '#E9C46A',
  nutsSeeds: '#C8A97E',
  fats: '#9B5DE5',
};

// Helper function to create SVG path for a pie slice
function createPieSlicePath(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const startAngleRad = (startAngle - 90) * (Math.PI / 180);
  const endAngleRad = (endAngle - 90) * (Math.PI / 180);

  const x1 = centerX + radius * Math.cos(startAngleRad);
  const y1 = centerY + radius * Math.sin(startAngleRad);
  const x2 = centerX + radius * Math.cos(endAngleRad);
  const y2 = centerY + radius * Math.sin(endAngleRad);

  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
}

// Helper function to calculate icon position
function calculateIconPosition(
  centerX: number,
  centerY: number,
  radius: number,
  angle: number
): { x: number; y: number } {
  const angleRad = (angle - 90) * (Math.PI / 180);
  const iconRadius = radius * 0.65; // Position icons 65% from center
  
  const iconX = centerX + iconRadius * Math.cos(angleRad);
  const iconY = centerY + iconRadius * Math.sin(angleRad);
  
  return { x: iconX, y: iconY };
}

export default function DailyPlateProgress({ completed, targets }: DailyPlateProgressProps) {
  const plateSize = 280;
  const centerX = plateSize / 2;
  const centerY = plateSize / 2;
  const outerRadius = plateSize / 2 - 10;
  const innerRadius = 40;
  
  const totalSections = PLATE_SECTIONS.length;
  const anglePerSection = 360 / totalSections;

  // Calculate progress for each section (0 to 1)
  const getSectionProgress = (key: keyof PortionTargets): number => {
    const target = targets[key];
    const done = completed[key] || 0;
    if (target === 0) return 0;
    return Math.min(done / target, 1);
  };

  const isSectionComplete = (key: keyof PortionTargets): boolean => {
    const target = targets[key];
    const done = completed[key] || 0;
    return done >= target && target > 0;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today's Balance</Text>
      
      <View style={styles.plateWrapper}>
        <View style={styles.plateContainer}>
          <Svg width={plateSize} height={plateSize} viewBox={`0 0 ${plateSize} ${plateSize}`}>
            {/* Background circle */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={outerRadius}
              fill={colors.cardBackground}
              stroke={colors.border}
              strokeWidth="3"
            />
            
            {/* Pie slices for each food group */}
            {PLATE_SECTIONS.map((section, index) => {
              const progress = getSectionProgress(section.key);
              
              const startAngle = index * anglePerSection;
              const endAngle = startAngle + anglePerSection;
              
              const path = createPieSlicePath(centerX, centerY, outerRadius, startAngle, endAngle);
              
              // Fill gradually based on progress: 20% base opacity, fills to 100%
              const opacity = 0.2 + (progress * 0.8);
              
              return (
                <G key={section.key}>
                  <Path
                    d={path}
                    fill={section.color}
                    fillOpacity={opacity}
                    stroke={colors.border}
                    strokeWidth="0.5"
                  />
                </G>
              );
            })}
            
            {/* Center circle */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={innerRadius}
              fill={colors.background}
              stroke={colors.border}
              strokeWidth="2"
            />
          </Svg>
          
          {/* Icons positioned absolutely on top of SVG - only show when section is complete */}
          {PLATE_SECTIONS.map((section, index) => {
            const isComplete = isSectionComplete(section.key);
            if (!isComplete) return null;
            
            const startAngle = index * anglePerSection;
            const midAngle = startAngle + anglePerSection / 2;
            const iconPos = calculateIconPosition(centerX, centerY, outerRadius, midAngle);
            
            return (
              <View
                key={`icon-${section.key}`}
                style={[
                  styles.iconContainer,
                  {
                    left: iconPos.x,
                    top: iconPos.y,
                  },
                ]}
              >
                <Text style={styles.icon}>{section.icon}</Text>
              </View>
            );
          })}
          
          {/* Center emoji */}
          <View style={[styles.centerEmoji, { left: centerX, top: centerY }]}>
            <Text style={styles.centerEmojiText}>🍽️</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

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
  plateWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  plateContainer: {
    width: 280,
    height: 280,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'absolute',
    width: 30,
    height: 30,
    marginLeft: -15,
    marginTop: -15,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  icon: {
    fontSize: 24,
  },
  centerEmoji: {
    position: 'absolute',
    width: 60,
    height: 60,
    marginLeft: -30,
    marginTop: -30,
    borderRadius: 30,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    zIndex: 15,
  },
  centerEmojiText: {
    fontSize: 32,
  },
});
