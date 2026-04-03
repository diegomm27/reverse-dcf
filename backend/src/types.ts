export interface HistoricalDataPoint {
  year: number;
  value: number;
}

/**
 * Mauboussin Operating Value Drivers — derived from financial statements.
 */
export interface OperatingDrivers {
  salesGrowthRate: number;           // Recent revenue growth rate
  operatingProfitMargin: number;     // EBIT / Revenue
  cashTaxRate: number;               // Cash taxes / Operating Profit
  incrementalWorkingCapitalRate: number;  // Δ NWC / Δ Sales
  incrementalFixedCapitalRate: number;    // (CapEx − Depreciation) / Δ Sales
}

export interface StockFinancials {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  description: string;
  country: string;
  currency: string;
  reportingCurrency: string;
  fxRateToQuoteCurrency: number;
  exchange: string;

  // Price & Valuation
  price: number;
  priceChange: number;
  priceChangePercent: number;
  marketCap: number;
  enterpriseValue: number;
  sharesOutstanding: number;

  // Balance Sheet
  totalDebt: number;
  totalCash: number;
  netDebt: number;
  longTermInvestments: number;

  // Current Financials
  revenue: number;
  ebit: number;
  operatingMargin: number;
  nopat: number;                    // EBIT × (1 − cash tax rate)
  freeCashFlow: number;             // NOPAT − Incremental Investment
  operatingCashFlow: number;
  capitalExpenditures: number;
  depreciation: number;
  interestExpense: number;
  incomeTaxExpense: number;
  incomeBeforeTax: number;
  taxRate: number;
  netIncome: number;

  // Working Capital
  currentAssets: number;
  currentLiabilities: number;
  netWorkingCapital: number;
  priorNetWorkingCapital: number;

  // Prior year data (for incremental rates)
  priorRevenue: number;

  // Operating Value Drivers (auto-derived)
  operatingDrivers: OperatingDrivers;

  // Historical Revenue (for scenarios)
  historicalRevenue: HistoricalDataPoint[];

  // Risk
  beta: number;

  // Analyst targets
  targetMeanPrice: number | null;
  recommendationKey: string | null;

  // Ratios
  trailingPE: number | null;
  forwardPE: number | null;
  priceToBook: number | null;
  debtToEquity: number | null;
  returnOnEquity: number | null;
  returnOnAssets: number | null;
}

export interface ApiError {
  error: string;
  message: string;
}
