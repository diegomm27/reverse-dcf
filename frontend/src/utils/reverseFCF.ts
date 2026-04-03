import {
  StockFinancials,
  AnalysisAssumptions,
  WACCAssumptions,
  OperatingDrivers,
  ReverseFCFResult,
  RecommendationType,
  SensitivityPoint,
  ProjectedYear,
} from '../types';

// ─── WACC Calculation (auto-filled from source data) ──────────────────────────

export function calculateWACC(data: StockFinancials): WACCAssumptions {
  const riskFreeRate = 0.045; // ~US 10Y Treasury
  const marketRiskPremium = 0.055; // Damodaran ERP

  // Beta from Yahoo Finance
  const beta = data.beta > 0 ? data.beta : 1.0;
  const costOfEquity = riskFreeRate + beta * marketRiskPremium;

  // Cost of debt: Interest Expense / Total Debt (YTM proxy)
  const costOfDebt =
    data.totalDebt > 10_000_000 && data.interestExpense > 0
      ? Math.max(0.02, Math.min(0.15, data.interestExpense / data.totalDebt))
      : riskFreeRate + 0.015;

  // Tax rate for WACC shield: GAAP effective rate
  const taxRate = data.taxRate > 0 ? data.taxRate : 0.21;

  // Capital structure weights (market value basis)
  const debtWeight =
    data.marketCap + data.totalDebt > 0
      ? data.totalDebt / (data.marketCap + data.totalDebt)
      : 0;
  const equityWeight = 1 - debtWeight;

  // WACC = (E/V) × Ke + (D/V) × Kd × (1−t)
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
    terminalGrowthRate: 0.025, // ~inflation
  };
}

// ─── Mauboussin FCF Projection Engine ─────────────────────────────────────────

/**
 * Project FCF for each year using Mauboussin's operating value drivers:
 *   Sales(t) = Sales(t-1) × (1 + salesGrowthRate)
 *   NOPAT(t) = Sales(t) × OPM × (1 − cashTaxRate)
 *   ΔSales(t) = Sales(t) − Sales(t-1)
 *   IncrementalInvestment(t) = ΔSales × (incWCRate + incFCRate)
 *   FCF(t) = NOPAT(t) − IncrementalInvestment(t)
 */
