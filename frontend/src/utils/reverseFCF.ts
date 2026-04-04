import {
  StockFinancials,
  AnalysisAssumptions,
  WACCAssumptions,
  OperatingDrivers,
  ReverseFCFResult,
  RecommendationType,
  SensitivityPoint,
  ProjectedYear,
  ContinuingValueMethod,
  ValuationBreakdown,
} from '../types';

const MAX_FORECAST_YEARS = 50;

export function calculateWACC(data: StockFinancials): WACCAssumptions {
  const riskFreeRate = 0.045;
  const marketRiskPremium = 0.055;

  const beta = data.beta > 0 ? data.beta : 1.0;
  const costOfEquity = riskFreeRate + beta * marketRiskPremium;

  const costOfDebt =
    data.totalDebt > 10_000_000 && data.interestExpense > 0
      ? Math.max(0.02, Math.min(0.15, data.interestExpense / data.totalDebt))
      : riskFreeRate + 0.015;

  const taxRate = data.taxRate > 0 ? data.taxRate : 0.21;

  const debtWeight =
    data.marketCap + data.totalDebt > 0
      ? data.totalDebt / (data.marketCap + data.totalDebt)
      : 0;
  const equityWeight = 1 - debtWeight;

  const wacc =
    equityWeight * costOfEquity + debtWeight * costOfDebt * (1 - taxRate);

  return {
    riskFreeRate,
    marketRiskPremium,
    beta,
    costOfDebt,
    taxRate,
    equityWeight,
    debtWeight,
    wacc: Math.max(0.04, Math.min(0.25, wacc)),
  };
}

export function buildDefaultAssumptions(data: StockFinancials): AnalysisAssumptions {
  return {
    wacc: calculateWACC(data),
    drivers: { ...data.operatingDrivers },
    terminalGrowthRate: 0.025,
    continuingValueMethod: 'perpetuityWithInflation',
    additionalNonOperatingAssets: 0,
  };
}

function calculateNOPAT(baseRevenue: number, drivers: OperatingDrivers): number {
  return baseRevenue * drivers.operatingProfitMargin * (1 - drivers.cashTaxRate);
}

function projectCashFlows(
  baseRevenue: number,
  drivers: OperatingDrivers,
  wacc: number,
  years: number
): ProjectedYear[] {
  const projected: ProjectedYear[] = [];
  let prevRevenue = baseRevenue;

  for (let year = 1; year <= years; year += 1) {
    const revenue = prevRevenue * (1 + drivers.salesGrowthRate);
    const operatingProfit = revenue * drivers.operatingProfitMargin;
    const nopat = operatingProfit * (1 - drivers.cashTaxRate);
    const deltaSales = revenue - prevRevenue;
    const incrementalInvestment =
      deltaSales *
      (
        drivers.incrementalWorkingCapitalRate +
        drivers.incrementalFixedCapitalRate
      );
    const fcf = nopat - incrementalInvestment;
    const pvFCF = fcf / Math.pow(1 + wacc, year);

    projected.push({
      year,
      revenue,
      nopat,
      incrementalInvestment,
      fcf,
      pvFCF,
    });

    prevRevenue = revenue;
  }

  return projected;
}

function getTerminalStage(
  baseRevenue: number,
  drivers: OperatingDrivers,
  wacc: number,
  years: number
): { projected: ProjectedYear[]; terminalRevenue: number; terminalNOPAT: number } {
  if (years <= 0) {
    return {
      projected: [],
      terminalRevenue: baseRevenue,
      terminalNOPAT: calculateNOPAT(baseRevenue, drivers),
    };
  }

  const projected = projectCashFlows(baseRevenue, drivers, wacc, years);
  const lastYear = projected[projected.length - 1];

  return {
    projected,
    terminalRevenue: lastYear?.revenue ?? baseRevenue,
    terminalNOPAT: lastYear?.nopat ?? calculateNOPAT(baseRevenue, drivers),
  };
}

