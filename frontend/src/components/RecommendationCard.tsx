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
import { formatPercent, formatCurrency } from '../utils/format';
import { useLanguage } from '../contexts/LanguageContext';

interface RecommendationCardProps {
  result: ReverseFCFResult;
  currentPrice: number;
  currency: string;
}

const CONFIG = {
  'STRONG BUY': {
    badge: 'bg-emerald-600 text-white',
    text: 'text-emerald-600',
    border: 'border-emerald-200',
    bg: 'bg-emerald-50',
    icon: TrendingUp,
  },
  BUY: {
    badge: 'bg-green-600 text-white',
    text: 'text-green-600',
    border: 'border-green-200',
    bg: 'bg-green-50',
    icon: TrendingUp,
  },
  HOLD: {
    badge: 'bg-amber-500 text-white',
    text: 'text-amber-600',
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    icon: Minus,
  },
  SELL: {
    badge: 'bg-orange-500 text-white',
    text: 'text-orange-600',
    border: 'border-orange-200',
    bg: 'bg-orange-50',
    icon: TrendingDown,
  },
  'STRONG SELL': {
    badge: 'bg-red-600 text-white',
    text: 'text-red-600',
    border: 'border-red-200',
    bg: 'bg-red-50',
    icon: TrendingDown,
  },
  'N/A': {
    badge: 'bg-gray-500 text-white',
    text: 'text-gray-500',
    border: 'border-gray-200',
    bg: 'bg-gray-50',
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

  const impliedYears = result.impliedForecastYears;
  const isUndervalued = result.marginOfSafety > 0;

  return (
    <div className={`card border ${cfg.border} overflow-hidden`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <span className="section-title">
            <Icon className={`w-5 h-5 ${cfg.text}`} />
            {t.recommendation.verdictTitle}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold uppercase tracking-wider ${cfg.badge}`}
          >
            {rec}
          </span>
        </div>

        {/* Main Insight */}
        <p className="text-gray-500 text-sm leading-relaxed mb-5">
          {t.recommendation.descriptions[rec]}
        </p>

        {/* Central PIE Metric */}
        <div className={`card-section p-5 mb-5 text-center border ${cfg.border}`}>
          <div className="flex items-center justify-center gap-2 mb-3">
            <Clock className={`w-4 h-4 ${cfg.text}`} />
            <span className="label">{t.recommendation.pieLabel}</span>
          </div>
          <div className={`font-mono text-6xl font-extrabold tracking-tight ${cfg.text}`}>
            {result.isNegativeNOPAT
              ? 'N/A'
              : isFinite(impliedYears)
              ? impliedYears.toFixed(1)
              : '50+'}
          </div>
          <div className={`text-sm font-medium mt-1 ${cfg.text} opacity-70`}>
            {!result.isNegativeNOPAT && 'years'}
          </div>
          <div className="text-gray-400 text-xs mt-2 max-w-xs mx-auto">
            {result.isNegativeNOPAT
              ? t.recommendation.pieNegative
              : isFinite(impliedYears) && impliedYears <= 50
              ? t.recommendation.pieSub
              : t.recommendation.pieSubLong}
          </div>
        </div>

        {/* Implied Years Bar */}
        {isFinite(impliedYears) && !result.isNegativeNOPAT && (
          <ImpliedYearsBar years={impliedYears} scaleLabel={t.recommendation.scaleLabel} />
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <InsightMetric
            label={t.recommendation.intrinsicValue}
            value={result.intrinsicValue10Y > 0 ? formatCurrency(result.intrinsicValue10Y, currency) : 'N/A'}
            sub={t.recommendation.intrinsicSub}
            color={isUndervalued ? 'text-emerald-600' : 'text-red-600'}
          />
          <InsightMetric
            label={t.recommendation.marginOfSafety}
            value={isFinite(result.marginOfSafety) ? `${isUndervalued ? '+' : ''}${formatPercent(result.marginOfSafety)}` : 'N/A'}
            sub={t.recommendation.mosSub(isUndervalued)}
            color={isUndervalued ? 'text-emerald-600' : 'text-red-600'}
          />
          <InsightMetric
            label={t.recommendation.steadyState}
            value={result.steadyStateValue > 0 ? formatCurrency(result.steadyStateValue, currency) : 'N/A'}
            sub={t.recommendation.steadySub}
            color="text-gray-700"
          />
        </div>

        {/* Supporting info */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-400">
          <span>
            {t.recommendation.fcfYield}:{' '}
            <span className="text-gray-700 font-mono">{formatPercent(result.fcfYield)}</span>
          </span>
          <span>
            {t.recommendation.currentPrice}:{' '}
            <span className="text-gray-700 font-mono">{formatCurrency(currentPrice, currency)}</span>
          </span>
          {result.isNegativeNOPAT && (
            <span className="flex items-center gap-1 text-amber-600">
              <AlertTriangle className="w-3.5 h-3.5" />
              {t.recommendation.negativeNopatWarning}
            </span>
          )}
        </div>

        {/* Methodology Note */}
        <div className="mt-4 flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
          <p className="text-xs text-gray-400 leading-relaxed">
            <span className="text-gray-600 font-medium">{t.recommendation.methodologyBold}</span>{' '}
            {t.recommendation.methodologyText}
          </p>
        </div>
      </div>
    </div>
  );
};

// Sub-components

interface InsightMetricProps {
  label: string;
  value: string;
  sub: string;
  color: string;
}

const InsightMetric: React.FC<InsightMetricProps> = ({ label, value, sub, color }) => (
  <div className="card-section p-3 text-center">
    <div className="metric-label mb-1">{label}</div>
    <div className={`font-mono font-bold text-base ${color}`}>{value}</div>
    <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
  </div>
);

interface ImpliedYearsBarProps {
  years: number;
  scaleLabel: string;
}

const ImpliedYearsBar: React.FC<ImpliedYearsBarProps> = ({ years, scaleLabel }) => {
  const maxScale = 30;
  const pct = Math.min(99, Math.max(1, (years / maxScale) * 100));

  const zones = [
    { label: 'Strong Buy', year: 0, color: 'text-emerald-600' },
    { label: 'Buy', year: 3, color: 'text-green-600' },
    { label: 'Hold', year: 7, color: 'text-amber-600' },
    { label: 'Sell', year: 15, color: 'text-orange-600' },
    { label: 'Strong Sell', year: 25, color: 'text-red-600' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">{scaleLabel}</span>
        <span className="text-sm font-mono font-semibold text-gray-700">{years.toFixed(1)} yrs</span>
      </div>

      {/* Zone labels */}
      <div className="relative mb-1">
        <div className="flex text-xs font-medium" style={{ fontSize: '10px' }}>
          <span className="text-emerald-600" style={{ width: `${(3 / maxScale) * 100}%` }}>Strong Buy</span>
          <span className="text-green-600" style={{ width: `${(4 / maxScale) * 100}%` }}>Buy</span>
          <span className="text-amber-600" style={{ width: `${(8 / maxScale) * 100}%` }}>Hold</span>
          <span className="text-orange-600" style={{ width: `${(10 / maxScale) * 100}%` }}>Sell</span>
          <span className="text-red-600 flex-1 text-right">Strong Sell</span>
        </div>
      </div>

      {/* Track */}
      <div className="relative h-2.5 rounded-full overflow-visible">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(to right, #059669, #16a34a, #d97706, #ea580c, #dc2626)',
            opacity: 0.15,
          }}
        />
        <div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(to right, #059669, #16a34a, #d97706, #ea580c, #dc2626)',
            opacity: 0.7,
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-4 rounded-sm bg-gray-900 border border-gray-700"
          style={{ left: `${pct}%`, transform: 'translateX(-50%) translateY(-50%)' }}
        />
      </div>

      {/* Year ticks */}
      <div className="relative mt-1.5">
        <div className="flex justify-between text-xs text-gray-400 font-mono">
          {zones.map((z) => (
            <span key={z.label}>
              {z.year}Y
            </span>
          ))}
          <span>30Y+</span>
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;
