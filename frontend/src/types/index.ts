export interface HistoricalDataPoint {
  year: number;
  value: number;
}

export type ValuationModelProfile = 'standard' | 'financialLike';

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
  valuationModelProfile: ValuationModelProfile;
  description: string;
  country: string;
  currency: string;
  reportingCurrency: string;
  fxRateToQuoteCurrency: number;
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
  longTermInvestments: number;

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

export type ContinuingValueMethod =
  | 'perpetuity'
  | 'perpetuityWithInflation'
  | 'ronicConvergence';

export interface AnalysisAssumptions {
  wacc: WACCAssumptions;
  drivers: OperatingDrivers;
  terminalGrowthRate: number;
  continuingValueMethod: ContinuingValueMethod;
  additionalNonOperatingAssets: number;
}

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

export interface ValuationBreakdown {
  forecastYears: number;
  presentValueForecastFCF: number;
  continuingValue: number;
  presentValueContinuingValue: number;
  corporateValue: number;
  shareholderValue: number;
  valuePerShare: number;
}

export interface ReverseFCFResult {
  impliedForecastYears: number;
  projectedCashFlows: ProjectedYear[];

  recommendation: RecommendationType;
  recommendationStrength: number;

  sensitivityCurve: SensitivityPoint[];

  currentNOPAT: number;
  currentFCF: number;
  fcfYield: number;
  isNegativeNOPAT: boolean;
  marketShareholderValue: number;
  marketImpliedCorporateValue: number;
  debt: number;
  reportedNonOperatingAssets: number;
  additionalNonOperatingAssets: number;
  totalNonOperatingAssets: number;
  steadyStateValue: number;
  steadyStateCorporateValue: number;
  steadyStateBreakdown: ValuationBreakdown;
  impliedBreakdown: ValuationBreakdown;
  continuingValueMethod: ContinuingValueMethod;
}
