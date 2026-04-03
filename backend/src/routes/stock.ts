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

function normalizeCurrencyUnit(currency: string | null | undefined): { code: string; unitScale: number } {
  const rawCode = String(currency ?? '').trim();
  if (!rawCode) return { code: 'USD', unitScale: 1 };

  switch (rawCode) {
    case 'GBp':
    case 'GBX':
      return { code: 'GBP', unitScale: 0.01 };
    case 'ZAc':
      return { code: 'ZAR', unitScale: 0.01 };
    case 'ILA':
      return { code: 'ILS', unitScale: 0.01 };
    default:
      return { code: rawCode.toUpperCase(), unitScale: 1 };
  }
}

async function getFxRateToQuoteCurrency(
  yf: InstanceType<typeof YahooFinance>,
  fromCurrency: string | null | undefined,
  toCurrency: string | null | undefined
): Promise<number> {
  const from = normalizeCurrencyUnit(fromCurrency);
  const to = normalizeCurrencyUnit(toCurrency);

  if (from.code === to.code) {
    return from.unitScale / to.unitScale;
  }

  const readFxQuote = async (symbol: string, invert = false): Promise<number> => {
    try {
      const fxQuote = await yf.quote(symbol);
      const rate = safeNumber(
        fxQuote.regularMarketPrice ?? fxQuote.regularMarketPreviousClose ?? fxQuote.previousClose
      );

      if (rate > 0) {
        return invert ? 1 / rate : rate;
      }
    } catch {
      // Fall through to alternate symbol or 1.0 fallback below.
    }

    return 0;
  };

  const directRate = await readFxQuote(`${from.code}${to.code}=X`);
  if (directRate > 0) {
    return directRate * (from.unitScale / to.unitScale);
  }

  const inverseRate = await readFxQuote(`${to.code}${from.code}=X`, true);
  if (inverseRate > 0) {
    return inverseRate * (from.unitScale / to.unitScale);
  }

  return 1;
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
    const currency = String(priceModule.currency ?? quote.currency ?? 'USD');
    const reportingCurrency = String(
      fd.financialCurrency ?? quote.financialCurrency ?? priceModule.financialCurrency ?? currency
    );
    const fxRateToQuoteCurrency = await getFxRateToQuoteCurrency(
      yahooFinance,
      reportingCurrency,
      currency
    );
    const toQuoteCurrency = (value: unknown): number => safeNumber(value) * fxRateToQuoteCurrency;
    const marketCap = safeNumber(priceModule.marketCap ?? quote.marketCap);
    const reportedSharesOutstanding = safeNumber(
      priceModule.sharesOutstanding ??
      quote.sharesOutstanding ??
      ks.impliedSharesOutstanding ??
      ks.sharesOutstanding
    );
    const impliedSharesOutstanding = price > 0 && marketCap > 0 ? marketCap / price : 0;
    const sharesOutstanding =
      impliedSharesOutstanding > 0 &&
      (!reportedSharesOutstanding ||
        Math.abs(reportedSharesOutstanding - impliedSharesOutstanding) / impliedSharesOutstanding > 0.1)
        ? impliedSharesOutstanding
        : reportedSharesOutstanding || impliedSharesOutstanding;

    // --- Debt & Cash ---
    const totalDebt = toQuoteCurrency(fd.totalDebt);
    const totalCash = toQuoteCurrency(fd.totalCash);
    const netDebt = totalDebt - totalCash;

    // --- Enterprise Value ---
    let enterpriseValue = safeNumber(ks.enterpriseValue);
    if (!enterpriseValue || enterpriseValue <= 0) {
      enterpriseValue = marketCap + netDebt;
    }

    // === Income Statement (current and prior year) ===
    const revenue = toQuoteCurrency(fd.totalRevenue ?? fs0.totalRevenue);
    const priorRevenue = toQuoteCurrency(fs1.totalRevenue);

    // EBIT: prefer explicit EBIT field, fall back to operating income
    const ebit = toQuoteCurrency(fs0.EBIT ?? fs0.operatingIncome);
    const operatingMargin = revenue > 0 ? ebit / revenue : safeNumber(fd.operatingMargins);

    // Interest expense: prefer non-operating line; both signs possible in the API
    const interestExpense = Math.abs(
      toQuoteCurrency(fs0.interestExpense ?? fs0.interestExpenseNonOperating)
    );
    const incomeTaxExpense = toQuoteCurrency(fs0.taxProvision);
    const incomeBeforeTax = toQuoteCurrency(fs0.pretaxIncome);
    const netIncome = toQuoteCurrency(fs0.netIncome);

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
    const capitalExpenditures = Math.abs(toQuoteCurrency(fs0.capitalExpenditure));
    const depreciation = toQuoteCurrency(
      fs0.depreciationAndAmortization ?? fs0.depreciation ?? fs0.depreciationAmortizationDepletion
    );
    // operatingCashflow is still reliable from financialData (TTM)
    const operatingCashFlow = toQuoteCurrency(fd.operatingCashflow ?? fs0.operatingCashFlow);

    // === Balance Sheet: current and prior year ===
    const currentAssets0 = toQuoteCurrency(fs0.currentAssets);
    const currentLiabilities0 = toQuoteCurrency(fs0.currentLiabilities);
    const nwc0 = currentAssets0 - currentLiabilities0;

    const currentAssets1 = toQuoteCurrency(fs1.currentAssets);
    const currentLiabilities1 = toQuoteCurrency(fs1.currentLiabilities);
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

    // Reported TTM FCF when Yahoo provides it; otherwise fall back to the
    // modeled annual operating FCF derived from the value drivers.
    const incrementalInvestment =
      deltaSales *
      (operatingDrivers.incrementalWorkingCapitalRate + operatingDrivers.incrementalFixedCapitalRate);
    const reportedFreeCashFlow = safeNumberOrNull(fd.freeCashflow);
    const freeCashFlow =
      reportedFreeCashFlow !== null
        ? reportedFreeCashFlow * fxRateToQuoteCurrency
        : nopat - incrementalInvestment;

    // --- Nonoperating Assets ---
    // Long-term investments: equity-method stakes, held-to-maturity bonds >1yr,
    // investments in affiliated companies. Short-term marketable securities are
    // already captured in totalCash (Yahoo Finance's financialData.totalCash).
    const longTermInvestments = toQuoteCurrency(
      fs0.longTermInvestments ?? fs0.investmentsAndAdvances ?? 0
    );

    // --- Historical Revenue (fundamentals already sorted oldest → newest) ---
    const historicalRevenue = fundamentals
      .slice(-5)
      .map((s: any) => ({
        year: (s.date as Date).getFullYear(),
        value: toQuoteCurrency(s.totalRevenue),
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
      currency,
      reportingCurrency,
      fxRateToQuoteCurrency,
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
