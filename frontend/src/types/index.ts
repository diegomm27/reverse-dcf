// ─── Stock Data (from backend) ──────────────────────────────────────────────

export interface HistoricalDataPoint {
  year: number;
  value: number;
}

export interface OperatingDrivers {
  salesGrowthRate: number;
  operatingProfitMargin: number;
  cashTaxRate: number;
  incrementalWorkingCapitalRate: number;
  incrementalFixedCapitalRate: number;
}

export interface StockFinancials {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  description: string;
  country: string;
  currency: string;
  exchange: string;

  price: number;
  priceChange: number;
  priceChangePercent: number;
  marketCap: number;
  enterpriseValue: number;
  sharesOutstanding: number;

  totalDebt: number;
  totalCash: number;
  netDebt: number;
  longTermInvestments: number; // equity-method stakes, affiliated company investments, LT bonds

  revenue: number;
  ebit: number;
  operatingMargin: number;
  nopat: number;
  freeCashFlow: number;
  operatingCashFlow: number;
  capitalExpenditures: number;
  depreciation: number;
  interestExpense: number;
  incomeTaxExpense: number;
  incomeBeforeTax: number;
  taxRate: number;
  netIncome: number;

  currentAssets: number;
  currentLiabilities: number;
  netWorkingCapital: number;
  priorNetWorkingCapital: number;
  priorRevenue: number;

  operatingDrivers: OperatingDrivers;
  historicalRevenue: HistoricalDataPoint[];

  beta: number;

  targetMeanPrice: number | null;
  recommendationKey: string | null;

  trailingPE: number | null;
  forwardPE: number | null;
  priceToBook: number | null;
  debtToEquity: number | null;
  returnOnEquity: number | null;
  returnOnAssets: number | null;
}

// ─── WACC Assumptions ────────────────────────────────────────────────────────

export interface WACCAssumptions {
  riskFreeRate: number;
  marketRiskPremium: number;
  beta: number;
  costOfDebt: number;
  taxRate: number;
  equityWeight: number;
  debtWeight: number;
  wacc: number;
}

// ─── Analysis Assumptions ────────────────────────────────────────────────────
// These represent what the MARKET is expected to produce (current/consensus).
// The model projects FCF forward using these drivers and solves for how many
// years of this performance justify the current price.

export interface AnalysisAssumptions {
  wacc: WACCAssumptions;
  drivers: OperatingDrivers;     // The 5 Mauboussin operating value drivers
  terminalGrowthRate: number;    // Inflation / steady-state growth (~1.5–3%)
}

// ─── Analysis Result ─────────────────────────────────────────────────────────

export type RecommendationType =
  | 'STRONG BUY'
  | 'BUY'
  | 'HOLD'
  | 'SELL'
  | 'STRONG SELL'
  | 'N/A';

export interface SensitivityPoint {
  forecastYears: number;
  intrinsicValue: number;
}

export interface ProjectedYear {
  year: number;
  revenue: number;
  nopat: number;
  incrementalInvestment: number;
  fcf: number;
  pvFCF: number;
}

export interface ReverseFCFResult {
  // Core PIE output
  impliedForecastYears: number;

  // Projected cash flows at current drivers
  projectedCashFlows: ProjectedYear[];

  // Intrinsic value at a standard 10Y horizon
  intrinsicValue10Y: number;
  marginOfSafety: number;

  // Verdict
  recommendation: RecommendationType;
  recommendationStrength: number;

  // Sensitivity: price vs forecast years
  sensitivityCurve: SensitivityPoint[];

  // Supporting metrics
  currentNOPAT: number;
  currentFCF: number;
  fcfYield: number;
  isNegativeNOPAT: boolean;
  enterpriseValue: number;       // Implied OPERATING EV (totalEV − longTermInvestments)
  netDebt: number;
  steadyStateValue: number;      // Per-share value with 0 years of explicit forecast
  steadyStateOperatingEV: number; // Raw operating EV at 0 years (before equity bridge)
  longTermInvestments: number;   // Nonoperating assets deducted from total EV
}
