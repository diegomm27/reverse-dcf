import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { SensitivityPoint } from '../../types';
import { formatCurrency } from '../../utils/format';
import { useLanguage } from '../../contexts/LanguageContext';

const CHART_COLORS = {
  area: '#29373a',
  areaFill: '#00b0ee',
  market: '#d97706',
  pie: '#728197',
  text: '#111111',
  muted: '#728197',
  grid: 'rgba(41, 55, 58, 0.14)',
};

interface SensitivityChartProps {
  sensitivityCurve: SensitivityPoint[];
  currentPrice: number;
  impliedYears: number;
  currency: string;
}

const CustomTooltip = ({
  active,
  payload,
  currency,
  forecastLabel,
  valueLabel,
}: any) => {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as SensitivityPoint;

  return (
    <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--surface-strong)] p-2.5 shadow-[var(--shadow-lg)]">
      <div className="mb-0.5 text-xs font-semibold text-[color:var(--text)]">
        {forecastLabel}: {point.forecastYears}
      </div>
      <div className="text-xs text-[color:var(--muted)]">
        {valueLabel}:{' '}
        <span className="font-mono font-semibold text-[color:var(--text)]">
          {formatCurrency(point.intrinsicValue, currency)}
        </span>
      </div>
    </div>
  );
};

const SensitivityChart: React.FC<SensitivityChartProps> = ({
  sensitivityCurve,
  currentPrice,
  impliedYears,
  currency,
}) => {
  const { t } = useLanguage();
  const fa = t.fcfAnalysis;

  if (!sensitivityCurve.length) {
    return (
      <div className="soft-panel flex h-48 items-center justify-center text-xs text-[color:var(--muted)]">
        {fa.chartUnavailable}
      </div>
    );
  }

  const maxVal = Math.max(...sensitivityCurve.map((point) => point.intrinsicValue));
  const maxYears = sensitivityCurve[sensitivityCurve.length - 1]?.forecastYears ?? 50;
  const xDomain: [number, number] = [0, maxYears];
  const yDomain: [number, number] = [0, Math.max(maxVal * 1.1, currentPrice * 1.3)];
  const pieWithinChart = isFinite(impliedYears) && impliedYears >= 0 && impliedYears <= maxYears;

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={sensitivityCurve} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
          <defs>
            <linearGradient id="intrinsicGradientYears" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.areaFill} stopOpacity={0.18} />
              <stop offset="95%" stopColor={CHART_COLORS.areaFill} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal vertical={false} />
          <XAxis
            dataKey="forecastYears"
            type="number"
            domain={xDomain}
            tick={{ fill: CHART_COLORS.muted, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            label={{
              value: fa.chartForecastLabel,
              position: 'insideBottom',
              offset: -2,
              fill: CHART_COLORS.muted,
              fontSize: 10,
            }}
          />
          <YAxis
            domain={yDomain}
            tick={{ fill: CHART_COLORS.muted, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${Math.round(value)}`}
            width={55}
          />
          <Tooltip
            content={
              <CustomTooltip
                currency={currency}
                forecastLabel={fa.chartForecastLabel}
                valueLabel={fa.chartValueLabel}
              />
            }
          />

          <ReferenceLine
            y={currentPrice}
            stroke={CHART_COLORS.market}
            strokeDasharray="6 3"
            strokeWidth={1.5}
            label={{
              value: `${fa.marketPrice} ${formatCurrency(currentPrice, currency)}`,
              position: 'insideTopRight',
              fill: CHART_COLORS.market,
              fontSize: 10,
              fontWeight: 600,
            }}
          />

          {pieWithinChart && (
            <ReferenceLine
              x={impliedYears}
              stroke={CHART_COLORS.pie}
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `PIE ${impliedYears.toFixed(1)}`,
                position: 'insideTopLeft',
                fill: CHART_COLORS.pie,
                fontSize: 10,
                fontWeight: 600,
              }}
            />
          )}

          <Area
            type="monotone"
            dataKey="intrinsicValue"
            stroke={CHART_COLORS.area}
            strokeWidth={2}
            fill="url(#intrinsicGradientYears)"
            dot={false}
            activeDot={{
              r: 3.5,
              fill: CHART_COLORS.areaFill,
              stroke: CHART_COLORS.text,
              strokeWidth: 1.5,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-[color:var(--muted)]">
        <LegendItem color={CHART_COLORS.area} label={fa.chartLegendValue} solid />
        <LegendItem color={CHART_COLORS.market} label={fa.chartLegendMarket} />
        <LegendItem color={CHART_COLORS.pie} label={fa.chartLegendPie} />
      </div>

      <p className="mt-2 text-xs leading-5 text-[color:var(--muted)]">{fa.chartSummary}</p>
    </div>
  );
};

const LegendItem: React.FC<{ color: string; label: string; solid?: boolean }> = ({
  color,
  label,
  solid,
}) => (
  <div className="flex items-center gap-1.5">
    <div
      className="h-0.5 w-4"
      style={{
        background: solid ? color : 'none',
        borderTop: solid ? undefined : `1.5px dashed ${color}`,
      }}
    />
    <span>{label}</span>
  </div>
);

export default SensitivityChart;
