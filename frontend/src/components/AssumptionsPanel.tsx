import React from 'react';
import { Settings2, Info, RotateCcw } from 'lucide-react';
import {
  AnalysisAssumptions,
  WACCAssumptions,
  OperatingDrivers,
  ContinuingValueMethod,
} from '../types';
import { formatLargeNumber, formatPercent } from '../utils/format';
import { useLanguage } from '../contexts/LanguageContext';

interface AssumptionsPanelProps {
  assumptions: AnalysisAssumptions;
  defaultDrivers: OperatingDrivers;
  currency: string;
  reportedNonOperatingAssets: number;
  onChange: (updated: AnalysisAssumptions) => void;
}

const AssumptionsPanel: React.FC<AssumptionsPanelProps> = ({
  assumptions,
  defaultDrivers,
  currency,
  reportedNonOperatingAssets,
  onChange,
}) => {
  const { t } = useLanguage();
  const {
    wacc,
    drivers,
    terminalGrowthRate,
    continuingValueMethod,
    additionalNonOperatingAssets,
  } = assumptions;

  const clampTerminalGrowth = (
    growthRate: number,
    nextWacc = wacc.wacc,
    nextMethod = continuingValueMethod
  ) => {
    if (nextMethod === 'perpetuity') {
      return growthRate;
    }

    return Math.min(growthRate, Math.max(0, nextWacc - 0.005));
  };

  const updateWACC = (partial: Partial<WACCAssumptions>) => {
    const updated = { ...wacc, ...partial };
    const costOfEquity = updated.riskFreeRate + updated.beta * updated.marketRiskPremium;
    const afterTaxCostOfDebt = updated.costOfDebt * (1 - updated.taxRate);
    updated.wacc = updated.equityWeight * costOfEquity + updated.debtWeight * afterTaxCostOfDebt;
    updated.wacc = Math.max(0.04, Math.min(0.25, updated.wacc));

    onChange({
      ...assumptions,
      wacc: updated,
      terminalGrowthRate: clampTerminalGrowth(terminalGrowthRate, updated.wacc),
    });
  };

  const updateDriver = (partial: Partial<OperatingDrivers>) => {
    onChange({ ...assumptions, drivers: { ...drivers, ...partial } });
  };

  const resetDrivers = () => {
    onChange({ ...assumptions, drivers: { ...defaultDrivers } });
  };

  const setContinuingValueMethod = (method: ContinuingValueMethod) => {
    onChange({
      ...assumptions,
      continuingValueMethod: method,
      terminalGrowthRate: clampTerminalGrowth(terminalGrowthRate, wacc.wacc, method),
    });
  };

  const setTerminalGrowth = (value: number) =>
    onChange({
      ...assumptions,
      terminalGrowthRate: clampTerminalGrowth(value),
    });

  const setAdditionalNonOperatingAssets = (value: number) =>
    onChange({
      ...assumptions,
      additionalNonOperatingAssets: value,
    });

  const totalNonOperatingAssets = reportedNonOperatingAssets + additionalNonOperatingAssets;

  return (
    <div className="card p-5 sm:p-6">
      <div className="section-title mb-4">
        <Settings2 className="h-4 w-4 text-[color:var(--accent)]" />
        {t.assumptions.title}
      </div>

      <div className="space-y-4">
        <section className="card-section p-4">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[color:var(--text)]">
              {t.assumptions.operatingDrivers}
            </span>
            <button
              type="button"
              onClick={resetDrivers}
              className="btn-ghost px-2 py-1 text-[10px]"
              title={t.assumptions.reset}
            >
              <RotateCcw className="h-3 w-3" />
              {t.assumptions.reset}
            </button>
          </div>
          <p className="mb-4 text-xs leading-5 text-[color:var(--muted)]">
            {t.assumptions.driversDesc}
          </p>

          <div className="space-y-3">
            <SliderInput
              label={t.assumptions.salesGrowth}
              value={drivers.salesGrowthRate}
              min={-0.5}
              max={2}
              step={0.01}
              onChange={(value) => updateDriver({ salesGrowthRate: value })}
            />
            <SliderInput
              label={t.assumptions.opMargin}
              value={drivers.operatingProfitMargin}
              min={-0.1}
              max={0.6}
              step={0.005}
              onChange={(value) => updateDriver({ operatingProfitMargin: value })}
            />
            <SliderInput
              label={t.assumptions.cashTaxRate}
              value={drivers.cashTaxRate}
              min={0}
              max={0.45}
              step={0.005}
              onChange={(value) => updateDriver({ cashTaxRate: value })}
            />
            <SliderInput
              label={t.assumptions.incrWC}
              value={drivers.incrementalWorkingCapitalRate}
              min={-1}
              max={2}
              step={0.01}
              onChange={(value) =>
                updateDriver({ incrementalWorkingCapitalRate: value })
              }
            />
            <SliderInput
              label={t.assumptions.incrFC}
              value={drivers.incrementalFixedCapitalRate}
              min={-1}
              max={5}
              step={0.01}
              onChange={(value) =>
                updateDriver({ incrementalFixedCapitalRate: value })
              }
            />
          </div>
        </section>

        <section className="card-section p-4">
          <div>
            <label className="label mb-1.5 block">{t.assumptions.continuingValueMethod}</label>
            <select
              value={continuingValueMethod}
              onChange={(e) =>
                setContinuingValueMethod(e.target.value as ContinuingValueMethod)
              }
              className="input-field"
            >
              <option value="perpetuity">{t.assumptions.cvMethods.perpetuity}</option>
              <option value="perpetuityWithInflation">
                {t.assumptions.cvMethods.perpetuityWithInflation}
              </option>
              <option value="ronicConvergence">
                {t.assumptions.cvMethods.ronicConvergence}
              </option>
            </select>
            <p className="mt-2 text-xs leading-5 text-[color:var(--muted)]">
              {t.assumptions.continuingValueDesc}
            </p>
          </div>

          <div className="mt-4 space-y-3">
            <SliderInput
              label={t.assumptions.terminalGrowth}
              value={terminalGrowthRate}
              min={0}
              max={0.05}
              step={0.005}
              disabled={continuingValueMethod === 'perpetuity'}
              onChange={setTerminalGrowth}
            />

            <NumberInput
              label={t.assumptions.additionalNonOperatingAssets}
              value={additionalNonOperatingAssets}
              currency={currency}
              onChange={setAdditionalNonOperatingAssets}
            />

            <div className="data-strip">
              <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                <span>
                  {t.assumptions.reportedNonOperatingAssets}:{' '}
                  <span className="text-[color:var(--text)]">
                    {formatLargeNumber(reportedNonOperatingAssets, currency)}
                  </span>
                </span>
                <span>
                  {t.assumptions.totalNonOperatingAssets}:{' '}
                  <span className="text-[color:var(--text)]">
                    {formatLargeNumber(totalNonOperatingAssets, currency)}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="card-section p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-[color:var(--text)]">{t.assumptions.wacc}</span>
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-[0.14em] text-[color:var(--muted-soft)]">
                {t.assumptions.waccResult}
              </div>
              <div className="font-mono text-xl font-bold text-[color:var(--text)]">
                {formatPercent(wacc.wacc)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SliderInput
              label={t.assumptions.riskFreeRate}
              value={wacc.riskFreeRate}
              min={0.01}
              max={0.1}
              step={0.0025}
              onChange={(value) => updateWACC({ riskFreeRate: value })}
            />
            <SliderInput
              label={t.assumptions.erp}
              value={wacc.marketRiskPremium}
              min={0.02}
              max={0.12}
              step={0.005}
              onChange={(value) => updateWACC({ marketRiskPremium: value })}
            />
            <SliderInput
              label={t.assumptions.beta}
              value={wacc.beta}
              min={0.1}
              max={3}
              step={0.05}
              format={(value) => value.toFixed(2)}
              onChange={(value) => updateWACC({ beta: value })}
            />
            <SliderInput
              label={t.assumptions.costOfDebt}
              value={wacc.costOfDebt}
              min={0.01}
              max={0.15}
              step={0.0025}
              onChange={(value) => updateWACC({ costOfDebt: value })}
            />
            <SliderInput
              label={t.assumptions.taxRate}
              value={wacc.taxRate}
              min={0}
              max={0.45}
              step={0.01}
              onChange={(value) => updateWACC({ taxRate: value })}
            />
            <SliderInput
              label={t.assumptions.debtWeight}
              value={wacc.debtWeight}
              min={0}
              max={0.9}
              step={0.01}
              onChange={(value) => {
                const debtWeight = Math.min(value, 0.99);
                updateWACC({ debtWeight, equityWeight: 1 - debtWeight });
              }}
            />
          </div>

          <div className="data-strip mt-3">
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              <span>
                Ke ={' '}
                <span className="text-[color:var(--text)]">
                  {formatPercent(wacc.riskFreeRate + wacc.beta * wacc.marketRiskPremium)}
                </span>
              </span>
              <span>
                Kd(1-t) ={' '}
                <span className="text-[color:var(--text)]">
                  {formatPercent(wacc.costOfDebt * (1 - wacc.taxRate))}
                </span>
              </span>
              <span>
                E/V = <span className="text-[color:var(--text)]">{formatPercent(wacc.equityWeight)}</span>
              </span>
              <span>
                D/V = <span className="text-[color:var(--text)]">{formatPercent(wacc.debtWeight)}</span>
              </span>
            </div>
          </div>
        </section>

        <div className="info-panel">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--accent)]" />
          <p className="text-xs leading-5 text-[color:var(--muted)]">{t.assumptions.infoText}</p>
        </div>
      </div>
    </div>
  );
};

interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (value: number) => string;
  disabled?: boolean;
  onChange: (value: number) => void;
}

const SliderInput: React.FC<SliderInputProps> = ({
  label,
  value,
  min,
  max,
  step,
  format,
  disabled,
  onChange,
}) => {
  const displayValue = format ? format(value) : formatPercent(value);

  return (
    <div className={disabled ? 'opacity-40' : undefined}>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label className="label">{label}</label>
        <span className="font-mono text-xs font-semibold text-[color:var(--text)]">{displayValue}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full disabled:cursor-not-allowed"
      />
      <div className="mt-0.5 flex justify-between font-mono text-[9px] text-[color:var(--muted-soft)]">
        <span>{format ? format(min) : formatPercent(min)}</span>
        <span>{format ? format(max) : formatPercent(max)}</span>
      </div>
    </div>
  );
};

interface NumberInputProps {
  label: string;
  value: number;
  currency: string;
  onChange: (value: number) => void;
}

const NumberInput: React.FC<NumberInputProps> = ({
  label,
  value,
  currency,
  onChange,
}) => (
  <div>
    <div className="mb-1.5 flex items-center justify-between gap-3">
      <label className="label">{label}</label>
      <span className="font-mono text-xs font-semibold text-[color:var(--text)]">
        {formatLargeNumber(value, currency)}
      </span>
    </div>
    <input
      type="number"
      value={Number.isFinite(value) ? value : 0}
      step={1000000}
      onChange={(e) => onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
      className="input-field"
    />
  </div>
);

export default AssumptionsPanel;
