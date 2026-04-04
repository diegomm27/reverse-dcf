import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { ReverseFCFResult } from '../types';
import { formatLargeNumber, formatPercent, formatCurrency } from '../utils/format';
import { useLanguage } from '../contexts/LanguageContext';

interface RecommendationCardProps {
  result: ReverseFCFResult;
  currentPrice: number;
  currency: string;
}

const CONFIG = {
  'STRONG BUY': {
    badge: 'status-badge status-badge-positive',
    text: 'status-positive',
    panel: 'border-[color:rgba(5,150,105,0.18)] bg-[color:rgba(5,150,105,0.05)]',
    icon: TrendingUp,
  },
  BUY: {
    badge: 'status-badge status-badge-positive-soft',
    text: 'status-positive',
    panel: 'border-[color:rgba(5,150,105,0.18)] bg-[color:rgba(5,150,105,0.04)]',
    icon: TrendingUp,
  },
  HOLD: {
    badge: 'status-badge status-badge-warning',
    text: 'status-warning',
    panel: 'border-[color:rgba(217,119,6,0.18)] bg-[color:rgba(217,119,6,0.05)]',
    icon: Minus,
  },
  SELL: {
    badge: 'status-badge status-badge-caution',
    text: 'status-caution',
    panel: 'border-[color:rgba(234,88,12,0.18)] bg-[color:rgba(234,88,12,0.05)]',
    icon: TrendingDown,
  },
  'STRONG SELL': {
    badge: 'status-badge status-badge-negative',
    text: 'status-negative',
    panel: 'border-[color:rgba(220,38,38,0.18)] bg-[color:rgba(220,38,38,0.05)]',
    icon: TrendingDown,
  },
  'N/A': {
    badge: 'status-badge status-badge-neutral',
    text: 'status-neutral',
    panel: 'border-[color:var(--border)] bg-[color:var(--surface-muted)]',
    icon: AlertCircle,
  },
};

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  result,
  currentPrice,
  currency,
}) => {
  const { t } = useLanguage();
  const rec = result.recommendation;
  const cfg = CONFIG[rec];
  const Icon = cfg.icon;
  const verdictLabel =
    rec === 'STRONG BUY'
      ? t.recommendation.scaleZones.strongBuy
      : rec === 'BUY'
      ? t.recommendation.scaleZones.buy
      : rec === 'HOLD'
      ? t.recommendation.scaleZones.hold
      : rec === 'SELL'
      ? t.recommendation.scaleZones.sell
      : rec === 'STRONG SELL'
      ? t.recommendation.scaleZones.strongSell
      : rec;

  const impliedYears = result.impliedForecastYears;
  const pieExceedsMax =
    isFinite(impliedYears) &&
    impliedYears >= 50 &&
    result.impliedBreakdown.shareholderValue < result.marketShareholderValue;
  const steadyStateGap =
    isFinite(result.steadyStateValue) && result.steadyStateValue !== 0
      ? (currentPrice - result.steadyStateValue) / Math.abs(result.steadyStateValue)
      : NaN;
  const belowSteadyState = isFinite(steadyStateGap) ? steadyStateGap <= 0 : false;

  return (
    <div className="card overflow-hidden">
      <div className="relative p-5 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="section-title">
            <Icon className={`h-4 w-4 ${cfg.text}`} />
            {t.recommendation.verdictTitle}
          </span>
          <span className={cfg.badge}>
            {verdictLabel}
          </span>
        </div>

        <p className="mb-4 text-xs leading-6 text-[color:var(--muted)]">
          {t.recommendation.descriptions[rec]}
        </p>

        <div className={`mb-4 rounded-2xl border p-4 text-center ${cfg.panel}`}>
          <div className="mb-2 flex items-center justify-center gap-1.5">
            <Clock className={`h-3.5 w-3.5 ${cfg.text}`} />
            <span className="label">{t.recommendation.pieLabel}</span>
          </div>
          <div className={`font-mono text-5xl font-extrabold tracking-tight ${cfg.text}`}>
            {result.isNegativeNOPAT
              ? 'N/A'
              : pieExceedsMax
              ? '50+'
              : isFinite(impliedYears)
              ? impliedYears.toFixed(1)
              : 'N/A'}
          </div>
          <div className={`mt-0.5 text-xs font-medium ${cfg.text} opacity-60`}>
            {!result.isNegativeNOPAT && t.fcfAnalysis.yearsLabel.trim()}
          </div>
          <div className="mx-auto mt-2 max-w-xs text-[11px] leading-5 text-[color:var(--muted)]">
            {result.isNegativeNOPAT
              ? t.recommendation.pieNegative
              : pieExceedsMax
              ? t.recommendation.pieSubLong
              : t.recommendation.pieSub}
          </div>
        </div>

        {isFinite(impliedYears) && !result.isNegativeNOPAT && (
          <ImpliedYearsBar years={impliedYears} />
        )}

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <InsightMetric
            label={t.recommendation.steadyState}
            value={
              isFinite(result.steadyStateValue)
                ? formatCurrency(result.steadyStateValue, currency)
                : 'N/A'
            }
            sub={t.recommendation.steadySub}
            color={
              isFinite(result.steadyStateValue) && result.steadyStateValue >= currentPrice
                ? 'status-positive'
                : 'status-negative'
            }
          />
          <InsightMetric
            label={t.recommendation.priceVsSteadyState}
            value={isFinite(steadyStateGap) ? formatPercent(steadyStateGap) : 'N/A'}
            sub={t.recommendation.priceVsSteadySub(belowSteadyState)}
            color={
              !isFinite(steadyStateGap)
                ? 'text-[color:var(--muted)]'
                : belowSteadyState
                ? 'status-positive'
                : 'status-negative'
            }
          />
          <InsightMetric
            label={t.recommendation.nonOperatingAssets}
            value={formatLargeNumber(result.totalNonOperatingAssets, currency)}
            sub={t.recommendation.nonOperatingSub}
            color="text-[color:var(--text)]"
          />
        </div>

        <div className="data-strip mt-3">
          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            <span>
              {t.recommendation.fcfYield}:{' '}
              <span className="font-mono text-[color:var(--text)]">{formatPercent(result.fcfYield)}</span>
            </span>
            <span>
              {t.recommendation.currentPrice}:{' '}
              <span className="font-mono text-[color:var(--text)]">
                {formatCurrency(currentPrice, currency)}
              </span>
            </span>
            <span>
              {t.recommendation.marketShareholderValue}:{' '}
              <span className="font-mono text-[color:var(--text)]">
                {formatLargeNumber(result.marketShareholderValue, currency)}
              </span>
            </span>
            {result.isNegativeNOPAT && (
              <span className="status-warning flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {t.recommendation.negativeNopatWarning}
              </span>
            )}
          </div>
        </div>

        <div className="info-panel mt-3">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--accent)]" />
          <p className="text-xs leading-5 text-[color:var(--muted)]">
            <span className="font-semibold text-[color:var(--text)]">{t.recommendation.methodologyBold}</span>{' '}
            {t.recommendation.methodologyText}
          </p>
        </div>
      </div>
    </div>
  );
};

