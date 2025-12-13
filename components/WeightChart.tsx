
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Circle, Polyline, Text as SvgText, Path } from 'react-native-svg';
import { colors } from '@/styles/commonStyles';
import { WeightEntry } from '@/types';

interface WeightChartProps {
  entries: WeightEntry[];
  goalWeight?: number;
}

const CHART_HEIGHT = 220;
const CHART_PADDING = { top: 20, right: 10, bottom: 30, left: 45 };

export default function WeightChart({ entries, goalWeight }: WeightChartProps) {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 80; // Account for container padding

  const chartData = useMemo(() => {
    if (entries.length === 0) {
      return null;
    }

    // Sort entries by date ascending for chart display
    const sortedEntries = [...entries].sort((a, b) => a.timestamp - b.timestamp);

    // Calculate min and max weights for y-axis
    const weights = sortedEntries.map(e => e.weight);
    const minWeight = Math.min(...weights, goalWeight || Infinity);
    const maxWeight = Math.max(...weights, goalWeight || -Infinity);
    
    // Add padding to y-axis range
    const weightRange = maxWeight - minWeight;
    const yMin = Math.floor(minWeight - weightRange * 0.15);
    const yMax = Math.ceil(maxWeight + weightRange * 0.15);

    // Calculate chart dimensions
    const plotWidth = chartWidth - CHART_PADDING.left - CHART_PADDING.right;
    const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

    // Map data points to chart coordinates
    const points = sortedEntries.map((entry, index) => {
      const x = CHART_PADDING.left + (index / Math.max(sortedEntries.length - 1, 1)) * plotWidth;
      const y = CHART_PADDING.top + plotHeight - ((entry.weight - yMin) / (yMax - yMin)) * plotHeight;
      return { x, y, entry };
    });

    // Calculate trend line using linear regression
    let trendLine = null;
    if (sortedEntries.length >= 2) {
      const n = sortedEntries.length;
      const sumX = sortedEntries.reduce((sum, _, i) => sum + i, 0);
      const sumY = sortedEntries.reduce((sum, e) => sum + e.weight, 0);
      const sumXY = sortedEntries.reduce((sum, e, i) => sum + i * e.weight, 0);
      const sumX2 = sortedEntries.reduce((sum, _, i) => sum + i * i, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      const trendStart = intercept;
      const trendEnd = slope * (n - 1) + intercept;

      const x1 = CHART_PADDING.left;
      const y1 = CHART_PADDING.top + plotHeight - ((trendStart - yMin) / (yMax - yMin)) * plotHeight;
      const x2 = CHART_PADDING.left + plotWidth;
      const y2 = CHART_PADDING.top + plotHeight - ((trendEnd - yMin) / (yMax - yMin)) * plotHeight;

      trendLine = { x1, y1, x2, y2 };
    }

    // Calculate goal line position if goal weight is provided
    let goalLine = null;
    if (goalWeight) {
      const y = CHART_PADDING.top + plotHeight - ((goalWeight - yMin) / (yMax - yMin)) * plotHeight;
      goalLine = { y, weight: goalWeight };
    }

    return {
      points,
      trendLine,
      goalLine,
      yMin,
      yMax,
      plotWidth,
      plotHeight,
    };
  }, [entries, goalWeight, chartWidth]);

  if (!chartData || entries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data yet</Text>
        <Text style={styles.emptySubtext}>Add weight entries to see your progress</Text>
      </View>
    );
  }

  const { points, trendLine, goalLine, yMin, yMax, plotWidth, plotHeight } = chartData;

  // Generate y-axis labels (fewer labels for cleaner look)
  const yAxisLabels = [];
  const labelCount = 4;
  for (let i = 0; i < labelCount; i++) {
    const weight = yMin + ((yMax - yMin) * i) / (labelCount - 1);
    const y = CHART_PADDING.top + plotHeight - ((weight - yMin) / (yMax - yMin)) * plotHeight;
    yAxisLabels.push({ weight: Math.round(weight), y });
  }

  // Create polyline points string for the weight line
  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  // Create gradient area path
  const areaPath = points.length > 0 
    ? `M ${points[0].x},${CHART_PADDING.top + plotHeight} L ${polylinePoints} L ${points[points.length - 1].x},${CHART_PADDING.top + plotHeight} Z`
    : '';

  return (
    <View style={styles.container}>
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
        {areaPath && (
          <Path
            d={areaPath}
            fill={colors.primary}
            opacity={0.1}
          />
        )}

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

        {/* Data points */}
        {points.map((point, index) => (
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
              {new Date(points[0].entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </SvgText>
            {points.length > 1 && (
              <SvgText
                x={points[points.length - 1].x}
                y={CHART_HEIGHT - 8}
                fill={colors.textSecondary}
                fontSize="11"
                textAnchor="end"
              >
                {new Date(points[points.length - 1].entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </SvgText>
            )}
          </>
        )}
      </Svg>
    </View>
  );
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
