import React from 'react';
import { Activity, Layers, FlaskConical, CheckCircle2, AlertTriangle } from 'lucide-react';
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
  const { drivers, wacc: waccAsm, terminalGrowthRate } = assumptions;
  const waccRate = waccAsm.wacc;

  const operatingProfit = data.revenue * drivers.operatingProfitMargin;
  const modelNOPAT = operatingProfit * (1 - drivers.cashTaxRate);

  const ssOperatingEV = result.steadyStateOperatingEV;
  const pieIsZero = result.impliedForecastYears === 0;

  const totalMarketEV = data.enterpriseValue;
  const lti = result.longTermInvestments;
  const impliedOperatingEV = result.enterpriseValue;

  const operatingEV10Y =
    result.intrinsicValue10Y * data.sharesOutstanding + result.netDebt - lti;
  const equityValue10Y = result.intrinsicValue10Y * data.sharesOutstanding;

  return (
    <div className="space-y-4">
      {/* Price-Implied Expectations */}
      <div className="card p-6">
        <div className="section-title mb-4">
          <Activity className="w-5 h-5 text-gray-400" />
          {fa.pieTitle}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="card-section p-4">
            <div className="label mb-2">{fa.impliedPeriod}</div>
            <div
              className={`font-mono text-4xl font-extrabold ${
                result.isNegativeNOPAT
                  ? 'text-gray-400'
                  : isFinite(result.impliedForecastYears) && result.impliedForecastYears <= 50
                  ? 'text-gray-900'
                  : 'text-red-600'
              }`}
            >
              {result.isNegativeNOPAT
                ? fa.na
                : isFinite(result.impliedForecastYears) && result.impliedForecastYears <= 50
                ? `${result.impliedForecastYears.toFixed(1)}${fa.yearsLabel}`
                : fa.yearsPlus}
            </div>
            <div className="text-xs text-gray-400 mt-1">{fa.impliedPeriodDesc}</div>
          </div>

          <div className="card-section p-4">
            <div className="label mb-2">{fa.intrinsicValue}</div>
            <div
              className={`font-mono text-4xl font-extrabold ${
                result.isNegativeNOPAT
                  ? 'text-gray-400'
                  : result.intrinsicValue10Y > data.price
                  ? 'text-emerald-600'
                  : 'text-red-600'
              }`}
            >
              {result.isNegativeNOPAT
                ? fa.na
                : formatCurrency(result.intrinsicValue10Y, data.currency)}
            </div>
            <div className="text-xs text-gray-400 mt-1">{fa.intrinsicValueDesc}</div>
          </div>
        </div>

        {/* Computation Breakdown */}
        <div className="space-y-3">
          <ComputationBlock
            title={fa.nopatSection}
            rows={[
              { label: fa.baseRevenue,    value: formatLargeNumber(data.revenue, data.currency),             note: 'latest annual' },
              { label: fa.opMarginLabel,  value: formatPercent(drivers.operatingProfitMargin), note: 'from drivers' },
              { label: fa.operatingProfit,value: formatLargeNumber(operatingProfit, data.currency),           bold: true },
              { label: fa.cashTaxRateLabel,value: formatPercent(drivers.cashTaxRate),          note: 'from drivers' },
              { label: fa.modelNopat,     value: formatLargeNumber(modelNOPAT, data.currency),                bold: true, accent: true },
            ]}
          />

          <ComputationBlock
            title={fa.ssSection}
            rows={[
              { label: 'Model NOPAT',             value: formatLargeNumber(modelNOPAT, data.currency) },
              { label: '× (1 + g)',               value: `× ${(1 + terminalGrowthRate).toFixed(4)}`, note: `g = ${formatPercent(terminalGrowthRate)}` },
              { label: '÷ WACC',                  value: `÷ ${formatPercent(waccRate)}`, note: 'RONIC = WACC assumed' },
              { label: fa.ssOperatingEV,          value: formatLargeNumber(ssOperatingEV, data.currency), bold: true, accent: true },
            ]}
            footnote={fa.ssNote}
          />

          <ComputationBlock
            title={fa.evSection}
            rows={[
              { label: fa.totalMarketEV,  value: formatLargeNumber(totalMarketEV, data.currency),     note: 'Yahoo Finance' },
              { label: fa.longTermInv,    value: `(${formatLargeNumber(lti, data.currency)})`,         note: 'balance sheet' },
              { label: fa.impliedOpEV,    value: formatLargeNumber(impliedOperatingEV, data.currency), bold: true, accent: true },
            ]}
            condition={
              pieIsZero
                ? { ok: true,  text: fa.pieZeroReason }
                : { ok: false, text: fa.piePositiveReason(result.impliedForecastYears) }
            }
          />

          <ComputationBlock
            title={fa.eqSection}
            rows={[
              { label: fa.enterpriseValue,  value: formatLargeNumber(operatingEV10Y, data.currency),          note: '10Y DCF' },
              { label: fa.longTermInvAdd,   value: formatLargeNumber(lti, data.currency),                      note: 'nonoperating' },
              { label: fa.netDebt,          value: `(${formatLargeNumber(result.netDebt, data.currency)})` },
              { label: fa.equityValue,      value: formatLargeNumber(equityValue10Y, data.currency),            bold: true },
              { label: '÷ ' + fa.sharesOut, value: `${(data.sharesOutstanding / 1e9).toFixed(3)}B` },
              { label: fa.intrinsicPrice,   value: formatCurrency(result.intrinsicValue10Y, data.currency), bold: true, accent: true },
            ]}
          />

          {/* Reference data */}
          <div className="p-3 bg-gray-50 rounded-lg text-xs font-mono text-gray-400 flex flex-wrap gap-x-6 gap-y-1.5">
            <span>{fa.marketCap}: <span className="text-gray-700">{formatLargeNumber(data.marketCap, data.currency)}</span></span>
            <span>{fa.ttmFCF}: <span className="text-gray-700">{formatLargeNumber(data.freeCashFlow, data.currency)}</span></span>
            <span>WACC: <span className="text-gray-700">{formatPercent(waccRate)}</span></span>
            <span>g: <span className="text-gray-700">{formatPercent(terminalGrowthRate)}</span></span>
            <span>β: <span className="text-gray-700">{waccAsm.beta.toFixed(2)}</span></span>
            <span>Rf: <span className="text-gray-700">{formatPercent(waccAsm.riskFreeRate)}</span></span>
            <span>ERP: <span className="text-gray-700">{formatPercent(waccAsm.marketRiskPremium)}</span></span>
            {data.reportingCurrency !== data.currency && (
              <span>FS FX: <span className="text-gray-700">{`${data.reportingCurrency}->${data.currency} @ ${data.fxRateToQuoteCurrency.toFixed(4)}x`}</span></span>
            )}
          </div>
        </div>
      </div>

      {/* Sensitivity Chart */}
      <div className="card p-6">
        <div className="section-title mb-4">
          <Layers className="w-5 h-5 text-gray-400" />
          {fa.sensitivityTitle}
        </div>
        <p className="text-xs text-gray-400 mb-4">{fa.sensitivityDesc}</p>
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

// Helpers

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
  title, rows, footnote, condition,
}) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">{title}</div>
      <div className="space-y-1.5 text-xs font-mono">
        {rows.map((row, i) => (
          <div key={i} className={`flex justify-between items-baseline gap-4 ${row.bold ? 'border-t border-gray-200 pt-1.5 mt-1.5' : ''}`}>
            <span className={row.accent ? 'text-gray-900 font-semibold' : 'text-gray-500'}>
              {row.label}
              {row.note && <span className="text-gray-400 ml-1.5 text-[10px]">({row.note})</span>}
            </span>
            <span className={`${row.accent ? 'text-gray-900 font-bold text-sm' : row.bold ? 'text-gray-900 font-semibold' : 'text-gray-700'} whitespace-nowrap`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
      {condition && (
        <div className={`mt-3 flex items-start gap-2 px-3 py-2 rounded-md ${condition.ok ? 'bg-emerald-50 border border-emerald-200' : 'bg-white border border-gray-200'}`}>
          {condition.ok
            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            : <FlaskConical className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />}
          <span className={`text-[11px] leading-relaxed ${condition.ok ? 'text-emerald-700' : 'text-gray-500'}`}>{condition.text}</span>
        </div>
      )}
      {footnote && (
        <p className="mt-2 text-[10px] text-gray-400 leading-relaxed">{footnote}</p>
      )}
    </div>
  );
};

export default FCFAnalysis;