interface InsightMetricProps {
  label: string;
  value: string;
  sub: string;
  color: string;
}

const InsightMetric: React.FC<InsightMetricProps> = ({ label, value, sub, color }) => (
  <div className="card-section p-3 text-center">
    <div className="metric-label mb-1.5">{label}</div>
    <div className={`font-mono text-base font-bold ${color}`}>{value}</div>
    <div className="mt-1 text-[10px] leading-4 text-[color:var(--muted-soft)]">{sub}</div>
  </div>
);

interface ImpliedYearsBarProps {
  years: number;
}

const ImpliedYearsBar: React.FC<ImpliedYearsBarProps> = ({ years }) => {
  const { t } = useLanguage();
  const maxScale = 30;
  const pct = Math.min(99, Math.max(1, (years / maxScale) * 100));
  const zones = t.recommendation.scaleZones;
  const zoneWidths = [3, 4, 8, 10];

  const zoneLabels = [
    { label: zones.strongBuy, year: 0, color: 'status-positive' },
    { label: zones.buy, year: 3, color: 'status-positive' },
    { label: zones.hold, year: 7, color: 'status-warning' },
    { label: zones.sell, year: 15, color: 'status-caution' },
    { label: zones.strongSell, year: 25, color: 'status-negative' },
  ];

  return (
    <div className="soft-panel p-3">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="label">{t.recommendation.scaleLabel}</span>
        <span className="font-mono text-xs font-semibold text-[color:var(--text)]">
          {years.toFixed(1)}
          {t.recommendation.yearShort}
        </span>
      </div>

      <div className="mb-1.5 flex text-[9px] font-bold uppercase tracking-[0.1em]">
        {zoneLabels.map((zone, index) => (
          <span
            key={zone.label}
            className={`${zone.color} ${index === zoneLabels.length - 1 ? 'flex-1 text-right' : ''}`}
            style={
              index === zoneLabels.length - 1
                ? undefined
                : { width: `${(zoneWidths[index] / maxScale) * 100}%` }
            }
          >
            {zone.label}
          </span>
        ))}
      </div>

      <div className="relative h-2 rounded-full">
        <div
          className="absolute inset-0 rounded-full opacity-25"
          style={{
            background: 'linear-gradient(to right, #059669, #10b981, #d97706, #ea580c, #dc2626)',
          }}
        />
        <div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(to right, #059669, #10b981, #d97706, #ea580c, #dc2626)',
          }}
        />
        <div
          className="absolute top-1/2 h-4 w-2.5 rounded-full border border-white shadow-[0_0_12px_rgba(0,176,238,0.18)]"
          style={{
            left: `${pct}%`,
            transform: 'translate(-50%, -50%)',
            background: 'var(--text)',
          }}
        />
      </div>

      <div className="mt-1.5 flex justify-between font-mono text-[9px] text-[color:var(--muted-soft)]">
        {zoneLabels.map((zone) => (
          <span key={zone.year}>
            {zone.year}
            {t.recommendation.yearShort}
          </span>
        ))}
        <span>
          30{t.recommendation.yearShort}+
        </span>
      </div>
    </div>
  );
};

export default RecommendationCard;
