import React, { useState, useRef, useEffect } from 'react';
import { Search, Loader2, Sparkles } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface SearchBarProps {
  onSearch: (ticker: string) => void;
  loading: boolean;
  className?: string;
}

const POPULAR_TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'BRK-B', 'JPM', 'V'];

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, loading, className = '' }) => {
  const { t } = useLanguage();
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ticker = value.trim().toUpperCase();
    if (ticker) onSearch(ticker);
  };

  const handleChip = (ticker: string) => {
    setValue(ticker);
    onSearch(ticker);
  };

  return (
    <div className={`w-full ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="card card-interactive relative overflow-hidden p-1.5 sm:p-2">
          <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--accent)]" />
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value.toUpperCase())}
                placeholder={t.search.placeholder}
                className="input-field border-0 bg-transparent pl-10 pr-4 text-sm font-semibold uppercase tracking-[0.14em] shadow-none focus:shadow-none"
                disabled={loading}
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            <button
              type="submit"
              disabled={!value.trim() || loading}
              className="btn-primary min-w-[130px] shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{t.search.loading}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{t.search.analyze}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="label mr-1">{t.search.try}</span>
        {POPULAR_TICKERS.map((ticker) => (
          <button
            key={ticker}
            type="button"
            onClick={() => handleChip(ticker)}
            disabled={loading}
            className="ticker-chip"
          >
            {ticker}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchBar;