function computeContinuingValue(
  terminalRevenue: number,
  terminalNOPAT: number,
  drivers: OperatingDrivers,
  wacc: number,
  terminalGrowthRate: number,
  method: ContinuingValueMethod
): number {
  if (wacc <= 0) return NaN;

  if (method === 'perpetuity') {
    return terminalNOPAT / wacc;
  }

  if (wacc <= terminalGrowthRate) {
    return NaN;
  }

  if (method === 'ronicConvergence') {
    const nextNOPAT = terminalNOPAT * (1 + terminalGrowthRate);
    return nextNOPAT / wacc;
  }

  const nextRevenue = terminalRevenue * (1 + terminalGrowthRate);
  const nextNOPAT = nextRevenue * drivers.operatingProfitMargin * (1 - drivers.cashTaxRate);
  const incrementalInvestment =
    (nextRevenue - terminalRevenue) *
    (
      drivers.incrementalWorkingCapitalRate +
      drivers.incrementalFixedCapitalRate
    );
  const nextFCF = nextNOPAT - incrementalInvestment;

  return nextFCF / (wacc - terminalGrowthRate);
}

function corporateToShareholderValue(
  corporateValue: number,
  nonOperatingAssets: number,
  debt: number,
  sharesOutstanding: number
): { shareholderValue: number; valuePerShare: number } {
  const shareholderValue = corporateValue + nonOperatingAssets - debt;
  const valuePerShare =
    sharesOutstanding > 0 ? shareholderValue / sharesOutstanding : NaN;

  return { shareholderValue, valuePerShare };
}

function computeValuationBreakdown(
  baseRevenue: number,
  drivers: OperatingDrivers,
  wacc: number,
  years: number,
  terminalGrowthRate: number,
  method: ContinuingValueMethod,
  nonOperatingAssets: number,
  debt: number,
  sharesOutstanding: number
): ValuationBreakdown {
  const { projected, terminalRevenue, terminalNOPAT } = getTerminalStage(
    baseRevenue,
    drivers,
    wacc,
    years
  );
  const presentValueForecastFCF = projected.reduce((sum, year) => sum + year.pvFCF, 0);
  const continuingValue = computeContinuingValue(
    terminalRevenue,
    terminalNOPAT,
    drivers,
    wacc,
    terminalGrowthRate,
    method
  );
  const presentValueContinuingValue = isFinite(continuingValue)
    ? continuingValue / Math.pow(1 + wacc, years)
    : continuingValue;
  const corporateValue = presentValueForecastFCF + presentValueContinuingValue;
  const { shareholderValue, valuePerShare } = corporateToShareholderValue(
    corporateValue,
    nonOperatingAssets,
    debt,
    sharesOutstanding
  );

  return {
    forecastYears: years,
    presentValueForecastFCF,
    continuingValue,
    presentValueContinuingValue,
    corporateValue,
    shareholderValue,
    valuePerShare,
  };
}

function interpolateBreakdown(
  lower: ValuationBreakdown,
  upper: ValuationBreakdown,
  forecastYears: number
): ValuationBreakdown {
  const span = upper.forecastYears - lower.forecastYears;
  const weight = span > 0 ? (forecastYears - lower.forecastYears) / span : 0;
  const lerp = (a: number, b: number) => a + weight * (b - a);

  return {
    forecastYears,
    presentValueForecastFCF: lerp(
      lower.presentValueForecastFCF,
      upper.presentValueForecastFCF
    ),
    continuingValue: lerp(lower.continuingValue, upper.continuingValue),
    presentValueContinuingValue: lerp(
      lower.presentValueContinuingValue,
      upper.presentValueContinuingValue
    ),
    corporateValue: lerp(lower.corporateValue, upper.corporateValue),
    shareholderValue: lerp(lower.shareholderValue, upper.shareholderValue),
    valuePerShare: lerp(lower.valuePerShare, upper.valuePerShare),
  };
}

