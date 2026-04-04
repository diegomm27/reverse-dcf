import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import StockOverview from './components/StockOverview';
import AssumptionsPanel from './components/AssumptionsPanel';
import FCFAnalysis, {
  FCFBreakdownCard,
  FCFSensitivityCard,
} from './components/FCFAnalysis';
import RecommendationCard from './components/RecommendationCard';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import { StockFinancials, AnalysisAssumptions, ReverseFCFResult } from './types';
import { fetchStockData } from './services/api';
import { buildDefaultAssumptions, runReverseFCFAnalysis } from './utils/reverseFCF';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import AdBanner from './components/AdBanner';

type AppStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface HeroProps {
  onSearch: (t: string) => void;
  loading: boolean;
}

const Hero: React.FC<HeroProps> = ({ onSearch, loading }) => {
  const { t } = useLanguage();

  return (
    <section className="px-4 pb-12 pt-8 sm:pt-10">
      <div className="card relative overflow-hidden px-5 py-7 sm:px-8 sm:py-10 lg:px-10">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-[rgba(0,176,238,0.11)] blur-[80px]" />
          <div className="absolute -right-10 top-0 h-48 w-48 rounded-full bg-[rgba(187,211,217,0.18)] blur-[60px]" />
        </div>

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.85fr)] lg:items-start">
          <div className="text-center lg:text-left">
            <div className="accent-chip mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-strong)] shadow-[0_0_8px_var(--accent-glow)]" />
              {t.hero.badge}
            </div>

            <h1 className="max-w-3xl text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl lg:text-5xl">
              {t.hero.title1}{' '}
              <span className="gradient-text">{t.hero.title2}</span>?
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[color:var(--muted)] sm:text-base lg:mx-0">
              {t.hero.subtitlePrefix}{' '}
              <span className="font-semibold text-[color:var(--text)]">{t.hero.subtitleBold}</span>{' '}
              {t.hero.subtitleSuffix}
            </p>

            <p className="mt-3 text-xs text-[color:var(--muted-soft)]">
              {t.hero.methodology}{' '}
              <span className="font-medium text-[color:var(--muted)]">
                Expectation Investing - Mauboussin & Rappaport
              </span>
            </p>

            <SearchBar
              onSearch={onSearch}
              loading={loading}
              className="mx-auto mt-6 max-w-2xl lg:mx-0"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {t.hero.steps.map(({ title, desc }, i) => (
              <div key={i} className="card-section relative overflow-hidden p-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-strong)] text-xs font-bold text-white shadow-[0_0_16px_var(--accent-glow)]">
                    {i + 1}
                  </div>
                  <div>
                    <div className="mb-0.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--accent)]">
                      {title}
                    </div>
                    <div className="text-xs leading-5 text-[color:var(--muted)]">{desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

interface ResultsNavProps {
  items: Array<{ id: string; label: string }>;
}

const ResultsNav: React.FC<ResultsNavProps> = ({ items }) => {
  const scrollToSection = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="sticky top-[4rem] z-40 pb-1 pt-3">
      <div className="results-nav">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="results-nav-button"
            onClick={() => scrollToSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const AppInner: React.FC = () => {
  const { t } = useLanguage();
  const [status, setStatus] = useState<AppStatus>('idle');
  const [currentTicker, setCurrentTicker] = useState('');
  const [stockData, setStockData] = useState<StockFinancials | null>(null);
  const [assumptions, setAssumptions] = useState<AnalysisAssumptions | null>(null);
  const [result, setResult] = useState<ReverseFCFResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDesktopResults, setIsDesktopResults] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(min-width: 1024px)').matches
  );

  useEffect(() => {
    if (stockData && assumptions) {
      setResult(runReverseFCFAnalysis(stockData, assumptions));
    }
  }, [stockData, assumptions]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleChange = (event: MediaQueryListEvent) => {
      setIsDesktopResults(event.matches);
    };

    setIsDesktopResults(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  const handleSearch = useCallback(async (ticker: string) => {
    setStatus('loading');
    setCurrentTicker(ticker);
    setStockData(null);
    setResult(null);
    setErrorMsg('');

    try {
      const data = await fetchStockData(ticker);
      const defaultAssumptions = buildDefaultAssumptions(data);
      setStockData(data);
      setAssumptions(defaultAssumptions);
      setStatus('loaded');

      setTimeout(
        () => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }),
        100
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'Failed to fetch data. Please check the ticker symbol.';
      setErrorMsg(msg);
      setStatus('error');
    }
  }, []);

  const handleRetry = () => {
    if (currentTicker) handleSearch(currentTicker);
  };

  const handleHome = () => {
    setStatus('idle');
    setStockData(null);
    setResult(null);
    setAssumptions(null);
    setCurrentTicker('');
    setErrorMsg('');
  };

  const resultNavItems = [
    { id: 'overview', label: t.navigation.overview },
    { id: 'assumptions', label: t.navigation.assumptions },
    { id: 'verdict', label: t.navigation.verdict },
    { id: 'analysis', label: t.navigation.analysis },
    ...(stockData?.description ? [{ id: 'about', label: t.navigation.about }] : []),
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header onHome={handleHome} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-8 sm:px-6 lg:px-8">
        {status === 'loaded' && (
          <div className="pb-1 pt-5">
            <SearchBar onSearch={handleSearch} loading={false} className="max-w-2xl" />
            <ResultsNav items={resultNavItems} />
          </div>
        )}

        {status === 'idle' && (
          <>
            <Hero onSearch={handleSearch} loading={false} />
            <AdBanner slot="1234567890" format="horizontal" className="mx-auto max-w-4xl px-4 pb-8" />
          </>
        )}
        {status === 'loading' && <LoadingSpinner ticker={currentTicker} />}
        {status === 'error' && <ErrorMessage message={errorMsg} onRetry={handleRetry} />}

        {status === 'loaded' && stockData && assumptions && result && (
          <div id="results" className="space-y-4 pt-3">
            <section id="overview" className="section-anchor">
              <StockOverview data={stockData} />
            </section>

            {isDesktopResults ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start">
                <div className="min-w-0 space-y-3 lg:col-span-5">
                  <section id="assumptions" className="section-anchor min-w-0">
                    <AssumptionsPanel
                      assumptions={assumptions}
                      defaultDrivers={stockData.operatingDrivers}
                      currency={stockData.currency}
                      reportedNonOperatingAssets={
                        stockData.totalCash + stockData.longTermInvestments
                      }
                      onChange={setAssumptions}
                    />
                  </section>

                  <section className="section-anchor min-w-0">
                    <FCFSensitivityCard
                      data={stockData}
                      result={result}
                      assumptions={assumptions}
                    />
                  </section>
                </div>

                <div className="min-w-0 space-y-3 lg:col-span-7">
                  <section id="verdict" className="section-anchor">
                    <RecommendationCard
                      result={result}
                      currentPrice={stockData.price}
                      currency={stockData.currency}
                    />
                  </section>

                  <section id="analysis" className="section-anchor">
                    <FCFBreakdownCard
                      data={stockData}
                      result={result}
                      assumptions={assumptions}
                    />
                  </section>

                  {stockData.description && (
                    <section id="about" className="section-anchor">
                      <div className="card p-5 sm:p-6">
                        <div className="section-title mb-3">
                          {t.about} {stockData.name}
                        </div>
                        <p className="cursor-pointer text-sm leading-7 text-[color:var(--muted)] line-clamp-4 transition-all hover:line-clamp-none">
                          {stockData.description}
                        </p>
                      </div>
                    </section>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <section id="assumptions" className="section-anchor">
                  <AssumptionsPanel
                    assumptions={assumptions}
                    defaultDrivers={stockData.operatingDrivers}
                    currency={stockData.currency}
                    reportedNonOperatingAssets={
                      stockData.totalCash + stockData.longTermInvestments
                    }
                    onChange={setAssumptions}
                  />
                </section>

                <section id="verdict" className="section-anchor">
                  <RecommendationCard
                    result={result}
                    currentPrice={stockData.price}
                    currency={stockData.currency}
                  />
                </section>

                <section id="analysis" className="section-anchor">
                  <FCFAnalysis data={stockData} result={result} assumptions={assumptions} />
                </section>

                {stockData.description && (
                  <section id="about" className="section-anchor">
                    <div className="card p-5 sm:p-6">
                      <div className="section-title mb-3">
                        {t.about} {stockData.name}
                      </div>
                      <p className="cursor-pointer text-sm leading-7 text-[color:var(--muted)] line-clamp-4 transition-all hover:line-clamp-none">
                        {stockData.description}
                      </p>
                    </div>
                  </section>
                )}
              </div>
            )}

            <div className="mx-auto max-w-2xl pb-2 text-center text-[11px] leading-relaxed text-[color:var(--muted-soft)]">
              {t.disclaimer}
            </div>

            <AdBanner slot="0987654321" format="horizontal" className="mt-4" />
          </div>
        )}
      </main>

      <footer className="border-t border-[color:var(--border)] bg-[color:var(--surface)]">
        <AdBanner slot="1122334455" format="horizontal" className="mx-auto max-w-5xl px-4 py-3" />
        <p className="pb-4 text-center text-[10px] text-[color:var(--muted-soft)]">
          © {new Date().getFullYear()} Reverse FCF · Expectation Investing
        </p>
      </footer>
    </div>
  );
};

const App: React.FC = () => (
  <LanguageProvider>
    <AppInner />
  </LanguageProvider>
);

export default App;
