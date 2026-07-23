
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '@/styles/commonStyles';
import { useTranslation } from 'react-i18next';

interface ExerciseChartProps {
  /** One entry per day in the window, in chronological order, including zero-minute days */
  dailyTotals: { date: string; minutes: number }[];
}

const CHART_HEIGHT = 200;
const CHART_PADDING = { top: 20, right: 10, bottom: 30, left: 40 };

// Same "nice number" rounding as WeightChart, so axis ticks land on clean values
function niceNum(range: number, round: boolean): number {
  if (range <= 0 || !isFinite(range)) return 1;
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / Math.pow(10, exponent);
  let niceFraction: number;
  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else {
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
  }
  return niceFraction * Math.pow(10, exponent);
}

export default function ExerciseChart({ dailyTotals }: ExerciseChartProps) {
  const { t, i18n } = useTranslation();
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.max(screenWidth - 80, 1);

  const hasAnyData = dailyTotals.some((d) => d.minutes > 0);

  const chartData = useMemo(() => {
    if (dailyTotals.length === 0) return null;

    const plotWidth = Math.max(chartWidth - CHART_PADDING.left - CHART_PADDING.right, 1);
    const plotHeight = Math.max(CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom, 1);

    const maxMinutes = Math.max(...dailyTotals.map((d) => d.minutes), 0);
    const yMax = maxMinutes > 0 ? niceNum(maxMinutes, false) : 30;

    const barCount = dailyTotals.length;
    const barSlot = plotWidth / barCount;
    const barWidth = Math.max(barSlot * 0.55, 2);

    const bars = dailyTotals.map((d, index) => {
      const barHeight = yMax > 0 ? (d.minutes / yMax) * plotHeight : 0;
      const x = CHART_PADDING.left + index * barSlot + (barSlot - barWidth) / 2;
      const y = CHART_PADDING.top + plotHeight - barHeight;
      return { x, y, width: barWidth, height: Math.max(barHeight, d.minutes > 0 ? 2 : 0), entry: d };
    });

    const tickStep = niceNum(yMax / 3, true);
    const yAxisLabels: { value: number; y: number }[] = [];
    for (let value = 0; value <= yMax; value += tickStep) {
      const y = CHART_PADDING.top + plotHeight - (value / yMax) * plotHeight;
      if (isFinite(y)) yAxisLabels.push({ value: Math.round(value), y });
    }

    return { bars, yAxisLabels, plotWidth, plotHeight };
  }, [dailyTotals, chartWidth]);

  if (!chartData || !hasAnyData) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t('logExercise.chartNoData')}</Text>
        <Text style={styles.emptySubtext}>{t('logExercise.chartNoDataSubtext')}</Text>
      </View>
    );
  }

  const { bars, yAxisLabels, plotWidth, plotHeight } = chartData;
  const locale = i18n.language === 'es' ? 'es-ES' : 'en-US';
  const firstLabel = new Date(dailyTotals[0].date + 'T00:00:00').toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  const lastLabel = new Date(dailyTotals[dailyTotals.length - 1].date + 'T00:00:00').toLocaleDateString(locale, { month: 'short', day: 'numeric' });

  let svgContent: React.ReactNode;
  try {
    svgContent = (
      <Svg width={chartWidth} height={CHART_HEIGHT}>
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

        {bars.map((bar, index) => (
          <Rect
            key={`bar-${index}`}
            x={bar.x}
            y={bar.y}
            width={bar.width}
            height={bar.height}
            rx={Math.min(bar.width / 2, 4)}
            fill={colors.primary}
            opacity={bar.entry.minutes > 0 ? 0.85 : 0}
          />
        ))}

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

        <SvgText
          x={CHART_PADDING.left}
          y={CHART_HEIGHT - 8}
          fill={colors.textSecondary}
          fontSize="11"
          textAnchor="start"
        >
          {firstLabel}
        </SvgText>
        <SvgText
          x={CHART_PADDING.left + plotWidth}
          y={CHART_HEIGHT - 8}
          fill={colors.textSecondary}
          fontSize="11"
          textAnchor="end"
        >
          {lastLabel}
        </SvgText>
      </Svg>
    );
  } catch (err) {
    console.error('[ExerciseChart] SVG render error:', err);
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
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
  },
  emptyText: {
    fontSize: 15,
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
