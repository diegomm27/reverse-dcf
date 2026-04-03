import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import StockOverview from './components/StockOverview';
import AssumptionsPanel from './components/AssumptionsPanel';
import FCFAnalysis from './components/FCFAnalysis';
import RecommendationCard from './components/RecommendationCard';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import { StockFinancials, AnalysisAssumptions, ReverseFCFResult } from './types';
import { fetchStockData } from './services/api';
import { buildDefaultAssumptions, runReverseFCFAnalysis } from './utils/reverseFCF';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

type AppStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface HeroProps {
  onSearch: (t: string) => void;
  loading: boolean;
}

const Hero: React.FC<HeroProps> = ({ onSearch, loading }) => {
  const { t } = useLanguage();

  return (
    <section className="py-20 px-4 text-center">
      <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs text-gray-500">
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
        {t.hero.badge}
      </div>
      <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-4 tracking-tight">
        {t.hero.title1}{' '}
        <span className="gradient-text">{t.hero.title2}</span>?
      </h1>
      <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-3 leading-relaxed">
        {t.hero.subtitlePrefix}{' '}
        <span className="text-gray-700 font-medium">{t.hero.subtitleBold}</span>{' '}
        {t.hero.subtitleSuffix}
      </p>
      <p className="text-gray-400 text-sm mb-10">
        {t.hero.methodology}{' '}
        <span className="text-gray-500 italic">
          Expectation Investing — Mauboussin & Rappaport
        </span>
      </p>
      <SearchBar onSearch={onSearch} loading={loading} className="max-w-2xl mx-auto" />

      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-sm">
        {t.hero.steps.map(({ title, desc }, i) => (
          <div
            key={i}
            className="card p-5 text-left"
          >
            <div className="w-7 h-7 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 font-semibold text-sm mb-3">
              {i + 1}
            </div>
            <div className="font-medium text-gray-900 mb-1">{title}</div>
            <div className="text-gray-500 text-xs leading-relaxed">{desc}</div>
          </div>
        ))}
      </div>
    </section>
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

  // Recalculate whenever assumptions change
  useEffect(() => {
    if (stockData && assumptions) {
      const r = runReverseFCFAnalysis(stockData, assumptions);
      setResult(r);
    }
  }, [stockData, assumptions]);

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

  return (
    <div className="min-h-screen bg-white">
      <Header onHome={handleHome} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Search bar visible when results are loaded */}
        {status === 'loaded' && (
          <div className="pt-6 pb-2">
            <SearchBar
              onSearch={handleSearch}
              loading={status === ('loading' as AppStatus)}
              className="max-w-2xl"
            />
          </div>
        )}

        {/* Hero / Landing */}
        {status === 'idle' && <Hero onSearch={handleSearch} loading={false} />}

        {/* Loading */}
        {status === 'loading' && <LoadingSpinner ticker={currentTicker} />}

        {/* Error */}
        {status === 'error' && (
          <ErrorMessage message={errorMsg} onRetry={handleRetry} />
        )}

        {/* Results */}
        {status === 'loaded' && stockData && assumptions && result && (
          <div id="results" className="space-y-4 pt-4">
            {/* Stock Overview */}
            <StockOverview data={stockData} />

            {/* Two-column layout: Assumptions | Recommendation */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <AssumptionsPanel
                  assumptions={assumptions}
                  defaultDrivers={stockData.operatingDrivers}
                  onChange={setAssumptions}
                />
              </div>
              <div className="lg:col-span-3">
                <RecommendationCard
                  result={result}
                  currentPrice={stockData.price}
                  currency={stockData.currency}
                />
              </div>
            </div>

            {/* FCF Analysis + Sensitivity */}
            <FCFAnalysis data={stockData} result={result} assumptions={assumptions} />

            {/* Company Description */}
            {stockData.description && (
              <div className="card p-6">
                <div className="section-title mb-3">{t.about} {stockData.name}</div>
                <p className="text-gray-500 text-sm leading-relaxed line-clamp-4 hover:line-clamp-none transition-all cursor-pointer">
                  {stockData.description}
                </p>
              </div>
            )}

            {/* Disclaimer */}
            <div className="text-center text-xs text-gray-400 pb-4 leading-relaxed max-w-3xl mx-auto">
              {t.disclaimer}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <LanguageProvider>
    <AppInner />
  </LanguageProvider>
);

export default App;
