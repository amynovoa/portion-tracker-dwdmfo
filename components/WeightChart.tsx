
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Circle, Polyline, Text as SvgText, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { colors } from '@/styles/commonStyles';
import { WeightEntry } from '@/types';

interface WeightChartProps {
  entries: WeightEntry[];
  goalWeight?: number;
}

const CHART_HEIGHT = 250;
const CHART_PADDING = { top: 20, right: 20, bottom: 40, left: 50 };

export default function WeightChart({ entries, goalWeight }: WeightChartProps) {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 32; // Account for container padding

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
    const yMin = Math.floor(minWeight - weightRange * 0.1);
    const yMax = Math.ceil(maxWeight + weightRange * 0.1);

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
        <Text style={styles.emptyText}>No weight data yet</Text>
        <Text style={styles.emptySubtext}>Add your first weight entry to see your progress</Text>
      </View>
    );
  }

  const { points, trendLine, goalLine, yMin, yMax, plotWidth, plotHeight } = chartData;

  // Generate y-axis labels
  const yAxisLabels = [];
  const labelCount = 5;
  for (let i = 0; i < labelCount; i++) {
    const weight = yMin + ((yMax - yMin) * i) / (labelCount - 1);
    const y = CHART_PADDING.top + plotHeight - ((weight - yMin) / (yMax - yMin)) * plotHeight;
    yAxisLabels.push({ weight: Math.round(weight), y });
  }

  // Create polyline points string for the weight line
  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.primary} stopOpacity="0.3" />
            <Stop offset="1" stopColor={colors.primary} stopOpacity="0.05" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {yAxisLabels.map((label, index) => (
          <Line
            key={`grid-${index}`}
            x1={CHART_PADDING.left}
            y1={label.y}
            x2={CHART_PADDING.left + plotWidth}
            y2={label.y}
            stroke={colors.border}
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        ))}

        {/* Goal line */}
        {goalLine && (
          <>
            <Line
              x1={CHART_PADDING.left}
              y1={goalLine.y}
              x2={CHART_PADDING.left + plotWidth}
              y2={goalLine.y}
              stroke={colors.secondary}
              strokeWidth="2"
              strokeDasharray="6,4"
            />
            <SvgText
              x={CHART_PADDING.left + plotWidth + 5}
              y={goalLine.y + 4}
              fill={colors.secondary}
              fontSize="10"
              fontWeight="600"
            >
              Goal
            </SvgText>
          </>
        )}

        {/* Trend line */}
        {trendLine && (
          <Line
            x1={trendLine.x1}
            y1={trendLine.y1}
            x2={trendLine.x2}
            y2={trendLine.y2}
            stroke={colors.primary}
            strokeWidth="2"
            strokeDasharray="8,4"
            opacity={0.5}
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
            r="5"
            fill={colors.primary}
            stroke="#FFFFFF"
            strokeWidth="2"
          />
        ))}

        {/* Y-axis labels */}
        {yAxisLabels.map((label, index) => (
          <SvgText
            key={`y-label-${index}`}
            x={CHART_PADDING.left - 10}
            y={label.y + 4}
            fill={colors.textSecondary}
            fontSize="12"
            textAnchor="end"
          >
            {label.weight}
          </SvgText>
        ))}

        {/* X-axis labels (first and last date) */}
        {points.length > 0 && (
          <>
            <SvgText
              x={points[0].x}
              y={CHART_HEIGHT - 10}
              fill={colors.textSecondary}
              fontSize="12"
              textAnchor="start"
            >
              {new Date(points[0].entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </SvgText>
            {points.length > 1 && (
              <SvgText
                x={points[points.length - 1].x}
                y={CHART_HEIGHT - 10}
                fill={colors.textSecondary}
                fontSize="12"
                textAnchor="end"
              >
                {new Date(points[points.length - 1].entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </SvgText>
            )}
          </>
        )}

        {/* Y-axis label */}
        <SvgText
          x={15}
          y={CHART_HEIGHT / 2}
          fill={colors.textSecondary}
          fontSize="12"
          textAnchor="middle"
          transform={`rotate(-90, 15, ${CHART_HEIGHT / 2})`}
        >
          Weight (lbs)
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  emptyContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 32,
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
