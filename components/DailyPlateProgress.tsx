
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

// All segments now use white background with black outlines
// Progress fill: green (#4CAF50) for all sections
const PLATE_SECTIONS = [
  { key: 'protein' as keyof PortionTargets, label: 'Protein', backgroundColor: '#FFFFFF', icon: '🍗' },
  { key: 'veggies' as keyof PortionTargets, label: 'Vegetables', backgroundColor: '#FFFFFF', icon: '🥦' },
  { key: 'fruits' as keyof PortionTargets, label: 'Fruit', backgroundColor: '#FFFFFF', icon: '🍎' },
  { key: 'wholeGrains' as keyof PortionTargets, label: 'Whole Grains', backgroundColor: '#FFFFFF', icon: '🌾' },
  { key: 'nutsSeeds' as keyof PortionTargets, label: 'Nuts & Seeds', backgroundColor: '#FFFFFF', icon: '🥜' },
  { key: 'fats' as keyof PortionTargets, label: 'Fats', backgroundColor: '#FFFFFF', icon: '🥑' },
];

// Progress fill color - green for all sections
const PROGRESS_FILL_COLOR = '#4CAF50'; // Green

// Black outline color
const OUTLINE_COLOR = '#1C1C1E'; // Black

// Export the color mapping so FoodGroupRow can use it for the indicator dots
export const FOOD_GROUP_COLORS: Record<string, string> = {
  protein: '#FFFFFF',
  veggies: '#FFFFFF',
  fruits: '#FFFFFF',
  wholeGrains: '#FFFFFF',
  nutsSeeds: '#FFFFFF',
  fats: '#FFFFFF',
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

  const isPlateComplete = PLATE_SECTIONS.every((section) => isSectionComplete(section.key));
  const isPlateEmpty = PLATE_SECTIONS.every((section) => (completed[section.key] || 0) === 0);

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
    
    console.log(`Segment ${section.key}: angle=${segmentAngle.toFixed(1)}°, progress=${(progress * 100).toFixed(0)}%, color=${section.backgroundColor}`);
    
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
      <Text style={styles.title}>Your Plate Today</Text>

      {isPlateEmpty && (
        <Text style={styles.hintText}>Tap the portions below to build your plate</Text>
      )}
      
      <View style={styles.plateWrapper}>
        <View style={styles.plateContainer}>
          <Svg width={plateSize} height={plateSize} viewBox={`0 0 ${plateSize} ${plateSize}`}>
            {/* Outer plate circle with black outline */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={outerRadius}
              fill="none"
              stroke={OUTLINE_COLOR}
              strokeWidth="2"
            />
            
            {/* Pie slices for each food group - TWO LAYERS */}
            {segments.map((seg) => {
              // Background layer: white (full opacity)
              const backgroundPath = createPieSlicePath(
                centerX,
                centerY,
                outerRadius,
                seg.startAngle,
                seg.endAngle
              );
              
              // Progress layer: green fill, only fills based on progress
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
                  {/* Background layer - white with black outline between segments */}
                  <Path
                    d={backgroundPath}
                    fill={seg.section.backgroundColor}
                    fillOpacity={1.0}
                    stroke={OUTLINE_COLOR}
                    strokeWidth="2"
                  />
                  
                  {/* Progress layer - green fill */}
                  {seg.progress > 0 && (
                    <Path
                      d={progressPath}
                      fill={PROGRESS_FILL_COLOR}
                      fillOpacity={0.85}
                      stroke={OUTLINE_COLOR}
                      strokeWidth="1"
                    />
                  )}
                </G>
              );
            })}
            
            {/* Center circle with black outline */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={innerRadius}
              fill={colors.background}
              stroke={OUTLINE_COLOR}
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

      {isPlateComplete && (
        <Text style={styles.congratsMessage}>Congratulations! You've built a balanced plate.</Text>
      )}
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
  hintText: {
    fontSize: 13,
    color: '#555555',
    textAlign: 'center',
    marginBottom: 12,
  },
  congratsMessage: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
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
    borderColor: OUTLINE_COLOR,
    zIndex: 15,
  },
});