function buildBreakdownSeries(
  baseRevenue: number,
  drivers: OperatingDrivers,
  wacc: number,
  terminalGrowthRate: number,
  method: ContinuingValueMethod,
  nonOperatingAssets: number,
  debt: number,
  sharesOutstanding: number
): ValuationBreakdown[] {
  const breakdowns: ValuationBreakdown[] = [];

  for (let years = 0; years <= MAX_FORECAST_YEARS; years += 1) {
    breakdowns.push(
      computeValuationBreakdown(
        baseRevenue,
        drivers,
        wacc,
        years,
        terminalGrowthRate,
        method,
        nonOperatingAssets,
        debt,
        sharesOutstanding
      )
    );
  }

  return breakdowns;
}

function solveImpliedForecastPeriod(
  targetShareholderValue: number,
  breakdowns: ValuationBreakdown[]
): { impliedForecastYears: number; impliedBreakdown: ValuationBreakdown } {
  const first = breakdowns[0];

  if (!first || targetShareholderValue <= 0) {
    return {
      impliedForecastYears: NaN,
      impliedBreakdown: {
        forecastYears: NaN,
        presentValueForecastFCF: NaN,
        continuingValue: NaN,
        presentValueContinuingValue: NaN,
        corporateValue: NaN,
        shareholderValue: NaN,
        valuePerShare: NaN,
      },
    };
  }

  if (!isFinite(first.shareholderValue) || first.shareholderValue >= targetShareholderValue) {
    return {
      impliedForecastYears: 0,
      impliedBreakdown: first,
    };
  }

  let closest = first;
  let closestGap = Math.abs(first.shareholderValue - targetShareholderValue);

  for (let index = 1; index < breakdowns.length; index += 1) {
    const previous = breakdowns[index - 1];
    const current = breakdowns[index];
    const currentGap = Math.abs(current.shareholderValue - targetShareholderValue);

    if (currentGap < closestGap) {
      closest = current;
      closestGap = currentGap;
    }

    const previousDiff = previous.shareholderValue - targetShareholderValue;
    const currentDiff = current.shareholderValue - targetShareholderValue;

    if (currentDiff === 0) {
      return {
        impliedForecastYears: current.forecastYears,
        impliedBreakdown: current,
      };
    }

    if (
      isFinite(previousDiff) &&
      isFinite(currentDiff) &&
      ((previousDiff < 0 && currentDiff > 0) ||
        (previousDiff > 0 && currentDiff < 0))
    ) {
      const weight =
        (targetShareholderValue - previous.shareholderValue) /
        (current.shareholderValue - previous.shareholderValue);
      const rawYears =
        previous.forecastYears +
        weight * (current.forecastYears - previous.forecastYears);
      const impliedForecastYears = Math.round(rawYears * 10) / 10;

      return {
        impliedForecastYears,
        impliedBreakdown: interpolateBreakdown(previous, current, rawYears),
      };
    }
  }

  const last = breakdowns[breakdowns.length - 1];
  if (last && last.shareholderValue < targetShareholderValue) {
    return {
      impliedForecastYears: MAX_FORECAST_YEARS,
      impliedBreakdown: last,
    };
  }

  return {
    impliedForecastYears: closest.forecastYears,
    impliedBreakdown: closest,
  };
}

export function getRecommendation(impliedYears: number): RecommendationType {
  if (!isFinite(impliedYears)) return 'N/A';
  if (impliedYears <= 3) return 'STRONG BUY';
  if (impliedYears <= 7) return 'BUY';
  if (impliedYears <= 15) return 'HOLD';
  if (impliedYears <= 25) return 'SELL';
  return 'STRONG SELL';
}

export function getRecommendationStrength(impliedYears: number): number {
  if (!isFinite(impliedYears)) return 0;
  const deviation = Math.abs(impliedYears - 10);
  return Math.min(1, deviation / 15);
}

export function buildSensitivityCurve(
  breakdowns: ValuationBreakdown[]
): SensitivityPoint[] {
  return breakdowns.map((breakdown) => ({
    forecastYears: breakdown.forecastYears,
    intrinsicValue: breakdown.valuePerShare,
  }));
}

