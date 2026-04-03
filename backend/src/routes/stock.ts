import { Router, Request, Response } from 'express';
import YahooFinance from 'yahoo-finance2';
import { StockFinancials, OperatingDrivers } from '../types';

const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey'],
});
const router = Router();

function safeNumber(val: unknown): number {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function safeNumberOrNull(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

router.get('/:ticker', async (req: Request, res: Response) => {
  const { ticker } = req.params;
  const symbol = ticker.toUpperCase().trim();

  try {
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

    const [summary, quote, fundamentals] = await Promise.all([
      yahooFinance.quoteSummary(symbol, {
        modules: [
          'financialData',
          'defaultKeyStatistics',
          'summaryProfile',
          'price',
        ],
      }),
      yahooFinance.quote(symbol),
      yahooFinance.fundamentalsTimeSeries(symbol, {
        period1: fiveYearsAgo,
        type: 'annual',
        module: 'all',
      }),
    ]) as [any, any, any[]];

    const fd = summary.financialData ?? {};
    const ks = summary.defaultKeyStatistics ?? {};
    const profile = summary.summaryProfile ?? {};
    const priceModule = summary.price ?? {};

    // Annual financial statements — API returns oldest first; reverse for newest-first access
    const annualData = [...fundamentals].reverse();
    const fs0 = annualData[0] ?? {}; // most recent fiscal year
    const fs1 = annualData[1] ?? {}; // prior fiscal year

    // --- Price & Market Data ---
    const price = safeNumber(priceModule.regularMarketPrice ?? quote.regularMarketPrice);
    const priceChange = safeNumber(priceModule.regularMarketChange ?? quote.regularMarketChange);
    const priceChangePct = safeNumber(
      priceModule.regularMarketChangePercent ?? quote.regularMarketChangePercent
    );
    const marketCap = safeNumber(priceModule.marketCap ?? quote.marketCap);
    const sharesOutstanding = safeNumber(ks.sharesOutstanding);

    // --- Debt & Cash ---
    const totalDebt = safeNumber(fd.totalDebt);
    const totalCash = safeNumber(fd.totalCash);
    const netDebt = totalDebt - totalCash;

    // --- Enterprise Value ---
    let enterpriseValue = safeNumber(ks.enterpriseValue);
    if (!enterpriseValue || enterpriseValue <= 0) {
      enterpriseValue = marketCap + netDebt;
    }

    // === Income Statement (current and prior year) ===
    const revenue = safeNumber(fd.totalRevenue ?? fs0.totalRevenue);
    const priorRevenue = safeNumber(fs1.totalRevenue);

    // EBIT: prefer explicit EBIT field, fall back to operating income
    const ebit = safeNumber(fs0.EBIT ?? fs0.operatingIncome);
    const operatingMargin = revenue > 0 ? ebit / revenue : safeNumber(fd.operatingMargins);

    // Interest expense: prefer non-operating line; both signs possible in the API
    const interestExpense = Math.abs(
      safeNumber(fs0.interestExpense ?? fs0.interestExpenseNonOperating)
    );
    const incomeTaxExpense = safeNumber(fs0.taxProvision);
    const incomeBeforeTax = safeNumber(fs0.pretaxIncome);
    const netIncome = safeNumber(fs0.netIncome);

    // Cash tax rate: taxes paid / EBIT — clamp to 0%–50%
    const cashTaxRate =
      ebit > 0
        ? Math.max(0, Math.min(0.5, incomeTaxExpense / ebit))
        : 0.21;

    // GAAP effective tax rate (for WACC debt-shield)
    const taxRate =
      incomeBeforeTax !== 0
        ? Math.max(0, Math.min(0.5, incomeTaxExpense / incomeBeforeTax))
        : 0.21;

    // NOPAT = EBIT × (1 − cash tax rate)
    const nopat = ebit * (1 - cashTaxRate);

    // === Cash Flow Statement ===
    // capitalExpenditure is negative in Yahoo raw data → abs()
    const capitalExpenditures = Math.abs(safeNumber(fs0.capitalExpenditure));
    const depreciation = safeNumber(
      fs0.depreciationAndAmortization ?? fs0.depreciation ?? fs0.depreciationAmortizationDepletion
    );
    // operatingCashflow is still reliable from financialData (TTM)
    const operatingCashFlow = safeNumber(fd.operatingCashflow ?? fs0.operatingCashFlow);

    // === Balance Sheet: current and prior year ===
    const currentAssets0 = safeNumber(fs0.currentAssets);
    const currentLiabilities0 = safeNumber(fs0.currentLiabilities);
    const nwc0 = currentAssets0 - currentLiabilities0;

    const currentAssets1 = safeNumber(fs1.currentAssets);
    const currentLiabilities1 = safeNumber(fs1.currentLiabilities);
    const nwc1 = currentAssets1 - currentLiabilities1;

    // === Compute Operating Value Drivers (Mauboussin) ===
    const deltaSales = revenue - priorRevenue;
    const deltaNWC = nwc0 - nwc1;
    const netCapEx = capitalExpenditures - depreciation;

    const salesGrowthRate =
      priorRevenue > 0
        ? (revenue - priorRevenue) / priorRevenue
        : 0.05;

    const incrementalWorkingCapitalRate =
      Math.abs(deltaSales) > 1_000_000
        ? deltaNWC / deltaSales
        : 0;

    const incrementalFixedCapitalRate =
      Math.abs(deltaSales) > 1_000_000
        ? netCapEx / deltaSales
        : 0;

    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

    const operatingDrivers: OperatingDrivers = {
      salesGrowthRate: clamp(salesGrowthRate, -0.5, 1.0),
      operatingProfitMargin: clamp(operatingMargin, -0.5, 0.8),
      cashTaxRate: clamp(cashTaxRate, 0, 0.5),
      incrementalWorkingCapitalRate: clamp(incrementalWorkingCapitalRate, -0.5, 0.5),
      incrementalFixedCapitalRate: clamp(incrementalFixedCapitalRate, -0.5, 2.0),
    };

    // FCF per Mauboussin: NOPAT − Incremental Investment
    const incrementalInvestment =
      deltaSales *
      (operatingDrivers.incrementalWorkingCapitalRate + operatingDrivers.incrementalFixedCapitalRate);
    const freeCashFlow = nopat - Math.max(0, incrementalInvestment);

    // --- Nonoperating Assets ---
    // Long-term investments: equity-method stakes, held-to-maturity bonds >1yr,
    // investments in affiliated companies. Short-term marketable securities are
    // already captured in totalCash (Yahoo Finance's financialData.totalCash).
    const longTermInvestments = safeNumber(
      fs0.longTermInvestments ?? fs0.investmentsAndAdvances ?? 0
    );

    // --- Historical Revenue (fundamentals already sorted oldest → newest) ---
    const historicalRevenue = fundamentals
      .slice(-5)
      .map((s: any) => ({
        year: (s.date as Date).getFullYear(),
        value: safeNumber(s.totalRevenue),
      }))
      .filter((d: any) => d.value !== 0);

    // --- Risk ---
    const beta = safeNumber(ks.beta ?? fd.beta) || 1.0;

    // --- Analyst data ---
    const targetMeanPrice = safeNumberOrNull(fd.targetMeanPrice);
    const recommendationKey = (fd as any).recommendationKey ?? null;

    // --- Valuation Ratios ---
    const trailingPE = safeNumberOrNull(quote.trailingPE ?? (ks as any).trailingPE);
    const forwardPE = safeNumberOrNull(quote.forwardPE ?? (ks as any).forwardPE);
    const priceToBook = safeNumberOrNull(ks.priceToBook);
    const debtToEquity = safeNumberOrNull(fd.debtToEquity);
    const returnOnEquity = safeNumberOrNull(fd.returnOnEquity);
    const returnOnAssets = safeNumberOrNull(fd.returnOnAssets);

    const result: StockFinancials = {
      ticker: symbol,
      name: String(priceModule.longName ?? priceModule.shortName ?? symbol),
      sector: String((profile as any).sector ?? 'N/A'),
      industry: String((profile as any).industry ?? 'N/A'),
      description: String((profile as any).longBusinessSummary ?? ''),
      country: String((profile as any).country ?? 'N/A'),
      currency: String(priceModule.currency ?? quote.currency ?? 'USD'),
      exchange: String(priceModule.exchangeName ?? quote.fullExchangeName ?? 'N/A'),

      price,
      priceChange,
      priceChangePercent: priceChangePct,
      marketCap,
      enterpriseValue,
      sharesOutstanding,

      totalDebt,
      totalCash,
      netDebt,
      longTermInvestments,

      revenue,
      ebit,
      operatingMargin,
      nopat,
      freeCashFlow,
      operatingCashFlow,
      capitalExpenditures,
      depreciation,
      interestExpense,
      incomeTaxExpense,
      incomeBeforeTax,
      taxRate,
      netIncome,

      currentAssets: currentAssets0,
      currentLiabilities: currentLiabilities0,
      netWorkingCapital: nwc0,
      priorNetWorkingCapital: nwc1,
      priorRevenue,

      operatingDrivers,
      historicalRevenue,

      beta,

      targetMeanPrice,
      recommendationKey,

      trailingPE,
      forwardPE,
      priceToBook,
      debtToEquity,
      returnOnEquity,
      returnOnAssets,
    };

    res.json(result);
  } catch (err: any) {
    console.error(`Error fetching data for ${symbol}:`, err.message);
    res.status(err.name === 'FailedYahooValidationError' ? 404 : 500).json({
      error: err.name ?? 'FetchError',
      message: err.message ?? 'Failed to fetch stock data',
    });
  }
});

export default router;
