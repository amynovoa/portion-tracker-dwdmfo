
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Circle, Polyline, Text as SvgText, Path } from 'react-native-svg';
import { colors } from '@/styles/commonStyles';
import { WeightEntry } from '@/types';
import { useTranslation } from 'react-i18next';

interface WeightChartProps {
  entries: WeightEntry[];
  goalWeight?: number;
}

const CHART_HEIGHT = 220;
const CHART_PADDING = { top: 20, right: 10, bottom: 30, left: 45 };

export default function WeightChart({ entries, goalWeight }: WeightChartProps) {
  const { t, i18n } = useTranslation();
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.max(screenWidth - 80, 1); // Guard against zero/negative on tiny screens

  const chartData = useMemo(() => {
    console.log(`[WeightChart] Rendering with ${entries.length} entries, goalWeight=${goalWeight}`);

    // Filter out any invalid entries before processing
    const safeEntries = entries.filter(e =>
      typeof e.weight === 'number' && isFinite(e.weight) && e.weight > 0 &&
      typeof e.timestamp === 'number' && isFinite(e.timestamp)
    );

    if (safeEntries.length === 0) return null;

    // Sort entries by date ascending for chart display
    const sortedEntries = [...safeEntries].sort((a, b) => a.timestamp - b.timestamp);

    // Calculate min and max weights for y-axis
    const weights = sortedEntries.map(e => e.weight);
    const minWeight = Math.min(...weights, goalWeight !== undefined ? goalWeight : Infinity);
    const maxWeight = Math.max(...weights, goalWeight !== undefined ? goalWeight : -Infinity);

    // Add padding to y-axis range (guard against zero range with single/flat data)
    const weightRange = maxWeight - minWeight;
    const yMin = Math.floor(minWeight - Math.max(weightRange * 0.15, 2));
    const yMax = Math.ceil(maxWeight + Math.max(weightRange * 0.15, 2));

    // Guard against zero yRange
    const yRange = yMax - yMin;
    const safeYRange = yRange > 0 ? yRange : 1;

    // Calculate chart dimensions — guard against zero/negative plotWidth
    const plotWidth = Math.max(chartWidth - CHART_PADDING.left - CHART_PADDING.right, 1);
    const plotHeight = Math.max(CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom, 1);

    // Guard against single-point x-axis (division by zero)
    const xDivisor = Math.max(sortedEntries.length - 1, 1);

    // Map data points to chart coordinates
    const points = sortedEntries.map((entry, index) => {
      const x = CHART_PADDING.left + (index / xDivisor) * plotWidth;
      const y = CHART_PADDING.top + plotHeight - ((entry.weight - yMin) / safeYRange) * plotHeight;
      return { x, y, entry };
    });

    // Validate all computed coordinates
    if (points.some(p => !isFinite(p.x) || !isFinite(p.y))) {
      console.warn('[WeightChart] Invalid coordinates detected, showing empty state');
      return null;
    }

    // Calculate trend line using linear regression
    let trendLine: { x1: number; y1: number; x2: number; y2: number } | null = null;
    if (sortedEntries.length >= 2) {
      const n = sortedEntries.length;
      const sumX = sortedEntries.reduce((sum, _, i) => sum + i, 0);
      const sumY = sortedEntries.reduce((sum, e) => sum + e.weight, 0);
      const sumXY = sortedEntries.reduce((sum, e, i) => sum + i * e.weight, 0);
      const sumX2 = sortedEntries.reduce((sum, _, i) => sum + i * i, 0);

      const denom = n * sumX2 - sumX * sumX;
      if (denom !== 0) {
        const slope = (n * sumXY - sumX * sumY) / denom;
        const intercept = (sumY - slope * sumX) / n;

        const trendStart = intercept;
        const trendEnd = slope * (n - 1) + intercept;

        const x1 = CHART_PADDING.left;
        const y1 = CHART_PADDING.top + plotHeight - ((trendStart - yMin) / safeYRange) * plotHeight;
        const x2 = CHART_PADDING.left + plotWidth;
        const y2 = CHART_PADDING.top + plotHeight - ((trendEnd - yMin) / safeYRange) * plotHeight;

        const candidate = { x1, y1, x2, y2 };
        if (isFinite(x1) && isFinite(y1) && isFinite(x2) && isFinite(y2)) {
          trendLine = candidate;
        } else {
          console.warn('[WeightChart] Trend line has invalid coordinates, skipping');
        }
      }
    }

    // Calculate goal line position if goal weight is provided
    let goalLine: { y: number; weight: number } | null = null;
    if (goalWeight !== undefined) {
      const gy = CHART_PADDING.top + plotHeight - ((goalWeight - yMin) / safeYRange) * plotHeight;
      if (isFinite(gy)) {
        goalLine = { y: gy, weight: goalWeight };
      } else {
        console.warn('[WeightChart] Goal line has invalid y coordinate, skipping');
      }
    }

    return {
      points,
      trendLine,
      goalLine,
      yMin,
      yMax,
      safeYRange,
      plotWidth,
      plotHeight,
    };
  }, [entries, goalWeight, chartWidth]);

  if (!chartData || entries.length === 0) {
    const noDataText = t('weightScreen.noData');
    const emptyStateText = t('weightScreen.emptyState');
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{noDataText}</Text>
        <Text style={styles.emptySubtext}>{emptyStateText}</Text>
      </View>
    );
  }

  const { points, trendLine, goalLine, yMin, yMax, safeYRange, plotWidth, plotHeight } = chartData;

  // Generate y-axis labels (fewer labels for cleaner look)
  const yAxisLabels: { weight: number; y: number }[] = [];
  const labelCount = 4;
  for (let i = 0; i < labelCount; i++) {
    const weight = yMin + (safeYRange * i) / (labelCount - 1);
    const y = CHART_PADDING.top + plotHeight - ((weight - yMin) / safeYRange) * plotHeight;
    if (isFinite(y)) {
      yAxisLabels.push({ weight: Math.round(weight), y });
    }
  }

  // Create polyline points string for the weight line
  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  // Create gradient area path
  const areaPath = points.length > 0
    ? `M ${points[0].x},${CHART_PADDING.top + plotHeight} ` +
      points.map(p => `L ${p.x},${p.y}`).join(' ') +
      ` L ${points[points.length - 1].x},${CHART_PADDING.top + plotHeight} Z`
    : '';

  let svgContent: React.ReactNode;
  try {
    svgContent = (
      <Svg width={chartWidth} height={CHART_HEIGHT}>
        {/* Grid lines - subtle */}
        {yAxisLabels.map((label, index) => (
          <Line
            key={`grid-${index}`}
            x1={CHART_PADDING.left}
            y1={label.y}
            x2={CHART_PADDING.left + plotWidth}
            y2={label.y}
            stroke={colors.border}
            strokeWidth="1"
            opacity={0.3}
          />
        ))}

        {/* Goal line */}
        {goalLine && (
          <Line
            x1={CHART_PADDING.left}
            y1={goalLine.y}
            x2={CHART_PADDING.left + plotWidth}
            y2={goalLine.y}
            stroke={colors.secondary}
            strokeWidth="2"
            strokeDasharray="4,4"
            opacity={0.7}
          />
        )}

        {/* Gradient area under line */}
        {areaPath ? (
          <Path
            d={areaPath}
            fill={colors.primary}
            opacity={0.1}
          />
        ) : null}

        {/* Trend line - subtle */}
        {trendLine && (
          <Line
            x1={trendLine.x1}
            y1={trendLine.y1}
            x2={trendLine.x2}
            y2={trendLine.y2}
            stroke={colors.primary}
            strokeWidth="1.5"
            strokeDasharray="6,4"
            opacity={0.4}
          />
        )}

        {/* Weight line */}
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={colors.primary}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points — only render circles for ≤60 points to avoid SVG overload on small devices */}
        {points.length <= 60 && points.map((point, index) => (
          <Circle
            key={`point-${index}`}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={colors.primary}
            stroke="#FFFFFF"
            strokeWidth="2"
          />
        ))}

        {/* Y-axis labels */}
        {yAxisLabels.map((label, index) => (
          <SvgText
            key={`y-label-${index}`}
            x={CHART_PADDING.left - 8}
            y={label.y + 4}
            fill={colors.textSecondary}
            fontSize="11"
            textAnchor="end"
          >
            {label.weight}
          </SvgText>
        ))}

        {/* X-axis labels (first and last date only) */}
        {points.length > 0 && (
          <>
            <SvgText
              x={points[0].x}
              y={CHART_HEIGHT - 8}
              fill={colors.textSecondary}
              fontSize="11"
              textAnchor="start"
            >
              {new Date(points[0].entry.timestamp).toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric' })}
            </SvgText>
            {points.length > 1 && (
              <SvgText
                x={points[points.length - 1].x}
                y={CHART_HEIGHT - 8}
                fill={colors.textSecondary}
                fontSize="11"
                textAnchor="end"
              >
                {new Date(points[points.length - 1].entry.timestamp).toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric' })}
              </SvgText>
            )}
          </>
        )}
      </Svg>
    );
  } catch (err) {
    console.error('[WeightChart] SVG render error:', err);
    svgContent = (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Chart unavailable</Text>
      </View>
    );
  }

  return <View style={styles.container}>{svgContent}</View>;
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    opacity: 0.7,
  },
});
