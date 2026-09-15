
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { colors, plateColors } from '@/styles/commonStyles';
import { PortionTargets } from '@/types';
import { useTranslation } from 'react-i18next';

interface DailyPlateProgressProps {
  completed: PortionTargets;
  targets: PortionTargets;
}

const PLATE_SECTIONS: { key: keyof PortionTargets; label: string; color: string; icon: string | number | { uri: string } }[] = [
  { key: 'veggies', label: 'Vegetables', color: plateColors.veggies, icon: '🥦' },
  { key: 'fruits', label: 'Fruit', color: plateColors.fruits, icon: '🍎' },
  { key: 'protein', label: 'Protein', color: plateColors.protein, icon: '🍗' },
  { key: 'wholeGrains', label: 'Whole Grains', color: plateColors.wholeGrains, icon: '🌾' },
  { key: 'fats', label: 'Fats', color: plateColors.fats, icon: '🥑' },
  { key: 'nutsSeeds', label: 'Nuts & Seeds', color: plateColors.nutsSeeds, icon: require('../assets/images/almond.png') },
];

export const FOOD_GROUP_COLORS: Record<string, string> = {
  veggies: plateColors.veggies,
  fruits: plateColors.fruits,
  protein: plateColors.protein,
  wholeGrains: plateColors.wholeGrains,
  fats: plateColors.fats,
  nutsSeeds: plateColors.nutsSeeds,
};

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

function createProgressSlicePath(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  progress: number
): string {
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

function calculateIconPosition(
  centerX: number,
  centerY: number,
  radius: number,
  angle: number
): { x: number; y: number } {
  const angleRad = (angle - 90) * (Math.PI / 180);
  const iconRadius = radius * 0.62;

  return {
    x: centerX + iconRadius * Math.cos(angleRad),
    y: centerY + iconRadius * Math.sin(angleRad),
  };
}

export default function DailyPlateProgress({ completed, targets }: DailyPlateProgressProps) {
  const { t } = useTranslation();
  const plateSize = 280;
  const centerX = plateSize / 2;
  const centerY = plateSize / 2;
  const outerRadius = plateSize / 2 - 16;
  const innerRadius = 46;
  const ringRadius = outerRadius + 7;

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

  const overallProgress =
    PLATE_SECTIONS.reduce((sum, section) => sum + getSectionProgress(section.key), 0) /
    PLATE_SECTIONS.length;
  const overallPercent = Math.round(overallProgress * 100);
  const circumference = 2 * Math.PI * ringRadius;

  const segmentAngle = 360 / PLATE_SECTIONS.length;
  let currentAngle = 0;

  const segments = PLATE_SECTIONS.map((section) => {
    const progress = getSectionProgress(section.key);
    const isComplete = isSectionComplete(section.key);
    const startAngle = currentAngle;
    const endAngle = currentAngle + segmentAngle;
    currentAngle = endAngle;
    const midAngle = startAngle + segmentAngle / 2;
    const iconPos = calculateIconPosition(centerX, centerY, outerRadius, midAngle);

    return {
      section,
      startAngle,
      endAngle,
      progress,
      isComplete,
      iconPos,
    };
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('home.yourPlateToday')}</Text>

      {isPlateEmpty && (
        <Text style={styles.hintText}>{t('home.tapToBuilder')}</Text>
      )}

      <View style={styles.plateWrapper}>
        <View style={styles.plateShadow}>
          <View style={styles.plateContainer}>
            <Svg width={plateSize} height={plateSize} viewBox={`0 0 ${plateSize} ${plateSize}`}>
              <Circle cx={centerX} cy={centerY} r={outerRadius + 10} fill="#FFFFFF" />

              {segments.map((seg) => {
                const backgroundPath = createPieSlicePath(
                  centerX,
                  centerY,
                  outerRadius,
                  seg.startAngle,
                  seg.endAngle
                );
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
                    <Path
                      d={backgroundPath}
                      fill={seg.section.color}
                      fillOpacity={0.28}
                      stroke="#FFFFFF"
                      strokeWidth="3"
                    />
                    {seg.progress > 0.02 && (
                      <Path
                        d={progressPath}
                        fill={seg.section.color}
                        fillOpacity={1}
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                    )}
                  </G>
                );
              })}

              <Circle
                cx={centerX}
                cy={centerY}
                r={ringRadius}
                fill="none"
                stroke={colors.primaryLight}
                strokeWidth="6"
              />
              {overallProgress > 0.02 && (
                <Circle
                  cx={centerX}
                  cy={centerY}
                  r={ringRadius}
                  fill="none"
                  stroke={colors.primary}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${circumference * overallProgress} ${circumference}`}
                  transform={`rotate(-90 ${centerX} ${centerY})`}
                />
              )}

              <Circle
                cx={centerX}
                cy={centerY}
                r={innerRadius}
                fill="#FFFFFF"
              />
            </Svg>

            {segments.map((seg) => (
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
                {typeof seg.section.icon === 'string' ? (
                  <Text style={styles.icon}>{seg.section.icon}</Text>
                ) : (
                  <Image source={seg.section.icon} style={styles.iconImage} resizeMode="contain" />
                )}
              </View>
            ))}

            <View style={[styles.centerHub, { left: centerX, top: centerY }]}>
              <Text
                style={styles.centerPercent}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
                allowFontScaling={false}
              >
                {`${overallPercent}%`}
              </Text>
              <Text style={styles.centerLabel} allowFontScaling={false}>
                {t('home.dailyGoal')}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {isPlateComplete && (
        <Text style={styles.congratsMessage}>{t('home.congratulations')}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  plateWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  plateShadow: {
    borderRadius: 160,
    backgroundColor: '#FFFFFF',
    shadowColor: '#1A2E28',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
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
    fontSize: 22,
  },
  iconImage: {
    width: 24,
    height: 24,
  },
  hintText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  congratsMessage: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  centerHub: {
    position: 'absolute',
    width: 80,
    height: 80,
    marginLeft: -40,
    marginTop: -40,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    zIndex: 15,
    shadowColor: '#1A2E28',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  centerPercent: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 18,
    textAlign: 'center',
    width: '100%',
  },
  centerLabel: {
    marginTop: 1,
    fontSize: 9,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
