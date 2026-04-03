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

interface SensitivityChartProps {
  sensitivityCurve: SensitivityPoint[];
  currentPrice: number;
  impliedYears: number;
  currency: string;
}

const CustomTooltip = ({ active, payload, currency }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as SensitivityPoint;
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm text-sm">
      <div className="font-medium text-gray-700 mb-1">
        Forecast: {d.forecastYears} years
      </div>
      <div className="text-gray-500">
        Intrinsic Value:{' '}
        <span className="font-mono font-semibold text-gray-900">
          {formatCurrency(d.intrinsicValue, currency)}
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
  if (!sensitivityCurve.length) {
    return (
      <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
        Insufficient data for sensitivity analysis
      </div>
    );
  }

  const maxVal = Math.max(...sensitivityCurve.map((p) => p.intrinsicValue));
  const yDomain: [number, number] = [0, Math.max(maxVal * 1.1, currentPrice * 1.5)];
  const xDomain: [number, number] = [0, 25];

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart
          data={sensitivityCurve}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="intrinsicGradientYears" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#9ca3af" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal vertical={false} />
          <XAxis
            dataKey="forecastYears"
            type="number"
            domain={xDomain}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            label={{
              value: 'Forecast Period (Years)',
              position: 'insideBottom',
              offset: -2,
              fill: '#9ca3af',
              fontSize: 11,
            }}
          />
          <YAxis
            domain={yDomain}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${Math.round(v)}`}
            width={60}
          />
          <Tooltip content={<CustomTooltip currency={currency} />} />

          {/* Current price horizontal line */}
          <ReferenceLine
            y={currentPrice}
            stroke="#d97706"
            strokeDasharray="6 3"
            strokeWidth={1.5}
            label={{
              value: `Market Price $${currentPrice.toFixed(0)}`,
              position: 'insideTopRight',
              fill: '#d97706',
              fontSize: 11,
              fontWeight: 600,
            }}
          />

          {/* Implied years vertical line */}
          {isFinite(impliedYears) && impliedYears >= 0 && impliedYears <= 25 && (
            <ReferenceLine
              x={impliedYears}
              stroke="#6b7280"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `PIE: ${impliedYears.toFixed(1)}Y`,
                position: 'insideTopLeft',
                fill: '#6b7280',
                fontSize: 11,
                fontWeight: 600,
              }}
            />
          )}

          {/* 10-year reference */}
          <ReferenceLine
            x={10}
            stroke="#d1d5db"
            strokeDasharray="2 4"
            strokeWidth={1}
            label={{
              value: '10Y',
              position: 'insideBottomRight',
              fill: '#9ca3af',
              fontSize: 10,
            }}
          />

          <Area
            type="monotone"
            dataKey="intrinsicValue"
            stroke="#374151"
            strokeWidth={2}
            fill="url(#intrinsicGradientYears)"
            dot={false}
            activeDot={{ r: 4, fill: '#374151' }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-400">
        <LegendItem color="#374151" label="Intrinsic Value / Share" solid />
        <LegendItem color="#d97706" label="Current Market Price" />
        <LegendItem color="#6b7280" label="Price-Implied Expectations (PIE)" />
        <LegendItem color="#d1d5db" label="10-Year Reference" />
      </div>

      {/* Explanation */}
      <p className="text-xs text-gray-400 mt-3 leading-relaxed">
        The curve rises as you extend the forecast period (more years of above-WACC growth =
        higher value). Where the curve crosses the current market price line is the
        <span className="text-gray-700 font-medium"> PIE </span>
        — the number of years of growth the market has priced in.
      </p>
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
      className="w-5 h-0.5"
      style={{
        background: solid ? color : 'none',
        borderTop: solid ? undefined : `2px dashed ${color}`,
      }}
    />
    <span>{label}</span>
  </div>
);

export default SensitivityChart;