function projectCashFlows(
  baseRevenue: number,
  drivers: OperatingDrivers,
  wacc: number,
  years: number
): ProjectedYear[] {
  const projected: ProjectedYear[] = [];
  let prevRevenue = baseRevenue;

  for (let t = 1; t <= years; t++) {
    const revenue = prevRevenue * (1 + drivers.salesGrowthRate);
    const operatingProfit = revenue * drivers.operatingProfitMargin;
    const nopat = operatingProfit * (1 - drivers.cashTaxRate);
    const deltaSales = revenue - prevRevenue;
    const incrementalInvestment =
      deltaSales * (drivers.incrementalWorkingCapitalRate + drivers.incrementalFixedCapitalRate);
    const fcf = nopat - incrementalInvestment;
    const pvFCF = fcf / Math.pow(1 + wacc, t);

    projected.push({
      year: t,
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

/**
 * Compute Enterprise Value (corporate value) using Mauboussin's framework:
 *   - Explicit forecast: project FCF for `years` using operating drivers
 *   - Residual value: perpetuity at terminal growth (no value creation beyond forecast)
 */
function computeCorporateValue(
  baseRevenue: number,
  drivers: OperatingDrivers,
  wacc: number,
  years: number,
  terminalGrowthRate: number
): number {
  if (wacc <= terminalGrowthRate) return Infinity;

  const projected = projectCashFlows(baseRevenue, drivers, wacc, years);
  const pvExplicit = projected.reduce((sum, p) => sum + p.pvFCF, 0);

  // Residual / continuing value after the explicit forecast
  // At the end of the forecast, the company grows only at terminalGrowthRate
  // and earns no economic profit above WACC → Gordon Growth on last year's NOPAT
  const lastYear = projected[projected.length - 1];
  let residualValue: number;

  if (lastYear) {
    // Mauboussin "Expectations Investing" continuing value (p. 62):
    // Beyond the competitive advantage period, RONIC converges to WACC.
    // When RONIC = WACC, growth adds zero NPV → reinvestment rate = g/WACC
    // FCF_{T+1} = NOPAT_{T+1} × (1 − g/WACC)
    // CV = FCF_{T+1} / (WACC − g) = NOPAT_{T+1} / WACC
    // (the (WACC−g) terms cancel — CV is independent of g when RONIC=WACC)
    residualValue = (lastYear.nopat * (1 + terminalGrowthRate)) / wacc;
    residualValue /= Math.pow(1 + wacc, years); // discount to present
  } else {
    // 0 years of explicit forecast: immediate steady-state from current NOPAT
    const currentNOPAT = baseRevenue * drivers.operatingProfitMargin * (1 - drivers.cashTaxRate);
    residualValue = (currentNOPAT * (1 + terminalGrowthRate)) / wacc;
  }

  return pvExplicit + residualValue;
}

/**
 * Mauboussin shareholder value bridge:
 *   Equity = OperatingValue + NonoperatingAssets − TotalDebt + Cash
 *          = OperatingValue + LongTermInvestments − NetDebt
 *
 * LongTermInvestments covers equity-method stakes, affiliated company
 * investments, and held-to-maturity securities >1yr.
 * Short-term marketable securities are already captured in totalCash
 * (Yahoo Finance's financialData.totalCash includes them), so they
 * reduce netDebt automatically.
 *
 * NOTE: overfunded pensions, NOL carryforwards, and nonconsolidated
 * subsidiaries at fair value are not available from Yahoo Finance and
 * are therefore omitted — a known but unavoidable limitation.
 */
function evToEquityPerShare(
  operatingEV: number,
  netDebt: number,
  longTermInvestments: number,
  sharesOutstanding: number
): number {
  if (sharesOutstanding <= 0) return 0;
  return Math.max(0, (operatingEV + longTermInvestments - netDebt) / sharesOutstanding);
}

// ─── Implied Forecast Period (PIE) ────────────────────────────────────────────

/**
 * CORE: Given current operating drivers, find how many years of that performance
 * the stock price requires. Binary search on forecast period.
 */
export function findImpliedForecastYears(
  baseRevenue: number,
  marketEV: number,
  drivers: OperatingDrivers,
  wacc: number,
  terminalGrowthRate: number
): number {
  const currentNOPAT = baseRevenue * drivers.operatingProfitMargin * (1 - drivers.cashTaxRate);
  if (currentNOPAT <= 0 || marketEV <= 0) return NaN;

  // At 0 years (no explicit forecast, immediate steady-state)
  const ev0 = computeCorporateValue(baseRevenue, drivers, wacc, 0, terminalGrowthRate);
  if (ev0 >= marketEV) return 0;

  // At max
  const MAX_YEARS = 50;
  const evMax = computeCorporateValue(baseRevenue, drivers, wacc, MAX_YEARS, terminalGrowthRate);
  if (evMax < marketEV) return MAX_YEARS;

  // Binary search
  let lo = 0;
  let hi = MAX_YEARS;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const midFloor = Math.floor(mid);
    const midCeil = midFloor + 1;
    const evFloor = computeCorporateValue(baseRevenue, drivers, wacc, midFloor, terminalGrowthRate);
    const evCeil = computeCorporateValue(baseRevenue, drivers, wacc, midCeil, terminalGrowthRate);
    const frac = mid - midFloor;
    const evMid = evFloor + frac * (evCeil - evFloor);

    if (evMid < marketEV) {
      lo = mid;
    } else {
      hi = mid;
    }
    if (hi - lo < 0.01) break;
  }

  return Math.round(((lo + hi) / 2) * 10) / 10;
}

// ─── Recommendation Logic ─────────────────────────────────────────────────────

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

// ─── Sensitivity Curve ────────────────────────────────────────────────────────

export function buildSensitivityCurve(
  baseRevenue: number,
  netDebt: number,
  longTermInvestments: number,
  sharesOutstanding: number,
  drivers: OperatingDrivers,
  wacc: number,
  terminalGrowthRate: number
): SensitivityPoint[] {
  const points: SensitivityPoint[] = [];
  for (let y = 0; y <= 25; y++) {
    const ev = computeCorporateValue(baseRevenue, drivers, wacc, y, terminalGrowthRate);
    const price = evToEquityPerShare(ev, netDebt, longTermInvestments, sharesOutstanding);
    points.push({ forecastYears: y, intrinsicValue: price });
  }
  return points;
}

// ─── Main Analysis Entry Point ────────────────────────────────────────────────

export function runReverseFCFAnalysis(
  data: StockFinancials,
  assumptions: AnalysisAssumptions
): ReverseFCFResult {
  const { wacc, drivers, terminalGrowthRate } = assumptions;
  const waccRate = wacc.wacc;

  const baseRevenue = data.revenue;
  const totalEV = data.enterpriseValue;
  const netDebt = data.netDebt;
  const longTermInvestments = data.longTermInvestments;
  const shares = data.sharesOutstanding;

  // Implied OPERATING enterprise value:
  // totalEV (from market) = OperatingEV + NonoperatingAssets
  // We subtract long-term investments so the PIE binary search compares
  // computed operating value against the market's implied operating EV only.
  const impliedOperatingEV = Math.max(0, totalEV - longTermInvestments);

  const currentNOPAT = baseRevenue * drivers.operatingProfitMargin * (1 - drivers.cashTaxRate);
  const isNegativeNOPAT = currentNOPAT <= 0;

  // Core PIE — solve for operating value only
  const impliedForecastYears = isNegativeNOPAT
    ? NaN
    : findImpliedForecastYears(baseRevenue, impliedOperatingEV, drivers, waccRate, terminalGrowthRate);

  // Projected cash flows (show first 10 years)
  const projectedCashFlows = isNegativeNOPAT
    ? []
    : projectCashFlows(baseRevenue, drivers, waccRate, 10);

  // Intrinsic value at 10Y — equity bridge adds back long-term investments
  const ev10Y = isNegativeNOPAT
    ? 0
    : computeCorporateValue(baseRevenue, drivers, waccRate, 10, terminalGrowthRate);
  const intrinsicValue10Y = evToEquityPerShare(ev10Y, netDebt, longTermInvestments, shares);
  const marginOfSafety =
    intrinsicValue10Y > 0
      ? (intrinsicValue10Y - data.price) / intrinsicValue10Y
      : 0;

  // Steady-state (0 years explicit forecast)
  const ev0 = isNegativeNOPAT
    ? 0
    : computeCorporateValue(baseRevenue, drivers, waccRate, 0, terminalGrowthRate);
  const steadyStateValue = evToEquityPerShare(ev0, netDebt, longTermInvestments, shares);

  // Recommendation
  const recommendation = isNegativeNOPAT
    ? 'N/A'
    : getRecommendation(impliedForecastYears);
  const recommendationStrength = isNegativeNOPAT
    ? 0
    : getRecommendationStrength(impliedForecastYears);

  // Sensitivity
  const sensitivityCurve = isNegativeNOPAT
    ? []
    : buildSensitivityCurve(baseRevenue, netDebt, longTermInvestments, shares, drivers, waccRate, terminalGrowthRate);

  // Supporting metrics — use reported/current FCF on an operating-EV basis.
  const currentFCF = data.freeCashFlow;
  const fcfYield = impliedOperatingEV > 0 ? currentFCF / impliedOperatingEV : 0;

  return {
    impliedForecastYears,
    projectedCashFlows,
    intrinsicValue10Y,
    marginOfSafety,
    recommendation,
    recommendationStrength,
    sensitivityCurve,
    currentNOPAT,
    currentFCF,
    fcfYield,
    isNegativeNOPAT,
    enterpriseValue: impliedOperatingEV,
    netDebt,
    steadyStateValue,
    steadyStateOperatingEV: ev0,
    longTermInvestments,
  };
}
