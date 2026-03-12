
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, G, Defs, ClipPath } from 'react-native-svg';
import { colors } from '@/styles/commonStyles';
import { PortionTargets } from '@/types';
import AppLogo from './AppLogo';

interface DailyPlateProgressProps {
  completed: PortionTargets;
  targets: PortionTargets;
}

// Brand color palette for the plate (black, red, white, grey variations)
// These colors are ONLY for the plate segments and the small indicator in the tracking list
const PLATE_SECTIONS = [
  { key: 'protein' as keyof PortionTargets, label: 'Protein', color: '#C94A3D', icon: '🍗' }, // Brand Red
  { key: 'veggies' as keyof PortionTargets, label: 'Vegetables', color: '#1C1C1E', icon: '🥦' }, // Black
  { key: 'fruits' as keyof PortionTargets, label: 'Fruit', color: '#FF3B30', icon: '🍎' }, // Bright Red
  { key: 'wholeGrains' as keyof PortionTargets, label: 'Whole Grains', color: '#3A3A3C', icon: '🌾' }, // Dark Grey
  { key: 'nutsSeeds' as keyof PortionTargets, label: 'Nuts & Seeds', color: '#8E8E93', icon: '🥜' }, // Medium Grey
  { key: 'fats' as keyof PortionTargets, label: 'Fats', color: '#52525b', icon: '🥑' }, // Zinc 600 Grey
];

// Export the color mapping so FoodGroupRow can use it for the indicator dots
export const FOOD_GROUP_COLORS: Record<string, string> = {
  protein: '#C94A3D', // Brand Red
  veggies: '#1C1C1E', // Black
  fruits: '#FF3B30', // Bright Red
  wholeGrains: '#3A3A3C', // Dark Grey
  nutsSeeds: '#8E8E93', // Medium Grey
  fats: '#52525b', // Zinc 600 Grey
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

// Helper function to create a partial pie slice based on progress (0 to 1)
function createProgressSlicePath(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  progress: number
): string {
  // Calculate the actual end angle based on progress
  const actualEndAngle = startAngle + (endAngle - startAngle) * progress;
  
  const startAngleRad = (startAngle - 90) * (Math.PI / 180);
  const endAngleRad = (actualEndAngle - 90) * (Math.PI / 180);

  const x1 = centerX + radius * Math.cos(startAngleRad);
  const y1 = centerY + radius * Math.sin(startAngleRad);
  const x2 = centerX + radius * Math.cos(endAngleRad);
  const y2 = centerY + radius * Math.sin(endAngleRad);

  const largeArcFlag = actualEndAngle - startAngle > 180 ? 1 : 0;

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
  
  console.log('DailyPlateProgress - Targets:', targets);
  console.log('DailyPlateProgress - Completed:', completed);

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

  // Build segments with EQUAL angles (60 degrees each for 6 sections)
  const segmentAngle = 360 / PLATE_SECTIONS.length; // 60 degrees per section
  let currentAngle = 0;
  
  const segments = PLATE_SECTIONS.map((section) => {
    const progress = getSectionProgress(section.key);
    const isComplete = isSectionComplete(section.key);
    
    const startAngle = currentAngle;
    const endAngle = currentAngle + segmentAngle;
    currentAngle = endAngle;
    
    // Calculate midpoint angle for icon positioning
    const midAngle = startAngle + segmentAngle / 2;
    const iconPos = calculateIconPosition(centerX, centerY, outerRadius, midAngle);
    
    console.log(`Segment ${section.key}: angle=${segmentAngle.toFixed(1)}°, progress=${(progress * 100).toFixed(0)}%, iconPos=(${iconPos.x.toFixed(1)}, ${iconPos.y.toFixed(1)})`);
    
    return {
      section,
      startAngle,
      endAngle,
      segmentAngle,
      progress,
      isComplete,
      iconPos,
    };
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today&apos;s Balance</Text>
      
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
            
            {/* Pie slices for each food group - TWO LAYERS */}
            {segments.map((seg) => {
              // Background layer: light tint (20% opacity) of the food group color
              const backgroundPath = createPieSlicePath(
                centerX,
                centerY,
                outerRadius,
                seg.startAngle,
                seg.endAngle
              );
              
              // Progress layer: full color, but only fills based on progress
              const progressPath = createProgressSlicePath(
                centerX,
                centerY,
                outerRadius,
                seg.startAngle,
                seg.endAngle,
                seg.progress
              );
              
              return (
                <G key={seg.section.key}>
                  {/* Background layer - light tint */}
                  <Path
                    d={backgroundPath}
                    fill={seg.section.color}
                    fillOpacity={0.15}
                    stroke={colors.border}
                    strokeWidth="0.5"
                  />
                  
                  {/* Progress layer - full color */}
                  {seg.progress > 0 && (
                    <Path
                      d={progressPath}
                      fill={seg.section.color}
                      fillOpacity={1.0}
                      stroke={colors.border}
                      strokeWidth="0.5"
                    />
                  )}
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
          
          {/* Icons positioned absolutely on top of SVG - ALWAYS VISIBLE */}
          {segments.map((seg) => {
            return (
              <View
                key={`icon-${seg.section.key}`}
                style={[
                  styles.iconContainer,
                  {
                    left: seg.iconPos.x,
                    top: seg.iconPos.y,
                  },
                ]}
              >
                <Text style={styles.icon}>{seg.section.icon}</Text>
              </View>
            );
          })}
          
          {/* Center logo - Portion Track branding */}
          <View style={[styles.centerLogo, { left: centerX, top: centerY }]}>
            <AppLogo size={50} />
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
  centerLogo: {
    position: 'absolute',
    width: 70,
    height: 70,
    marginLeft: -35,
    marginTop: -35,
    borderRadius: 35,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    zIndex: 15,
  },
});
