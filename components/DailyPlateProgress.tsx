
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';
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
  const iconRadius = radius * 0.6; // Position icons 60% from center
  
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

  // Calculate progress for each section
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
            const isComplete = isSectionComplete(section.key);
            
            const startAngle = index * anglePerSection;
            const endAngle = startAngle + anglePerSection;
            const midAngle = startAngle + anglePerSection / 2;
            
            const path = createPieSlicePath(centerX, centerY, outerRadius, startAngle, endAngle);
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
        
        {/* Icons positioned absolutely on top of SVG */}
        <View style={styles.iconsContainer}>
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
                    left: iconPos.x - 15,
                    top: iconPos.y - 15,
                  },
                ]}
              >
                <Text style={styles.icon}>{section.icon}</Text>
              </View>
            );
          })}
          
          {/* Center emoji */}
          <View style={styles.centerEmoji}>
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
  plateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconsContainer: {
    position: 'absolute',
    width: 280,
    height: 280,
    top: 0,
    left: 0,
  },
  iconContainer: {
    position: 'absolute',
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  icon: {
    fontSize: 24,
  },
  centerEmoji: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    top: 100,
    left: 100,
    borderWidth: 2,
    borderColor: colors.border,
    zIndex: 15,
  },
  centerEmojiText: {
    fontSize: 32,
  },
});
