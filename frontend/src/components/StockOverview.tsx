import React from 'react';
import { ArrowUpRight, ArrowDownRight, Globe, Building2, BarChart2 } from 'lucide-react';
import { StockFinancials } from '../types';
import { formatCurrency, formatLargeNumber, formatPercent } from '../utils/format';
import { useLanguage } from '../contexts/LanguageContext';

interface StockOverviewProps {
  data: StockFinancials;
}

const StockOverview: React.FC<StockOverviewProps> = ({ data }) => {
  const { t } = useLanguage();
  const isPositive = data.priceChangePercent >= 0;

  return (
    <div className="card p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Company Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-2xl font-bold text-gray-900">{data.ticker}</span>
            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 rounded border border-gray-200">
              {data.exchange}
            </span>
            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 rounded border border-gray-200">
              {data.currency}
            </span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-3">{data.name}</h1>
          <div className="flex flex-wrap gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-gray-400" />
              {data.sector}
            </span>
            <span className="text-gray-300">·</span>
            <span className="flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-gray-400" />
              {data.industry}
            </span>
            <span className="text-gray-300">·</span>
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-gray-400" />
              {data.country}
            </span>
          </div>
        </div>

        {/* Price Box */}
        <div className="card-section px-6 py-4 text-right min-w-[180px]">
          <div className="text-3xl font-mono font-bold text-gray-900">
            {formatCurrency(data.price, data.currency)}
          </div>
          <div
            className={`flex items-center justify-end gap-1 mt-1 text-sm font-medium ${
              isPositive ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span>{formatCurrency(Math.abs(data.priceChange), data.currency)}</span>
            <span>({formatPercent(Math.abs(data.priceChangePercent))})</span>
          </div>
          {data.targetMeanPrice && (
            <div className="mt-2 text-xs text-gray-400">
              {t.metrics.analystTarget}:{' '}
              <span className="text-gray-600 font-medium">
                {formatCurrency(data.targetMeanPrice, data.currency)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="mt-5 pt-5 border-t border-gray-200 grid grid-cols-3 sm:grid-cols-6 gap-px bg-gray-200 rounded-lg overflow-hidden">
        <MetricCell label={t.metrics.marketCap}       value={formatLargeNumber(data.marketCap)} />
        <MetricCell label={t.metrics.enterpriseValue} value={formatLargeNumber(data.enterpriseValue)} />
        <MetricCell
          label={t.metrics.netDebt}
          value={formatLargeNumber(data.netDebt)}
          highlight={data.netDebt < 0 ? 'green' : data.netDebt > data.marketCap * 0.5 ? 'red' : undefined}
        />
        <MetricCell
          label={t.metrics.ttmFCF}
          value={formatLargeNumber(data.freeCashFlow)}
          highlight={data.freeCashFlow < 0 ? 'red' : 'green'}
        />
        <MetricCell
          label={t.metrics.opMargin}
          value={formatPercent(data.operatingMargin)}
          highlight={data.operatingMargin > 0.2 ? 'green' : data.operatingMargin < 0 ? 'red' : undefined}
        />
        <MetricCell
          label={t.metrics.beta}
          value={data.beta.toFixed(2)}
          highlight={data.beta > 1.5 ? 'red' : data.beta < 0.8 ? 'green' : undefined}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-200 rounded-lg overflow-hidden">
        <MetricCell
          label={t.metrics.trailingPE}
          value={data.trailingPE !== null ? data.trailingPE.toFixed(1) + 'x' : '—'}
        />
        <MetricCell
          label={t.metrics.forwardPE}
          value={data.forwardPE !== null ? data.forwardPE.toFixed(1) + 'x' : '—'}
        />
        <MetricCell
          label={t.metrics.pbRatio}
          value={data.priceToBook !== null ? data.priceToBook.toFixed(2) + 'x' : '—'}
        />
        <MetricCell
          label={t.metrics.roe}
          value={data.returnOnEquity !== null ? formatPercent(data.returnOnEquity) : '—'}
          highlight={
            data.returnOnEquity !== null
              ? data.returnOnEquity > 0.15
                ? 'green'
                : data.returnOnEquity < 0
                ? 'red'
                : undefined
              : undefined
          }
        />
      </div>
    </div>
  );
};

interface MetricCellProps {
  label: string;
  value: string;
  highlight?: 'green' | 'red';
}

const MetricCell: React.FC<MetricCellProps> = ({ label, value, highlight }) => {
  const valueColor =
    highlight === 'green'
      ? 'text-emerald-600'
      : highlight === 'red'
      ? 'text-red-600'
      : 'text-gray-900';
  return (
    <div className="bg-white px-3 py-3 flex flex-col items-center justify-center text-center">
      <div className="metric-label mb-1 w-full truncate text-center">{label}</div>
      <div className={`metric-value text-sm font-mono font-semibold ${valueColor}`}>{value}</div>
    </div>
  );
};

export default StockOverview;
