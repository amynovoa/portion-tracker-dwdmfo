import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '@/styles/commonStyles';
import { useTranslation } from 'react-i18next';

interface StepsChartProps {
  /** One entry per day in the window, chronological (oldest → newest), including zero days */
  dailyTotals: { date: string; steps: number }[];
  goalSteps?: number;
}

const CHART_HEIGHT = 200;
const CHART_PADDING = { top: 20, right: 10, bottom: 30, left: 44 };

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

function formatAxisValue(value: number): string {
  if (value >= 1000) {
    const k = value / 1000;
    return Number.isInteger(k) ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return String(Math.round(value));
}

export default function StepsChart({ dailyTotals, goalSteps }: StepsChartProps) {
  const { t, i18n } = useTranslation();
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.max(screenWidth - 80, 1);

  const hasAnyData = dailyTotals.some((d) => d.steps > 0);

  const chartData = useMemo(() => {
    if (dailyTotals.length === 0) return null;

    const plotWidth = Math.max(chartWidth - CHART_PADDING.left - CHART_PADDING.right, 1);
    const plotHeight = Math.max(CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom, 1);

    const maxSteps = Math.max(
      ...dailyTotals.map((d) => d.steps),
      typeof goalSteps === 'number' && goalSteps > 0 ? goalSteps : 0,
      0
    );
    const yMax = maxSteps > 0 ? niceNum(maxSteps, false) : 1000;

    const barCount = dailyTotals.length;
    const barSlot = plotWidth / barCount;
    const barWidth = Math.max(barSlot * 0.55, 2);

    const bars = dailyTotals.map((d, index) => {
      const barHeight = yMax > 0 ? (d.steps / yMax) * plotHeight : 0;
      const x = CHART_PADDING.left + index * barSlot + (barSlot - barWidth) / 2;
      const y = CHART_PADDING.top + plotHeight - barHeight;
      return {
        x,
        y,
        width: barWidth,
        height: Math.max(barHeight, d.steps > 0 ? 2 : 0),
        entry: d,
      };
    });

    const tickStep = niceNum(yMax / 3, true);
    const yAxisLabels: { value: number; y: number }[] = [];
    for (let value = 0; value <= yMax; value += tickStep) {
      const y = CHART_PADDING.top + plotHeight - (value / yMax) * plotHeight;
      if (isFinite(y)) yAxisLabels.push({ value: Math.round(value), y });
    }

    let goalY: number | null = null;
    if (typeof goalSteps === 'number' && goalSteps > 0 && yMax > 0) {
      goalY = CHART_PADDING.top + plotHeight - (goalSteps / yMax) * plotHeight;
      if (!isFinite(goalY)) goalY = null;
    }

    return { bars, yAxisLabels, plotWidth, plotHeight, goalY };
  }, [dailyTotals, chartWidth, goalSteps]);

  if (!chartData || !hasAnyData) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t('steps.chartNoData')}</Text>
        <Text style={styles.emptySubtext}>{t('steps.chartNoDataSubtext')}</Text>
      </View>
    );
  }

  const { bars, yAxisLabels, plotWidth, plotHeight, goalY } = chartData;
  const locale = i18n.language === 'es' ? 'es-ES' : 'en-US';
  const firstLabel = new Date(dailyTotals[0].date + 'T00:00:00').toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  });
  const lastLabel = new Date(
    dailyTotals[dailyTotals.length - 1].date + 'T00:00:00'
  ).toLocaleDateString(locale, { month: 'short', day: 'numeric' });

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

        {goalY !== null && (
          <Line
            x1={CHART_PADDING.left}
            y1={goalY}
            x2={CHART_PADDING.left + plotWidth}
            y2={goalY}
            stroke={colors.secondary}
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity={0.8}
          />
        )}

        {bars.map((bar, index) => (
          <Rect
            key={`bar-${index}`}
            x={bar.x}
            y={bar.y}
            width={bar.width}
            height={bar.height}
            rx={Math.min(bar.width / 2, 4)}
            fill={colors.primary}
            opacity={bar.entry.steps > 0 ? 0.85 : 0}
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
            {formatAxisValue(label.value)}
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
    console.error('[StepsChart] SVG render error:', err);
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
