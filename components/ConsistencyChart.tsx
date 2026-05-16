
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Circle, Polyline, Text as SvgText, Path } from 'react-native-svg';
import { colors } from '@/styles/commonStyles';

interface ConsistencyChartProps {
  entries: { date: string; score: number }[];
}

const CHART_HEIGHT = 220;
const CHART_PADDING = { top: 20, right: 10, bottom: 30, left: 45 };

const Y_LABELS = [0, 25, 50, 75, 100];

export default function ConsistencyChart({ entries }: ConsistencyChartProps) {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.max(screenWidth - 80, 1);

  const chartData = useMemo(() => {
    console.log(`[ConsistencyChart] Rendering with ${entries.length} entries`);

    const safeEntries = entries.filter(
      e =>
        typeof e.score === 'number' &&
        isFinite(e.score) &&
        e.score >= 0 &&
        e.score <= 100 &&
        typeof e.date === 'string' &&
        e.date.length === 10
    );

    if (safeEntries.length === 0) return null;

    const sortedEntries = [...safeEntries]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-90);

    const yMin = 0;
    const yMax = 100;
    const safeYRange = 100;

    const plotWidth = Math.max(chartWidth - CHART_PADDING.left - CHART_PADDING.right, 1);
    const plotHeight = Math.max(CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom, 1);

    const xDivisor = Math.max(sortedEntries.length - 1, 1);

    const points = sortedEntries.map((entry, index) => {
      const x = CHART_PADDING.left + (index / xDivisor) * plotWidth;
      const y = CHART_PADDING.top + plotHeight - ((entry.score - yMin) / safeYRange) * plotHeight;
      return { x, y, entry };
    });

    if (points.some(p => !isFinite(p.x) || !isFinite(p.y))) {
      console.warn('[ConsistencyChart] Invalid coordinates detected, showing empty state');
      return null;
    }

    let trendLine: { x1: number; y1: number; x2: number; y2: number } | null = null;
    if (sortedEntries.length >= 2) {
      const n = sortedEntries.length;
      const sumX = sortedEntries.reduce((sum, _, i) => sum + i, 0);
      const sumY = sortedEntries.reduce((sum, e) => sum + e.score, 0);
      const sumXY = sortedEntries.reduce((sum, e, i) => sum + i * e.score, 0);
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
          console.warn('[ConsistencyChart] Trend line has invalid coordinates, skipping');
        }
      }
    }

    return {
      points,
      trendLine,
      yMin,
      yMax,
      safeYRange,
      plotWidth,
      plotHeight,
    };
  }, [entries, chartWidth]);

  if (!chartData || entries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data yet</Text>
        <Text style={styles.emptySubtext}>Start tracking portions to see your consistency</Text>
      </View>
    );
  }

  const { points, trendLine, yMin, safeYRange, plotWidth, plotHeight } = chartData;

  const yAxisLabels = Y_LABELS.map(value => {
    const y = CHART_PADDING.top + plotHeight - ((value - yMin) / safeYRange) * plotHeight;
    return { value, y };
  }).filter(l => isFinite(l.y));

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  const areaPath =
    points.length > 0
      ? `M ${points[0].x},${CHART_PADDING.top + plotHeight} ` +
        points.map(p => `L ${p.x},${p.y}`).join(' ') +
        ` L ${points[points.length - 1].x},${CHART_PADDING.top + plotHeight} Z`
      : '';

  const firstDateLabel = new Date(points[0].entry.date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const lastDateLabel = new Date(
    points[points.length - 1].entry.date + 'T00:00:00'
  ).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  let svgContent: React.ReactNode;
  try {
    svgContent = (
      <Svg width={chartWidth} height={CHART_HEIGHT}>
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
            opacity={0.3}
          />
        ))}

        {/* Gradient area under line */}
        {areaPath ? (
          <Path d={areaPath} fill={colors.secondary} opacity={0.1} />
        ) : null}

        {/* Trend line */}
        {trendLine && (
          <Line
            x1={trendLine.x1}
            y1={trendLine.y1}
            x2={trendLine.x2}
            y2={trendLine.y2}
            stroke={colors.secondary}
            strokeWidth="1.5"
            strokeDasharray="6,4"
            opacity={0.4}
          />
        )}

        {/* Consistency line */}
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={colors.secondary}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points — only for ≤60 points */}
        {points.length <= 60 &&
          points.map((point, index) => (
            <Circle
              key={`point-${index}`}
              cx={point.x}
              cy={point.y}
              r="4"
              fill={colors.secondary}
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
            {label.value}
          </SvgText>
        ))}

        {/* X-axis labels (first and last date) */}
        {points.length > 0 && (
          <>
            <SvgText
              x={points[0].x}
              y={CHART_HEIGHT - 8}
              fill={colors.textSecondary}
              fontSize="11"
              textAnchor="start"
            >
              {firstDateLabel}
            </SvgText>
            {points.length > 1 && (
              <SvgText
                x={points[points.length - 1].x}
                y={CHART_HEIGHT - 8}
                fill={colors.textSecondary}
                fontSize="11"
                textAnchor="end"
              >
                {lastDateLabel}
              </SvgText>
            )}
          </>
        )}
      </Svg>
    );
  } catch (err) {
    console.error('[ConsistencyChart] SVG render error:', err);
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