export function runReverseFCFAnalysis(
  data: StockFinancials,
  assumptions: AnalysisAssumptions
): ReverseFCFResult {
  const {
    wacc,
    drivers,
    terminalGrowthRate,
    continuingValueMethod,
    additionalNonOperatingAssets,
  } = assumptions;
  const waccRate = wacc.wacc;

  const baseRevenue = data.revenue;
  const sharesOutstanding = data.sharesOutstanding;
  const debt = data.totalDebt;
  const reportedNonOperatingAssets = data.totalCash + data.longTermInvestments;
  const totalNonOperatingAssets =
    reportedNonOperatingAssets + additionalNonOperatingAssets;
  const marketShareholderValue =
    data.marketCap > 0 ? data.marketCap : data.price * sharesOutstanding;
  const marketImpliedCorporateValue =
    marketShareholderValue + debt - totalNonOperatingAssets;

  const currentNOPAT = calculateNOPAT(baseRevenue, drivers);
  const isNegativeNOPAT = currentNOPAT <= 0;

  const emptyBreakdown: ValuationBreakdown = {
    forecastYears: NaN,
    presentValueForecastFCF: NaN,
    continuingValue: NaN,
    presentValueContinuingValue: NaN,
    corporateValue: NaN,
    shareholderValue: NaN,
    valuePerShare: NaN,
  };

  if (isNegativeNOPAT) {
    return {
      impliedForecastYears: NaN,
      projectedCashFlows: [],
      recommendation: 'N/A',
      recommendationStrength: 0,
      sensitivityCurve: [],
      currentNOPAT,
      currentFCF: data.freeCashFlow,
      fcfYield: 0,
      isNegativeNOPAT: true,
      marketShareholderValue,
      marketImpliedCorporateValue,
      debt,
      reportedNonOperatingAssets,
      additionalNonOperatingAssets,
      totalNonOperatingAssets,
      steadyStateValue: NaN,
      steadyStateCorporateValue: NaN,
      steadyStateBreakdown: emptyBreakdown,
      impliedBreakdown: emptyBreakdown,
      continuingValueMethod,
    };
  }

  const breakdowns = buildBreakdownSeries(
    baseRevenue,
    drivers,
    waccRate,
    terminalGrowthRate,
    continuingValueMethod,
    totalNonOperatingAssets,
    debt,
    sharesOutstanding
  );
  const steadyStateBreakdown = breakdowns[0] ?? emptyBreakdown;
  const {
    impliedForecastYears,
    impliedBreakdown,
  } = solveImpliedForecastPeriod(marketShareholderValue, breakdowns);
  const projectedCashFlows = projectCashFlows(
    baseRevenue,
    drivers,
    waccRate,
    Math.min(MAX_FORECAST_YEARS, Math.max(10, Math.ceil(impliedForecastYears || 0)))
  );
  const sensitivityCurve = buildSensitivityCurve(breakdowns);
  const currentFCF = data.freeCashFlow;
  const fcfYield =
    marketImpliedCorporateValue > 0 ? currentFCF / marketImpliedCorporateValue : 0;

  return {
    impliedForecastYears,
    projectedCashFlows,
    recommendation: getRecommendation(impliedForecastYears),
    recommendationStrength: getRecommendationStrength(impliedForecastYears),
    sensitivityCurve,
    currentNOPAT,
    currentFCF,
    fcfYield,
    isNegativeNOPAT: false,
    marketShareholderValue,
    marketImpliedCorporateValue,
    debt,
    reportedNonOperatingAssets,
    additionalNonOperatingAssets,
    totalNonOperatingAssets,
    steadyStateValue: steadyStateBreakdown.valuePerShare,
    steadyStateCorporateValue: steadyStateBreakdown.corporateValue,
    steadyStateBreakdown,
    impliedBreakdown,
    continuingValueMethod,
  };
}
