import React from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Building2,
  BarChart2,
  AlertTriangle,
} from 'lucide-react';
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
    <div className="card p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-2xl font-bold tracking-tight">
              {data.ticker}
            </span>
            <span className="accent-chip">{data.exchange}</span>
            <span className="accent-chip">{data.currency}</span>
            {data.reportingCurrency !== data.currency && (
              <span className="accent-chip">{`FS ${data.reportingCurrency}->${data.currency}`}</span>
            )}
          </div>

          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            {data.name}
          </h1>

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-[color:var(--muted)]">
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 text-[color:var(--accent)]" />
              {data.sector}
            </span>
            <span className="text-[color:var(--muted-soft)]">/</span>
            <span className="flex items-center gap-1">
              <BarChart2 className="h-3.5 w-3.5 text-[color:var(--accent)]" />
              {data.industry}
            </span>
            <span className="text-[color:var(--muted-soft)]">/</span>
            <span className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5 text-[color:var(--accent)]" />
              {data.country}
            </span>
          </div>
        </div>

        <div className="card-section w-full px-5 py-4 text-left sm:text-right lg:w-auto lg:min-w-[220px]">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--accent)]">
            {t.recommendation.currentPrice}
          </div>
          <div className="mt-1.5 text-2xl font-bold tracking-tight">
            {formatCurrency(data.price, data.currency)}
          </div>
          <div
            className={`mt-1.5 flex items-center gap-1 text-xs font-semibold sm:justify-end ${
              isPositive ? 'status-positive' : 'status-negative'
            }`}
          >
            {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            <span>{formatCurrency(Math.abs(data.priceChange), data.currency)}</span>
            <span>({formatPercent(Math.abs(data.priceChangePercent))})</span>
          </div>
          {data.targetMeanPrice && (
            <div className="mt-2 text-[11px] text-[color:var(--muted-soft)]">
              {t.metrics.analystTarget}:{' '}
              <span className="font-medium text-[color:var(--muted)]">
                {formatCurrency(data.targetMeanPrice, data.currency)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
        <MetricCell label={t.metrics.marketCap} value={formatLargeNumber(data.marketCap, data.currency)} />
        <MetricCell label={t.metrics.enterpriseValue} value={formatLargeNumber(data.enterpriseValue, data.currency)} />
        <MetricCell
          label={t.metrics.netDebt}
          value={formatLargeNumber(data.netDebt, data.currency)}
          highlight={data.netDebt < 0 ? 'green' : data.netDebt > data.marketCap * 0.5 ? 'red' : undefined}
        />
        <MetricCell
          label={t.metrics.ttmFCF}
          value={formatLargeNumber(data.freeCashFlow, data.currency)}
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
        <MetricCell
          label={t.metrics.trailingPE}
          value={data.trailingPE !== null ? `${data.trailingPE.toFixed(1)}x` : 'N/A'}
        />
        <MetricCell
          label={t.metrics.forwardPE}
          value={data.forwardPE !== null ? `${data.forwardPE.toFixed(1)}x` : 'N/A'}
        />
        <MetricCell
          label={t.metrics.pbRatio}
          value={data.priceToBook !== null ? `${data.priceToBook.toFixed(2)}x` : 'N/A'}
        />
        <MetricCell
          label={t.metrics.roe}
          value={data.returnOnEquity !== null ? formatPercent(data.returnOnEquity) : 'N/A'}
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

      {data.valuationModelProfile === 'financialLike' && (
        <div className="warning-panel mt-4">
          <AlertTriangle className="status-warning mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <div className="mb-1 text-xs font-semibold text-[color:var(--text)]">
              {t.warnings.financialLikeTitle}
            </div>
            <p className="text-xs leading-5 text-[color:var(--muted)]">
              {t.warnings.financialLikeBody}
            </p>
          </div>
        </div>
      )}
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
      ? 'status-positive'
      : highlight === 'red'
      ? 'status-negative'
      : 'text-[color:var(--text)]';

  return (
    <div className="card-section p-3 text-center">
      <div className="metric-label mb-1.5">{label}</div>
      <div className={`metric-value text-xs ${valueColor}`}>{value}</div>
    </div>
  );
};

export default StockOverview;
