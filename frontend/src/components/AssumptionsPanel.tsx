import React from 'react';
import { Settings2, Info, RotateCcw } from 'lucide-react';
import { AnalysisAssumptions, WACCAssumptions, OperatingDrivers } from '../types';
import { formatPercent } from '../utils/format';
import { useLanguage } from '../contexts/LanguageContext';

interface AssumptionsPanelProps {
  assumptions: AnalysisAssumptions;
  defaultDrivers: OperatingDrivers;
  onChange: (updated: AnalysisAssumptions) => void;
}

const AssumptionsPanel: React.FC<AssumptionsPanelProps> = ({
  assumptions,
  defaultDrivers,
  onChange,
}) => {
  const { t } = useLanguage();
  const { wacc, drivers, terminalGrowthRate } = assumptions;

  const updateWACC = (partial: Partial<WACCAssumptions>) => {
    const updated = { ...wacc, ...partial };
    const costOfEquity = updated.riskFreeRate + updated.beta * updated.marketRiskPremium;
    const afterTaxCostOfDebt = updated.costOfDebt * (1 - updated.taxRate);
    updated.wacc = updated.equityWeight * costOfEquity + updated.debtWeight * afterTaxCostOfDebt;
    updated.wacc = Math.max(0.04, Math.min(0.25, updated.wacc));
    onChange({ ...assumptions, wacc: updated });
  };

  const updateDriver = (partial: Partial<OperatingDrivers>) => {
    onChange({ ...assumptions, drivers: { ...drivers, ...partial } });
  };

  const resetDrivers = () => {
    onChange({ ...assumptions, drivers: { ...defaultDrivers } });
  };

  const setTerminalGrowth = (v: number) =>
    onChange({ ...assumptions, terminalGrowthRate: v });

  return (
    <div className="card p-6">
      <div className="section-title mb-5">
        <Settings2 className="w-5 h-5 text-gray-400" />
        {t.assumptions.title}
      </div>

      <div className="space-y-6">
        {/* Operating Value Drivers */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">
              {t.assumptions.operatingDrivers}
            </span>
            <button
              onClick={resetDrivers}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
              title="Reset to values derived from financial statements"
            >
              <RotateCcw className="w-3 h-3" />
              {t.assumptions.reset}
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-4">{t.assumptions.driversDesc}</p>

          <div className="space-y-4">
            <SliderInput
              label={t.assumptions.salesGrowth}
              value={drivers.salesGrowthRate}
              min={-0.2}
              max={0.5}
              step={0.005}
              onChange={(v) => updateDriver({ salesGrowthRate: v })}
            />
            <SliderInput
              label={t.assumptions.opMargin}
              value={drivers.operatingProfitMargin}
              min={-0.1}
              max={0.6}
              step={0.005}
              onChange={(v) => updateDriver({ operatingProfitMargin: v })}
            />
            <SliderInput
              label={t.assumptions.cashTaxRate}
              value={drivers.cashTaxRate}
              min={0}
              max={0.45}
              step={0.005}
              onChange={(v) => updateDriver({ cashTaxRate: v })}
            />
            <SliderInput
              label={t.assumptions.incrWC}
              value={drivers.incrementalWorkingCapitalRate}
              min={-0.3}
              max={0.3}
              step={0.005}
              onChange={(v) => updateDriver({ incrementalWorkingCapitalRate: v })}
            />
            <SliderInput
              label={t.assumptions.incrFC}
              value={drivers.incrementalFixedCapitalRate}
              min={-0.2}
              max={1.5}
              step={0.01}
              onChange={(v) => updateDriver({ incrementalFixedCapitalRate: v })}
            />
          </div>
        </div>

        <div className="border-t border-gray-200" />

        {/* Terminal Growth + WACC */}
        <SliderInput
          label={t.assumptions.terminalGrowth}
          value={terminalGrowthRate}
          min={0.0}
          max={0.05}
          step={0.005}
          onChange={setTerminalGrowth}
        />

        <div className="border-t border-gray-200" />

        {/* WACC Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">{t.assumptions.wacc}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{t.assumptions.waccResult}</span>
              <span className="font-mono text-lg font-bold text-gray-900">
                {formatPercent(wacc.wacc)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SliderInput
              label={t.assumptions.riskFreeRate}
              value={wacc.riskFreeRate}
              min={0.01}
              max={0.1}
              step={0.0025}
              onChange={(v) => updateWACC({ riskFreeRate: v })}
            />
            <SliderInput
              label={t.assumptions.erp}
              value={wacc.marketRiskPremium}
              min={0.02}
              max={0.12}
              step={0.005}
              onChange={(v) => updateWACC({ marketRiskPremium: v })}
            />
            <SliderInput
              label={t.assumptions.beta}
              value={wacc.beta}
              min={0.1}
              max={3.0}
              step={0.05}
              format={(v) => v.toFixed(2)}
              onChange={(v) => updateWACC({ beta: v })}
            />
            <SliderInput
              label={t.assumptions.costOfDebt}
              value={wacc.costOfDebt}
              min={0.01}
              max={0.15}
              step={0.0025}
              onChange={(v) => updateWACC({ costOfDebt: v })}
            />
            <SliderInput
              label={t.assumptions.taxRate}
              value={wacc.taxRate}
              min={0.0}
              max={0.45}
              step={0.01}
              onChange={(v) => updateWACC({ taxRate: v })}
            />
            <SliderInput
              label={t.assumptions.debtWeight}
              value={wacc.debtWeight}
              min={0}
              max={0.9}
              step={0.01}
              onChange={(v) => {
                const dw = Math.min(v, 0.99);
                updateWACC({ debtWeight: dw, equityWeight: 1 - dw });
              }}
            />
          </div>

          <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-400 font-mono flex flex-wrap gap-x-4 gap-y-1">
            <span>
              Ke ={' '}
              <span className="text-gray-700">
                {formatPercent(wacc.riskFreeRate + wacc.beta * wacc.marketRiskPremium)}
              </span>
            </span>
            <span>
              Kd(1-t) ={' '}
              <span className="text-gray-700">
                {formatPercent(wacc.costOfDebt * (1 - wacc.taxRate))}
              </span>
            </span>
            <span>
              E/V = <span className="text-gray-700">{formatPercent(wacc.equityWeight)}</span>
            </span>
            <span>
              D/V = <span className="text-gray-700">{formatPercent(wacc.debtWeight)}</span>
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <Info className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
          <p className="text-xs text-gray-500 leading-relaxed">{t.assumptions.infoText}</p>
        </div>
      </div>
    </div>
  );
};

// Slider

interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}

const SliderInput: React.FC<SliderInputProps> = ({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}) => {
  const displayValue = format ? format(value) : formatPercent(value);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="label">{label}</label>
        <span className="font-mono text-sm font-semibold text-gray-900">{displayValue}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between mt-0.5 text-xs text-gray-400 font-mono">
        <span>{format ? format(min) : formatPercent(min)}</span>
        <span>{format ? format(max) : formatPercent(max)}</span>
      </div>
    </div>
  );
};

export default AssumptionsPanel;
