import React from 'react';
import { Activity, Layers, FlaskConical, CheckCircle2 } from 'lucide-react';
import { StockFinancials, ReverseFCFResult, AnalysisAssumptions } from '../types';
import SensitivityChart from './charts/SensitivityChart';
import { formatLargeNumber, formatCurrency, formatPercent } from '../utils/format';
import { useLanguage } from '../contexts/LanguageContext';

interface FCFAnalysisProps {
  data: StockFinancials;
  result: ReverseFCFResult;
  assumptions: AnalysisAssumptions;
}

const FCFAnalysis: React.FC<FCFAnalysisProps> = ({ data, result, assumptions }) => {
  const { t } = useLanguage();
  const fa = t.fcfAnalysis;
  const { drivers, wacc: waccAsm, terminalGrowthRate, continuingValueMethod } = assumptions;
  const waccRate = waccAsm.wacc;

  const operatingProfit = data.revenue * drivers.operatingProfitMargin;
  const modelNOPAT = operatingProfit * (1 - drivers.cashTaxRate);
  const pieExceedsMax =
    isFinite(result.impliedForecastYears) &&
    result.impliedForecastYears >= 50 &&
    result.impliedBreakdown.shareholderValue < result.marketShareholderValue;
  const pieIsZero = result.impliedForecastYears === 0;
  const methodLabel = t.assumptions.cvMethods[continuingValueMethod];

  return (
    <div className="space-y-3">
      <div className="card p-5 sm:p-6">
        <div className="section-title mb-4">
          <Activity className="h-4 w-4 text-[color:var(--accent)]" />
          {fa.pieTitle}
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="card-section p-4">
            <div className="label mb-2">{fa.impliedPeriod}</div>
            <div
              className={`font-mono text-3xl font-extrabold ${
                result.isNegativeNOPAT
                  ? 'text-[color:var(--muted-soft)]'
                  : pieExceedsMax
                  ? 'status-warning'
                  : 'text-[color:var(--text)]'
              }`}
            >
              {result.isNegativeNOPAT
                ? fa.na
                : pieExceedsMax
                ? fa.yearsPlus
                : `${result.impliedForecastYears.toFixed(1)}${fa.yearsLabel}`}
            </div>
            <div className="mt-1.5 text-xs leading-5 text-[color:var(--muted)]">
              {fa.impliedPeriodDesc}
            </div>
          </div>

          <div className="card-section p-4">
            <div className="label mb-2">{fa.steadyStateValue}</div>
            <div
              className={`font-mono text-3xl font-extrabold ${
                result.isNegativeNOPAT
                  ? 'text-[color:var(--muted-soft)]'
                  : result.steadyStateValue >= data.price
                  ? 'status-positive'
                  : 'status-negative'
              }`}
            >
              {result.isNegativeNOPAT
                ? fa.na
                : formatCurrency(result.steadyStateValue, data.currency)}
            </div>
            <div className="mt-1.5 text-xs leading-5 text-[color:var(--muted)]">
              {fa.steadyStateValueDesc}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <ComputationBlock
            title={fa.nopatSection}
            rows={[
              {
                label: fa.baseRevenue,
                value: formatLargeNumber(data.revenue, data.currency),
                note: fa.noteLatestAnnual,
              },
              {
                label: fa.opMarginLabel,
                value: formatPercent(drivers.operatingProfitMargin),
                note: fa.noteFromDrivers,
              },
              {
                label: fa.operatingProfit,
                value: formatLargeNumber(operatingProfit, data.currency),
                bold: true,
              },
              {
                label: fa.cashTaxRateLabel,
                value: formatPercent(drivers.cashTaxRate),
                note: fa.noteFromDrivers,
              },
              {
                label: fa.modelNopat,
                value: formatLargeNumber(modelNOPAT, data.currency),
                bold: true,
                accent: true,
              },
            ]}
          />

          <ComputationBlock
            title={fa.marketBridgeSection}
            rows={[
              {
                label: fa.currentShareholderValue,
                value: formatLargeNumber(result.marketShareholderValue, data.currency),
                note: fa.noteMarketCap,
              },
              {
                label: fa.debtAdd,
                value: formatLargeNumber(result.debt, data.currency),
                note: fa.noteTotalDebt,
              },
              {
                label: fa.nonOperatingAssetsSubtract,
                value: `(${formatLargeNumber(result.totalNonOperatingAssets, data.currency)})`,
                note: methodLabel,
              },
              {
                label: fa.impliedCorporateValue,
                value: formatLargeNumber(result.marketImpliedCorporateValue, data.currency),
                bold: true,
                accent: true,
              },
            ]}
            condition={
              pieIsZero
                ? { ok: true, text: fa.pieZeroReason }
                : pieExceedsMax
                ? { ok: false, text: fa.pieMaxReason }
                : { ok: false, text: fa.piePositiveReason(result.impliedForecastYears) }
            }
          />

          <ComputationBlock
            title={fa.nonOperatingSection}
            rows={[
              {
                label: fa.reportedCash,
                value: formatLargeNumber(data.totalCash, data.currency),
              },
              {
                label: fa.reportedLongTermInvestments,
                value: formatLargeNumber(data.longTermInvestments, data.currency),
              },
              {
                label: fa.manualNonOperatingAssets,
                value: formatLargeNumber(result.additionalNonOperatingAssets, data.currency),
              },
              {
                label: fa.totalNonOperatingAssets,
                value: formatLargeNumber(result.totalNonOperatingAssets, data.currency),
                bold: true,
                accent: true,
              },
            ]}
          />

          <ComputationBlock
            title={fa.solvedValueSection}
            rows={[
              {
                label: fa.pvForecastFCF,
                value: formatLargeNumber(
                  result.impliedBreakdown.presentValueForecastFCF,
                  data.currency
                ),
              },
              {
                label: fa.pvContinuingValue,
                value: formatLargeNumber(
                  result.impliedBreakdown.presentValueContinuingValue,
                  data.currency
                ),
                note: methodLabel,
              },
              {
                label: fa.corporateValue,
                value: formatLargeNumber(result.impliedBreakdown.corporateValue, data.currency),
                bold: true,
              },
              {
                label: fa.nonOperatingAssetsAdd,
                value: formatLargeNumber(result.totalNonOperatingAssets, data.currency),
              },
              {
                label: fa.debtSubtract,
                value: `(${formatLargeNumber(result.debt, data.currency)})`,
              },
              {
                label: fa.shareholderValue,
                value: formatLargeNumber(result.impliedBreakdown.shareholderValue, data.currency),
                bold: true,
              },
              {
                label: `/ ${fa.sharesOut}`,
                value: formatShares(data.sharesOutstanding),
              },
              {
                label: fa.impliedPrice,
                value: formatCurrency(result.impliedBreakdown.valuePerShare, data.currency),
                bold: true,
                accent: true,
              },
            ]}
          />

          <ComputationBlock
            title={fa.steadyStateSection}
            rows={[
              {
                label: fa.zeroForecast,
                value: formatLargeNumber(
                  result.steadyStateBreakdown.presentValueForecastFCF,
                  data.currency
                ),
              },
              {
                label: fa.pvContinuingValue,
                value: formatLargeNumber(
                  result.steadyStateBreakdown.presentValueContinuingValue,
                  data.currency
                ),
                note: methodLabel,
              },
              {
                label: fa.corporateValue,
                value: formatLargeNumber(result.steadyStateCorporateValue, data.currency),
                bold: true,
              },
              {
                label: fa.nonOperatingAssetsAdd,
                value: formatLargeNumber(result.totalNonOperatingAssets, data.currency),
              },
              {
                label: fa.debtSubtract,
                value: `(${formatLargeNumber(result.debt, data.currency)})`,
              },
              {
                label: fa.steadyStateValue,
                value: formatCurrency(result.steadyStateValue, data.currency),
                bold: true,
                accent: true,
              },
            ]}
            footnote={fa.steadyStateNote}
          />

          <div className="data-strip">
            <div className="flex flex-wrap gap-x-5 gap-y-1.5">
              <span>
                {fa.continuingValueMethod}:{' '}
                <span className="text-[color:var(--text)]">{methodLabel}</span>
              </span>
              <span>
                WACC: <span className="text-[color:var(--text)]">{formatPercent(waccRate)}</span>
              </span>
              <span>
                g: <span className="text-[color:var(--text)]">{formatPercent(terminalGrowthRate)}</span>
              </span>
              <span>
                {fa.marketPrice}:{' '}
                <span className="text-[color:var(--text)]">
                  {formatCurrency(data.price, data.currency)}
                </span>
              </span>
              <span>
                {fa.ttmFCF}:{' '}
                <span className="text-[color:var(--text)]">
                  {formatLargeNumber(data.freeCashFlow, data.currency)}
                </span>
              </span>
              {data.reportingCurrency !== data.currency && (
                <span>
                  FS FX:{' '}
                  <span className="text-[color:var(--text)]">
                    {`${data.reportingCurrency}->${data.currency} @ ${data.fxRateToQuoteCurrency.toFixed(4)}x`}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <div className="section-title mb-3">
          <Layers className="h-4 w-4 text-[color:var(--accent)]" />
          {fa.sensitivityTitle}
        </div>
        <p className="mb-3 text-xs leading-5 text-[color:var(--muted)]">{fa.sensitivityDesc}</p>
        <SensitivityChart
          sensitivityCurve={result.sensitivityCurve}
          currentPrice={data.price}
          impliedYears={result.impliedForecastYears}
          currency={data.currency}
        />
      </div>
    </div>
  );
};

export const FCFBreakdownCard: React.FC<FCFAnalysisProps> = ({
  data,
  result,
  assumptions,
}) => {
  const { t } = useLanguage();
  const fa = t.fcfAnalysis;
  const { drivers, wacc: waccAsm, terminalGrowthRate, continuingValueMethod } = assumptions;
  const waccRate = waccAsm.wacc;

  const operatingProfit = data.revenue * drivers.operatingProfitMargin;
  const modelNOPAT = operatingProfit * (1 - drivers.cashTaxRate);
  const pieExceedsMax =
    isFinite(result.impliedForecastYears) &&
    result.impliedForecastYears >= 50 &&
    result.impliedBreakdown.shareholderValue < result.marketShareholderValue;
  const pieIsZero = result.impliedForecastYears === 0;
  const methodLabel = t.assumptions.cvMethods[continuingValueMethod];

  return (
    <div className="card p-5 sm:p-6">
      <div className="section-title mb-4">
        <Activity className="h-4 w-4 text-[color:var(--accent)]" />
        {fa.pieTitle}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="card-section p-4">
          <div className="label mb-2">{fa.impliedPeriod}</div>
          <div
            className={`font-mono text-3xl font-extrabold ${
              result.isNegativeNOPAT
                ? 'text-[color:var(--muted-soft)]'
                : pieExceedsMax
                ? 'status-warning'
                : 'text-[color:var(--text)]'
            }`}
          >
            {result.isNegativeNOPAT
              ? fa.na
              : pieExceedsMax
              ? fa.yearsPlus
              : `${result.impliedForecastYears.toFixed(1)}${fa.yearsLabel}`}
          </div>
          <div className="mt-1.5 text-xs leading-5 text-[color:var(--muted)]">
            {fa.impliedPeriodDesc}
          </div>
        </div>

        <div className="card-section p-4">
          <div className="label mb-2">{fa.steadyStateValue}</div>
          <div
            className={`font-mono text-3xl font-extrabold ${
              result.isNegativeNOPAT
                ? 'text-[color:var(--muted-soft)]'
                : result.steadyStateValue >= data.price
                ? 'status-positive'
                : 'status-negative'
            }`}
          >
            {result.isNegativeNOPAT
              ? fa.na
              : formatCurrency(result.steadyStateValue, data.currency)}
          </div>
          <div className="mt-1.5 text-xs leading-5 text-[color:var(--muted)]">
            {fa.steadyStateValueDesc}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <ComputationBlock
          title={fa.nopatSection}
          rows={[
            {
              label: fa.baseRevenue,
              value: formatLargeNumber(data.revenue, data.currency),
              note: fa.noteLatestAnnual,
            },
            {
              label: fa.opMarginLabel,
              value: formatPercent(drivers.operatingProfitMargin),
              note: fa.noteFromDrivers,
            },
            {
              label: fa.operatingProfit,
              value: formatLargeNumber(operatingProfit, data.currency),
              bold: true,
            },
            {
              label: fa.cashTaxRateLabel,
              value: formatPercent(drivers.cashTaxRate),
              note: fa.noteFromDrivers,
            },
            {
              label: fa.modelNopat,
              value: formatLargeNumber(modelNOPAT, data.currency),
              bold: true,
              accent: true,
            },
          ]}
        />

        <ComputationBlock
          title={fa.marketBridgeSection}
          rows={[
            {
              label: fa.currentShareholderValue,
              value: formatLargeNumber(result.marketShareholderValue, data.currency),
              note: fa.noteMarketCap,
            },
            {
              label: fa.debtAdd,
              value: formatLargeNumber(result.debt, data.currency),
              note: fa.noteTotalDebt,
            },
            {
              label: fa.nonOperatingAssetsSubtract,
              value: `(${formatLargeNumber(result.totalNonOperatingAssets, data.currency)})`,
              note: methodLabel,
            },
            {
              label: fa.impliedCorporateValue,
              value: formatLargeNumber(result.marketImpliedCorporateValue, data.currency),
              bold: true,
              accent: true,
            },
          ]}
          condition={
            pieIsZero
              ? { ok: true, text: fa.pieZeroReason }
              : pieExceedsMax
              ? { ok: false, text: fa.pieMaxReason }
              : { ok: false, text: fa.piePositiveReason(result.impliedForecastYears) }
          }
        />

        <ComputationBlock
          title={fa.nonOperatingSection}
          rows={[
            {
              label: fa.reportedCash,
              value: formatLargeNumber(data.totalCash, data.currency),
            },
            {
              label: fa.reportedLongTermInvestments,
              value: formatLargeNumber(data.longTermInvestments, data.currency),
            },
            {
              label: fa.manualNonOperatingAssets,
              value: formatLargeNumber(result.additionalNonOperatingAssets, data.currency),
            },
            {
              label: fa.totalNonOperatingAssets,
              value: formatLargeNumber(result.totalNonOperatingAssets, data.currency),
              bold: true,
              accent: true,
            },
          ]}
        />

        <ComputationBlock
          title={fa.solvedValueSection}
          rows={[
            {
              label: fa.pvForecastFCF,
              value: formatLargeNumber(
                result.impliedBreakdown.presentValueForecastFCF,
                data.currency
              ),
            },
            {
              label: fa.pvContinuingValue,
              value: formatLargeNumber(
                result.impliedBreakdown.presentValueContinuingValue,
                data.currency
              ),
              note: methodLabel,
            },
            {
              label: fa.corporateValue,
              value: formatLargeNumber(result.impliedBreakdown.corporateValue, data.currency),
              bold: true,
            },
            {
              label: fa.nonOperatingAssetsAdd,
              value: formatLargeNumber(result.totalNonOperatingAssets, data.currency),
            },
            {
              label: fa.debtSubtract,
              value: `(${formatLargeNumber(result.debt, data.currency)})`,
            },
            {
              label: fa.shareholderValue,
              value: formatLargeNumber(result.impliedBreakdown.shareholderValue, data.currency),
              bold: true,
            },
            {
              label: `/ ${fa.sharesOut}`,
              value: formatShares(data.sharesOutstanding),
            },
            {
              label: fa.impliedPrice,
              value: formatCurrency(result.impliedBreakdown.valuePerShare, data.currency),
              bold: true,
              accent: true,
            },
          ]}
        />

        <ComputationBlock
          title={fa.steadyStateSection}
          rows={[
            {
              label: fa.zeroForecast,
              value: formatLargeNumber(
                result.steadyStateBreakdown.presentValueForecastFCF,
                data.currency
              ),
            },
            {
              label: fa.pvContinuingValue,
              value: formatLargeNumber(
                result.steadyStateBreakdown.presentValueContinuingValue,
                data.currency
              ),
              note: methodLabel,
            },
            {
              label: fa.corporateValue,
              value: formatLargeNumber(result.steadyStateCorporateValue, data.currency),
              bold: true,
            },
            {
              label: fa.nonOperatingAssetsAdd,
              value: formatLargeNumber(result.totalNonOperatingAssets, data.currency),
            },
            {
              label: fa.debtSubtract,
              value: `(${formatLargeNumber(result.debt, data.currency)})`,
            },
            {
              label: fa.steadyStateValue,
              value: formatCurrency(result.steadyStateValue, data.currency),
              bold: true,
              accent: true,
            },
          ]}
          footnote={fa.steadyStateNote}
        />

        <div className="data-strip">
          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            <span>
              {fa.continuingValueMethod}:{' '}
              <span className="text-[color:var(--text)]">{methodLabel}</span>
            </span>
            <span>
              WACC: <span className="text-[color:var(--text)]">{formatPercent(waccRate)}</span>
            </span>
            <span>
              g: <span className="text-[color:var(--text)]">{formatPercent(terminalGrowthRate)}</span>
            </span>
            <span>
              {fa.marketPrice}:{' '}
              <span className="text-[color:var(--text)]">
                {formatCurrency(data.price, data.currency)}
              </span>
            </span>
            <span>
              {fa.ttmFCF}:{' '}
              <span className="text-[color:var(--text)]">
                {formatLargeNumber(data.freeCashFlow, data.currency)}
              </span>
            </span>
            {data.reportingCurrency !== data.currency && (
              <span>
                FS FX:{' '}
                <span className="text-[color:var(--text)]">
                  {`${data.reportingCurrency}->${data.currency} @ ${data.fxRateToQuoteCurrency.toFixed(4)}x`}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const FCFSensitivityCard: React.FC<FCFAnalysisProps> = ({ data, result }) => {
  const { t } = useLanguage();
  const fa = t.fcfAnalysis;

  return (
    <div className="card p-5 sm:p-6">
      <div className="section-title mb-3">
        <Layers className="h-4 w-4 text-[color:var(--accent)]" />
        {fa.sensitivityTitle}
      </div>
      <p className="mb-3 text-xs leading-5 text-[color:var(--muted)]">{fa.sensitivityDesc}</p>
      <SensitivityChart
        sensitivityCurve={result.sensitivityCurve}
        currentPrice={data.price}
        impliedYears={result.impliedForecastYears}
        currency={data.currency}
      />
    </div>
  );
};

interface ComputationRow {
  label: string;
  value: string;
  note?: string;
  bold?: boolean;
  accent?: boolean;
}

interface ConditionBadge {
  ok: boolean;
  text: string;
}

interface ComputationBlockProps {
  title: string;
  rows: ComputationRow[];
  footnote?: string;
  condition?: ConditionBadge;
}

const ComputationBlock: React.FC<ComputationBlockProps> = ({
  title,
  rows,
  footnote,
  condition,
}) => {
  return (
    <div className="card-section p-4">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--accent)]">
        {title}
      </div>
      <div className="space-y-1.5 font-mono text-[11px]">
        {rows.map((row, index) => (
          <div
            key={index}
            className={`flex items-baseline justify-between gap-3 ${
              row.bold ? 'mt-1.5 border-t border-[var(--border)] pt-1.5' : ''
            }`}
          >
            <span className={row.accent ? 'font-semibold text-[color:var(--text)]' : 'text-[color:var(--muted)]'}>
              {row.label}
              {row.note && (
                <span className="ml-1 text-[9px] text-[color:var(--muted-soft)]">
                  ({row.note})
                </span>
              )}
            </span>
            <span
              className={`whitespace-nowrap ${
                row.accent
                  ? 'text-xs font-bold text-[color:var(--text)]'
                  : row.bold
                  ? 'font-semibold text-[color:var(--text)]'
                  : 'text-[color:var(--muted)]'
              }`}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
      {condition && (
        <div
          className={`mt-3 flex items-start gap-2 px-3 py-2.5 ${
            condition.ok ? 'success-panel' : 'soft-panel'
          }`}
        >
          {condition.ok ? (
            <CheckCircle2 className="status-positive mt-0.5 h-3.5 w-3.5 shrink-0" />
          ) : (
            <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--accent)]" />
          )}
          <span
            className={`text-[10px] leading-4 ${
              condition.ok ? 'status-positive' : 'text-[color:var(--muted)]'
            }`}
          >
            {condition.text}
          </span>
        </div>
      )}
      {footnote && (
        <p className="mt-2 text-[10px] leading-4 text-[color:var(--muted-soft)]">{footnote}</p>
      )}
    </div>
  );
};

function formatShares(shares: number): string {
  if (shares >= 1e9) return `${(shares / 1e9).toFixed(3)}B`;
  if (shares >= 1e6) return `${(shares / 1e6).toFixed(1)}M`;
  return shares.toLocaleString('en-US');
}

export default FCFAnalysis;
